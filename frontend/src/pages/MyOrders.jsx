import { useState, useEffect } from "react"
import { db } from "../firebase"
import { collection, query, where, updateDoc, doc, onSnapshot } from "firebase/firestore"
import { useAuth } from "../context/AuthContext"
import { Package, Truck, Clock, ArrowLeft, Zap, CheckCircle, CreditCard, ShieldCheck, MapPin } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }

    // Use onSnapshot for Real-time Tracking Updates
    const q = query(
      collection(db, "orders"), 
      where("userId", "==", user.uid)
    )
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          _id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        }
      })

      // Sort manually by date
      ordersData.sort((a, b) => b.createdAt - a.createdAt)
      setOrders(ordersData)
      setLoading(false)
    }, (err) => {
      console.error("Failed to fetch orders:", err)
      setError(err.message)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, navigate])

  const handleMarkAsDone = async (orderId) => {
    if (updatingId) return // Prevent multiple clicks
    
    setUpdatingId(orderId)
    try {
      const orderRef = doc(db, "orders", orderId)
      await updateDoc(orderRef, {
        isDelivered: true,
        status: 'Delivered'
      })
      // Update local state
      setOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, isDelivered: true, status: 'Delivered' } : order
      ))
    } catch (err) {
      console.error("Failed to update order status:", err)
      if (err.code === 'permission-denied') {
        alert(t('orders.error_permission'))
      } else {
        alert(t('orders.error_update') + err.message)
      }
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f3f6] dark:bg-slate-950">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="bg-[#f1f3f6] dark:bg-slate-950 min-h-screen pb-24">
      {/* Professional Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm mb-8 sticky top-0 z-40">
        <div className="container mx-auto max-w-5xl px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-glow group-hover:rotate-12 transition-transform">
              <Package className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">SAI<span className="text-primary">RAM</span></span>
          </Link>
          <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-[0.2em]">{t('orders.title_main')}</h1>
          <Link to="/catalog" className="text-primary font-black uppercase tracking-widest text-[10px] hover:underline flex items-center gap-2">
            <ArrowLeft size={14} />
            {t('orders.btn_shop_more')}
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/20 text-red-600 p-6 rounded-xl mb-8 flex items-center gap-4">
            <Package size={20} className="text-red-500" />
            <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-sm p-20 text-center border border-slate-200 dark:border-white/10 shadow-sm">
            <Package size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-6" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{t('orders.empty_title')}</h2>
            <Link to="/catalog" className="btn-primary inline-flex px-12 h-14 uppercase tracking-widest text-xs font-black">
              {t('orders.btn_start')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="bg-slate-50 dark:bg-white/5 p-4 sm:p-6 border-b border-slate-200 dark:border-white/10 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-wrap gap-6 sm:gap-10">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('orders.label_id')}</p>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">#{order._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('orders.label_date')}</p>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('orders.label_total')}</p>
                      <p className="font-black text-slate-900 dark:text-white text-xs">₹{order.totalPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('orders.payment')}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {order.paymentMethod === 'COD' ? t('orders.cod') : t('orders.online')} - {order.paymentStatus === 'Paid' ? t('orders.paid') : t('orders.pending')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${order.isDelivered ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {order.isDelivered ? <CheckCircle size={14} /> : <Truck size={14} />}
                      {order.isDelivered ? t('orders.status_delivered') : t('orders.status_transit')}
                    </div>
                  </div>
                </div>

                {/* Order Items & Tracking */}
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Items List */}
                    <div className="lg:col-span-7 space-y-6">
                      {order.orderItems.map((item, index) => (
                        <div key={index} className="flex gap-6">
                          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-lg p-2 flex-shrink-0 border border-slate-100 dark:border-white/5">
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-1">{item.name}</h4>
                            <p className="text-xs text-slate-400 font-bold mb-2">{t('orders.qty')}: {item.quantity}</p>
                            <p className="font-black text-slate-900 dark:text-white text-sm italic">₹{item.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Real-time Tracking Timeline */}
                    <div className="lg:col-span-5 bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Zap size={14} className="text-primary" /> {t('orders.tracking')}
                      </h4>
                      
                      <div className="relative space-y-8">
                        {[
                          { label: t('orders.stage_ordered'), icon: Package, key: 'Ordered' },
                          { label: t('orders.stage_packed'), icon: Clock, key: 'Packed' },
                          { label: t('orders.stage_shipped'), icon: Truck, key: 'Shipped' },
                          { label: t('orders.stage_out'), icon: MapPin, key: 'Out for Delivery' },
                          { label: t('orders.stage_delivered'), icon: CheckCircle, key: 'Delivered' }
                        ].map((stage, idx, arr) => {
                          const isCompleted = order.statusTimeline?.[stage.key.replace(/ /g, '_')] || (idx === 0) || order.isDelivered;
                          const isCurrent = order.status === stage.key || (order.isDelivered && stage.key === 'Delivered');
                          const date = order.statusTimeline?.[stage.key.replace(/ /g, '_')]?.toDate ? new Date(order.statusTimeline[stage.key.replace(/ /g, '_')].toDate()).toLocaleDateString() : null;

                          return (
                            <div key={stage.label} className="flex gap-4 relative">
                              {/* Connector Line */}
                              {idx < arr.length - 1 && (
                                <div className={`absolute left-[15px] top-8 w-[2px] h-8 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                              )}
                              
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}`}>
                                <stage.icon size={14} />
                              </div>
                              
                              <div className="flex-grow">
                                <p className={`text-xs font-black uppercase tracking-widest ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                  {stage.label}
                                </p>
                                {date && <p className="text-[10px] font-bold text-emerald-500">{date}</p>}
                                {isCurrent && !order.isDelivered && (
                                  <p className="text-[10px] font-bold text-primary animate-pulse mt-1">{t('orders.current_status')}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {!order.isDelivered && order.paymentMethod !== 'COD' && (
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end">
                      <button 
                        onClick={() => handleMarkAsDone(order._id)}
                        disabled={updatingId === order._id}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-8 h-10 rounded-sm font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {updatingId === order._id ? t('profile.saving') : t('orders.confirm_delivery')}
                        <CheckCircle size={14} />
                      </button>
                    </div>
                  )}
                  {!order.isDelivered && order.paymentMethod === 'COD' && (
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg flex items-center gap-2">
                        <Clock size={14} /> {t('orders.wait_admin')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyOrders
