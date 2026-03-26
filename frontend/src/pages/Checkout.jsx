import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { ArrowLeft, CheckCircle, Package, Truck, CreditCard, ShieldCheck, Zap, ArrowRight, User, Mail, Phone, MapPin, Edit3, AlertCircle, Plus } from "lucide-react"
import { useTranslation } from 'react-i18next'
import { db } from "../firebase"
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, onSnapshot } from "firebase/firestore"
import axios from "axios"

function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOrdered, setIsOrdered] = useState(false)
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [currentStep, setCurrentStep] = useState(1) // 1: Address, 2: Order Summary, 3: Payment

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!user) {
      navigate('/login')
      return
    }
    if (cartItems.length === 0 && !isOrdered) {
      navigate('/')
    }

    // Fetch user addresses
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const userAddresses = docSnap.data().addresses || [];
        setAddresses(userAddresses);
        if (userAddresses.length > 0 && !selectedAddressId) {
          setSelectedAddressId(userAddresses[0].id);
        }
      }
    });

    return () => unsub();
  }, [cartItems, isOrdered, navigate, user, selectedAddressId])

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
  const isProfileComplete = !!selectedAddress;

  const handlePlaceOrder = async (paymentMethod = 'Razorpay') => {
    if (!user || !isProfileComplete) return
    
    setLoading(true)
    try {
      // 1. Stock Verification (Frontend - safe since user is authenticated)
      for (const item of cartItems) {
        const productRef = doc(db, "products", item._id)
        const productSnap = await getDoc(productRef)
        if (productSnap.exists()) {
          const currentStock = productSnap.data().stock || 0
          if (currentStock < item.quantity) {
            throw new Error(`Item "${item.name}" has insufficient quantity (Only ${currentStock} left).`)
          }
        }
      }

      const totalAmount = cartTotal * 1.18; // Subtotal + 18% Tax
      const backendUrl = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? "http://localhost:5000" : window.location.origin);

      const orderData = {
        userId: user.uid,
        userName: selectedAddress.name,
        userEmail: user.email,
        phone: selectedAddress.phone,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
        orderItems: cartItems.map(item => ({
          id: item._id,
          name: item.name,
          quantity: item.quantity,
          image: item.image,
          price: item.price
        })),
        shippingAddress: {
          address: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip: selectedAddress.pincode
        },
        totalPrice: totalAmount,
        status: 'Ordered',
        statusTimeline: {
          Ordered: serverTimestamp()
        },
        isDelivered: false,
        createdAt: serverTimestamp()
      }

      if (paymentMethod === 'COD') {
        // Create Order in Firestore
        const docRef = await addDoc(collection(db, "orders"), orderData)
        
        // Update Stock in Firestore
        for (const item of cartItems) {
          const productRef = doc(db, "products", item._id)
          await updateDoc(productRef, { stock: increment(-item.quantity) })
        }

        // Notify Admin via Backend (Email only)
        try {
          await axios.post(`${backendUrl}/api/admin/notify-order`, {
            ...orderData,
            orderId: docRef.id
          })
        } catch (notifyErr) {
          console.error("Admin notification failed:", notifyErr)
        }

        setIsOrdered(true)
        clearCart()
        return;
      }

      // Razorpay Flow
      const orderResponse = await axios.post(`${backendUrl}/api/payment/order`, {
        amount: Math.round(totalAmount),
        currency: "INR",
        receipt: `receipt_${Date.now()}`
      })

      const { id: order_id, amount, currency } = orderResponse.data

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: "Sairam Store",
        description: "Electrical Components Purchase",
        image: "/vite.svg",
        order_id: order_id,
        handler: async function (response) {
          const verifyResponse = await axios.post(`${backendUrl}/api/payment/verify`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })

          if (verifyResponse.data.success) {
            // Create Order in Firestore
            const finalOrderData = {
              ...orderData,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            }
            const docRef = await addDoc(collection(db, "orders"), finalOrderData)
            
            // Update Stock
            for (const item of cartItems) {
              const productRef = doc(db, "products", item._id)
              await updateDoc(productRef, { stock: increment(-item.quantity) })
            }

            // Notify Admin
            try {
              await axios.post(`${backendUrl}/api/admin/notify-order`, {
                ...finalOrderData,
                orderId: docRef.id
              })
            } catch (notifyErr) {
              console.error("Admin notification failed:", notifyErr)
            }

            setIsOrdered(true)
            clearCart()
          } else {
            alert("Payment verification failed!")
          }
        },
        prefill: {
          name: selectedAddress.name || user.name,
          email: user.email,
          contact: selectedAddress.phone || user.phone || ""
        },
        theme: {
          color: "#10b981"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (error) {
      console.error("Order failed:", error)
      alert(`Order failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 1, title: t('checkout.address_step'), icon: MapPin },
    { id: 2, title: t('checkout.summary_step'), icon: Package },
    { id: 3, title: t('checkout.payment_step'), icon: CreditCard },
  ]

  if (isOrdered) {
    return (
      <div className="bg-white dark:bg-slate-950 min-h-screen py-24 flex items-center justify-center px-6">
        <div className="text-center max-w-xl w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 text-primary rounded-full flex items-center justify-center mx-auto mb-10 shadow-glow">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-none">{t('checkout.success_title')}</h2>
          <p className="text-muted mb-12">
            {t('checkout.success_desc')}
          </p>
          
          <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] p-10 mb-12 text-left border border-slate-100/50 dark:border-white/5">
            <h4 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 tracking-tight">
              <Truck size={20} className="text-primary" />
              {t('checkout.logistics_summary')}
            </h4>
            <div className="space-y-2 font-bold text-slate-500 text-lg">
              <p className="text-slate-900 dark:text-white">{selectedAddress?.name || user.name}</p>
              <p>{selectedAddress?.address || user.address}</p>
              <p>{selectedAddress?.city || user.city}, {selectedAddress?.state} {selectedAddress?.pincode || user.zip}</p>
              <div className="pt-6 mt-6 border-t border-slate-200/50 dark:border-white/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('checkout.priority_delivery')}</p>
              </div>
            </div>
          </div>
          
          <Link to="/" className="btn-primary inline-flex px-12 h-16 shadow-glow">
            {t('nav.home')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f1f3f6] dark:bg-slate-950 min-h-screen pb-24 transition-colors duration-500">
      {/* Top Stepper - Professional Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm mb-8 sticky top-0 z-40">
        <div className="container mx-auto max-w-7xl px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-glow group-hover:rotate-12 transition-transform">
              <Package className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">SAI<span className="text-primary">RAM</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-4 lg:gap-8">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${currentStep >= step.id ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}`}>
                    {currentStep > step.id ? <CheckCircle size={14} /> : step.id}
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${currentStep >= step.id ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && <div className="w-12 h-[2px] bg-slate-100 dark:bg-white/10"></div>}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
            <ShieldCheck size={18} className="text-primary" />
            <span className="hidden sm:inline">{t('checkout.safe_payments')}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Step 1: Login (Always Completed) */}
            <div className="bg-white dark:bg-slate-900 rounded-sm shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-slate-100 dark:bg-white/10 rounded flex items-center justify-center text-primary font-bold text-xs">1</div>
                  <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('checkout.login_step')}</h3>
                  <CheckCircle size={16} className="text-primary" />
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{user.displayName || user.email.split('@')[0]} <span className="text-slate-400 ml-2">{user.email}</span></p>
                </div>
                <button className="text-primary font-black uppercase tracking-widest text-[10px] hover:underline">{t('checkout.btn_change')}</button>
              </div>
            </div>

            {/* Step 2: Delivery Address */}
            <div className={`bg-white dark:bg-slate-900 rounded-sm shadow-sm overflow-hidden transition-all ${currentStep === 1 ? 'ring-2 ring-primary ring-inset' : ''}`}>
              <div className={`flex items-center justify-between p-4 ${currentStep === 1 ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-white/5 text-slate-400'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${currentStep === 1 ? 'bg-white text-primary' : 'bg-slate-100 dark:bg-white/10 text-primary'}`}>2</div>
                  <h3 className="font-black uppercase tracking-widest text-xs">{t('checkout.address_step')}</h3>
                  {currentStep > 1 && <CheckCircle size={16} className="text-primary" />}
                </div>
                {currentStep > 1 && (
                  <button onClick={() => setCurrentStep(1)} className="bg-white dark:bg-slate-800 text-primary px-4 py-2 rounded-md font-black uppercase tracking-widest text-[10px] shadow-sm border border-slate-100 dark:border-white/10">{t('checkout.btn_change')}</button>
                )}
              </div>

              {currentStep === 1 && (
                <div className="p-6">
                  {!isProfileComplete ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                      <MapPin className="mx-auto text-slate-300 mb-4" size={48} />
                      <p className="text-slate-500 font-bold mb-6">{t('checkout.no_address')}</p>
                      <Link to="/manage-addresses" className="btn-primary h-12 px-8 inline-flex">{t('checkout.btn_add_address')}</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map(addr => (
                        <div key={addr.id} className={`p-4 rounded-xl border-2 transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-slate-50 dark:border-white/5 hover:border-slate-100'}`}>
                          <div className="flex items-start gap-4">
                            <input 
                              type="radio" 
                              checked={selectedAddressId === addr.id} 
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                            />
                            <div className="flex-grow">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-black text-slate-900 dark:text-white">{addr.name}</span>
                                <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('checkout.address_type_home')}</span>
                                <span className="font-black text-slate-900 dark:text-white ml-auto">{addr.phone}</span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                                {addr.address}, {addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
                              </p>
                              {selectedAddressId === addr.id && (
                                <button 
                                  onClick={() => setCurrentStep(2)}
                                  className="bg-[#fb641b] hover:bg-[#f4511e] text-white px-10 h-12 rounded-sm font-black uppercase tracking-widest text-xs shadow-md transition-colors"
                                >
                                  {t('checkout.btn_deliver_here')}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-slate-100 dark:border-white/10">
                        <Link to="/manage-addresses" className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs hover:underline">
                          <Plus size={16} />
                          {t('checkout.btn_add_address')}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep > 1 && selectedAddress && (
                <div className="p-4">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedAddress.name} <span className="text-slate-500 ml-2">{selectedAddress.address}, {selectedAddress.city} - {selectedAddress.pincode}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Order Summary */}
            <div className={`bg-white dark:bg-slate-900 rounded-sm shadow-sm overflow-hidden transition-all ${currentStep === 2 ? 'ring-2 ring-primary ring-inset' : ''}`}>
              <div className={`flex items-center justify-between p-4 ${currentStep === 2 ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-white/5 text-slate-400'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${currentStep === 2 ? 'bg-white text-primary' : 'bg-slate-100 dark:bg-white/10 text-primary'}`}>3</div>
                  <h3 className="font-black uppercase tracking-widest text-xs">{t('checkout.summary_step')}</h3>
                  {currentStep > 2 && <CheckCircle size={16} className="text-primary" />}
                </div>
                {currentStep > 2 && (
                  <button onClick={() => setCurrentStep(2)} className="bg-white dark:bg-slate-800 text-primary px-4 py-2 rounded-md font-black uppercase tracking-widest text-[10px] shadow-sm border border-slate-100 dark:border-white/10">{t('checkout.btn_change')}</button>
                )}
              </div>

              {currentStep === 2 && (
                <div className="p-6">
                  <div className="space-y-6">
                    {cartItems.map(item => (
                      <div key={item._id} className="flex gap-6 pb-6 border-b border-slate-50 dark:border-white/5 last:border-0">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-xl p-2 flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1">{item.name}</h4>
                          <p className="text-xs text-slate-400 mb-2">{t('checkout.seller_label')}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-400 line-through text-sm">₹{(item.price * 1.2).toLocaleString()}</span>
                            <span className="font-black text-slate-900 dark:text-white">₹{item.price.toLocaleString()}</span>
                            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{t('checkout.discount_tag')}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-500 mt-2">{t('cart.quantity')}: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 mb-1">{t('cart.delivery_by')}</p>
                          <p className="text-xs text-emerald-500 font-black">2-3 Days</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex items-center justify-between bg-slate-50 dark:bg-white/5 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 font-bold">{t('checkout.email_info')} <span className="text-slate-900 dark:text-white font-black">{user.email}</span></p>
                    <button 
                      onClick={() => setCurrentStep(3)}
                      className="bg-[#fb641b] hover:bg-[#f4511e] text-white px-10 h-12 rounded-sm font-black uppercase tracking-widest text-xs shadow-md transition-colors"
                    >
                      {t('checkout.btn_continue')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Payment Options */}
            <div className={`bg-white dark:bg-slate-900 rounded-sm shadow-sm overflow-hidden transition-all ${currentStep === 3 ? 'ring-2 ring-primary ring-inset' : ''}`}>
              <div className={`flex items-center p-4 ${currentStep === 3 ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-white/5 text-slate-400'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${currentStep === 3 ? 'bg-white text-primary' : 'bg-slate-100 dark:bg-white/10 text-primary'}`}>4</div>
                  <h3 className="font-black uppercase tracking-widest text-xs">{t('checkout.payment_step')}</h3>
                </div>
              </div>

              {currentStep === 3 && (
                <div className="p-6 space-y-4">
                  {/* Razorpay Option */}
                  <div 
                    onClick={() => handlePlaceOrder('Razorpay')}
                    className="p-4 rounded-xl border-2 border-slate-50 dark:border-white/5 hover:border-primary/30 cursor-pointer transition-all group relative overflow-hidden bg-white dark:bg-slate-800 shadow-sm"
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <CreditCard size={24} />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-black text-slate-900 dark:text-white">{t('checkout.online_payment')}</h4>
                        <p className="text-xs text-slate-500 font-bold">{t('checkout.online_desc')}</p>
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-primary transition-colors group-hover:translate-x-1" size={20} />
                    </div>
                  </div>

                  {/* COD Option */}
                  <div 
                    onClick={() => handlePlaceOrder('COD')}
                    className="p-4 rounded-xl border-2 border-slate-50 dark:border-white/5 hover:border-primary/30 cursor-pointer transition-all group relative overflow-hidden bg-white dark:bg-slate-800 shadow-sm"
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <Truck size={24} />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-black text-slate-900 dark:text-white">{t('checkout.cod')}</h4>
                        <p className="text-xs text-slate-500 font-bold">{t('checkout.cod_desc')}</p>
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-primary transition-colors group-hover:translate-x-1" size={20} />
                    </div>
                  </div>

                  {loading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-xs">{t('checkout.processing')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar: Price Details */}
          <div className="lg:col-span-4 sticky top-28">
            <div className="bg-white dark:bg-slate-900 rounded-sm shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-white/5">
                <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('checkout.price_details')}</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-slate-900 dark:text-white font-medium">
                  <p>{t('checkout.price_items', { count: cartItems.length })}</p>
                  <p>₹{cartTotal.toLocaleString()}</p>
                </div>
                <div className="flex justify-between text-slate-900 dark:text-white font-medium">
                  <p>{t('checkout.discount')}</p>
                  <p className="text-emerald-500">- ₹{(cartTotal * 0.2).toLocaleString()}</p>
                </div>
                <div className="flex justify-between text-slate-900 dark:text-white font-medium">
                  <p>{t('checkout.tax_gst')}</p>
                  <p>₹{(cartTotal * 0.18).toLocaleString()}</p>
                </div>
                <div className="flex justify-between text-slate-900 dark:text-white font-medium">
                  <p>{t('checkout.delivery_charges')}</p>
                  <p className="text-emerald-500 uppercase text-xs font-black">{t('cart.free')}</p>
                </div>
                
                <div className="pt-4 border-t border-dashed border-slate-200 dark:border-white/10 flex justify-between items-center">
                  <p className="text-lg font-black text-slate-900 dark:text-white">{t('checkout.total_amount')}</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">₹{(cartTotal * 1.18).toLocaleString()}</p>
                </div>

                <div className="pt-4 text-emerald-500 font-bold text-sm bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                  {t('checkout.savings', { amount: (cartTotal * 0.2).toLocaleString() })}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 p-4 text-slate-400 font-bold text-xs">
              <ShieldCheck size={24} className="text-slate-300" />
              <p>{t('checkout.secure_footer')}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Checkout
