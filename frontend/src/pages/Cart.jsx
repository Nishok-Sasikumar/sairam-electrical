import { Link, useNavigate } from "react-router-dom"
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, CreditCard, ShoppingCart as CartIcon, ArrowRight, Heart, ShieldCheck, Truck, RefreshCcw, Info } from "lucide-react"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from 'react-i18next'
import { useState, useMemo } from "react"

function Cart() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart()
  const { user, toggleWishlist } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState("")

  // Simulated delivery date
  const deliveryDate = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + 3)
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }, [])

  const handleMoveToWishlist = async (product) => {
    if (!user) {
      navigate("/login")
      return
    }
    await toggleWishlist(product._id)
    removeFromCart(product._id)
  }

  const subtotal = cartTotal
  const tax = cartTotal * 0.18
  const total = subtotal + tax

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24">
      {/* Header v4 */}
      <div className="pt-24 pb-8 px-6 md:px-12 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            <Link to="/" className="hover:text-primary transition-colors">{t('cart.breadcrumb_home')}</Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">{t('cart.breadcrumb_cart')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            {t('cart.title')} <span className="text-primary not-italic">{t('cart.logistics_title')}</span>
          </h1>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 md:px-12 py-12">
        {cartItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-24 text-center border border-slate-100 dark:border-white/5 shadow-soft animate-in zoom-in-95">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200 dark:text-slate-700 shadow-inner">
              <CartIcon size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{t('cart.empty')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-xs mx-auto font-medium leading-relaxed">
              {t('cart.empty_desc')}
            </p>
            <Link to="/catalog" className="btn-primary inline-flex px-12 h-16 shadow-glow uppercase tracking-widest text-xs font-black">
              {t('cart.start_shopping')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Cart Items Column */}
            <div className="flex-grow space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-soft">
                <div className="px-10 py-6 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                    <ShoppingBag size={18} className="text-primary" />
                    {t('cart.items_count', { count: cartItems.length })}
                  </h2>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('cart.shipping_to')}</span>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-white/5">
                  {cartItems.map((item) => (
                    <div key={item._id} className="p-10 group hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors">
                      <div className="flex flex-col sm:flex-row gap-10">
                        {/* Image */}
                        <div className="w-40 h-40 bg-slate-50 dark:bg-slate-800 rounded-3xl overflow-hidden flex-shrink-0 p-6 border border-slate-100 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors relative">
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 z-10" />
                        </div>
                        
                        {/* Details */}
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <div>
                              <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">{item.category}</span>
                              <Link to={`/product/${item._id}`}>
                                <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-tight hover:text-primary transition-colors line-clamp-2 mb-2">
                                  {item.name}
                                </h3>
                              </Link>
                              <p className="text-xs font-bold text-slate-400 flex items-center gap-2 mb-4">
                                <span className="text-emerald-500 flex items-center gap-1"><ShieldCheck size={14} /> {t('cart.warranty_label')}</span>
                                <span>•</span>
                                <span>{t('cart.in_stock')}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-900 dark:text-white text-2xl tracking-tighter italic">₹{item.price.toLocaleString()}</p>
                              {item.mrp && <p className="text-xs text-slate-400 line-through font-bold">₹{item.mrp.toLocaleString()}</p>}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-8 mt-6">
                            {/* Quantity Control */}
                            <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10">
                              <button 
                                onClick={() => updateQuantity(item._id, -1)}
                                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-primary shadow-sm hover:shadow-md active:scale-95 disabled:opacity-30"
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="font-black text-base w-8 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item._id, 1)}
                                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-primary shadow-sm hover:shadow-md active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                                disabled={item.quantity >= item.stock}
                              >
                                <Plus size={16} />
                              </button>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-6">
                              <button 
                                onClick={() => handleMoveToWishlist(item)}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 flex items-center gap-2 transition-colors"
                              >
                                <Heart size={14} />
                                {t('cart.move_to_wishlist')}
                              </button>
                              <button 
                                onClick={() => removeFromCart(item._id)}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 size={14} />
                                {t('cart.remove')}
                              </button>
                            </div>

                            <div className="ml-auto text-right hidden sm:block">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('cart.delivery_by')}</p>
                              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{deliveryDate}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secure Shopping Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{t('cart.secure_payments')}</h4>
                    <p className="text-[10px] font-bold text-slate-500">{t('cart.secure_payments_desc')}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{t('cart.reliable_logistics')}</h4>
                    <p className="text-[10px] font-bold text-slate-500">{t('cart.reliable_logistics_desc')}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                    <RefreshCcw size={24} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{t('cart.easy_returns')}</h4>
                    <p className="text-[10px] font-bold text-slate-500">{t('cart.easy_returns_desc')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Summary Column */}
            <div className="lg:w-96 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-10 sticky top-32 shadow-xl shadow-slate-900/5">
                <h3 className="text-xl font-black mb-8 tracking-tighter uppercase italic text-slate-900 dark:text-white">{t('cart.price_title')} <span className="text-primary not-italic">{t('cart.price_summary')}</span></h3>
                
                <div className="space-y-6 mb-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('cart.price_items', { count: cartItems.length })}</span>
                    <span className="font-black text-slate-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('cart.tech_tax')}</span>
                    <span className="font-black text-slate-900 dark:text-white">₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('cart.logistics_fee')}</span>
                    <span className="font-black text-emerald-500 uppercase text-[10px] tracking-widest px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-full">{t('cart.free')}</span>
                  </div>
                  
                  <div className="h-px bg-slate-100 dark:bg-white/5 my-4"></div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{t('cart.total_payable')}</span>
                    <span className="text-3xl font-black text-primary tracking-tighter">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Coupon Section */}
                <div className="mb-10">
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder={t('cart.coupon_placeholder')}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-6 pr-24 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border-2 border-transparent focus:border-primary/20 outline-none transition-all font-bold text-xs uppercase tracking-widest"
                    />
                    <button className="absolute right-2 top-2 bottom-2 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-primary dark:hover:bg-primary hover:text-white transition-all">
                      {t('cart.btn_apply')}
                    </button>
                  </div>
                  <p className="mt-3 text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                    <Info size={12} className="text-primary" />
                    {t('cart.try_code')} <span className="text-primary cursor-pointer hover:underline">SAIRAM2026</span>
                  </p>
                </div>

                <Link to="/checkout" className="btn-primary w-full h-16 text-xs uppercase tracking-widest font-black shadow-glow group">
                  {t('cart.btn_proceed')}
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
                </Link>

                <div className="mt-8 flex items-center justify-center gap-3 grayscale opacity-30">
                  <CreditCard size={20} />
                  <div className="h-4 w-px bg-slate-300"></div>
                  <span className="text-[8px] font-black uppercase tracking-widest">{t('cart.payment_methods')}</span>
                </div>
              </div>

              {/* Saved for Later Placeholder (Flipkart Style) */}
              <div className="bg-slate-100 dark:bg-white/5 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('cart.found_else')}</p>
                <Link to="/wishlist" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">{t('cart.view_wishlist')} →</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
