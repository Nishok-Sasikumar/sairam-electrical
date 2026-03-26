import { useParams, Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"
import { ShoppingCart, Eye as View, ArrowLeft, ShieldCheck, Truck, RefreshCw, Star, Zap, Package, CheckCircle, Share2, Heart, Check } from "lucide-react"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from 'react-i18next'

function ProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mainImage, setMainImage] = useState("")
  const [shareSuccess, setShareSuccess] = useState(false)
  const { addToCart, getItemQuantity } = useCart()
  const { user, toggleWishlist } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const cartQuantity = product ? getItemQuantity(product._id) : 0
  const isOutOfStock = product && (product.stock <= 0 || cartQuantity >= product.stock)
  const isFavorited = user?.wishlist?.includes(id)

  useEffect(() => {
    window.scrollTo(0, 0)
    const fetchProduct = async () => {
      try {
        const productRef = doc(db, "products", id)
        const productSnap = await getDoc(productRef)
        
        if (productSnap.exists()) {
          const data = { _id: productSnap.id, ...productSnap.data() }
          setProduct(data)
          setMainImage(data.image)
        }
      } catch (err) {
        console.error("Failed to fetch product from Firestore:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate("/login")
      return
    }
    await toggleWishlist(id)
  }

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: product.description,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      }
    } catch (err) {
      console.error("Error sharing:", err)
    }
  }

  const handleAddToCart = () => {
    if (!user) {
      navigate("/login")
      return
    }
    addToCart(product)
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-100 dark:border-white/5 border-t-primary rounded-full animate-spin"></div>
        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={20} />
      </div>
    </div>
  )

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-slate-950">
      <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-none">{t('product.not_found')}</h2>
      <Link to="/catalog" className="btn-primary">{t('product.return')}</Link>
    </div>
  )

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen pb-24 px-4 md:px-8 transition-colors duration-500">
      <div className="container mx-auto">
        <Link to="/catalog" className="inline-flex items-center gap-3 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all mb-16 group font-black uppercase tracking-widest text-[10px]">
          <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-full group-hover:-translate-x-1 transition-transform">
            <ArrowLeft size={16} />
          </div>
          <span>{t('nav.catalog')}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          {/* Gallery View v3 */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] p-12 overflow-hidden flex items-center justify-center group relative border border-slate-100/50 dark:border-white/10 shadow-soft">
              <img 
                src={mainImage || product.image || "https://placehold.co/600x600?text=No+Image"} 
                alt={product.name}
                className="w-full h-full aspect-square object-contain relative z-0 transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { e.target.src = "https://placehold.co/600x600?text=Error" }}
              />
              <div className="absolute top-8 left-8 z-10">
                <span className="bg-primary text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest shadow-glow">
                  {product.category}
                </span>
              </div>
              
              <div className="absolute top-8 right-8 flex flex-col gap-3 z-10">
                <button 
                  onClick={handleToggleFavorite}
                  className={`p-3 rounded-full shadow-soft transition-all ${isFavorited ? 'bg-red-500 text-white shadow-glow' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:scale-110'}`}
                  title={isFavorited ? t('wishlist.remove') : t('product.add_wishlist')}
                >
                  <Heart size={20} fill={isFavorited ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={handleShare}
                  className={`p-3 rounded-full shadow-soft transition-all ${shareSuccess ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-primary hover:scale-110'}`}
                  title={t('product.share')}
                >
                  {shareSuccess ? <Check size={20} /> : <Share2 size={20} />}
                </button>
              </div>
            </div>
            
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-6">
                {product.images.map((img, n) => (
                  <div 
                    key={n} 
                    onClick={() => setMainImage(img)}
                    className={`bg-slate-50 dark:bg-white/5 rounded-3xl p-4 border aspect-square cursor-pointer transition-all flex items-center justify-center ${mainImage === img ? 'border-primary bg-white dark:bg-slate-900 shadow-lg' : 'border-slate-100/50 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:border-primary/40'}`}
                  >
                    <img 
                      src={img || "https://via.placeholder.com/150?text=No+Image"} 
                      alt={`${product.name} thumbnail ${n + 1}`} 
                      className={`max-w-full max-h-full object-contain ${mainImage === img ? 'opacity-100' : 'opacity-40'}`}
                      onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error" }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details v3 */}
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} size={14} className="fill-amber-400" />)}
                </div>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('product.rating_label')}</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 leading-none tracking-tighter">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-6 mb-12">
                <p className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">₹{product.price.toLocaleString()}</p>
                <div className="h-12 w-px bg-slate-100 dark:bg-white/10"></div>
                <div>
                  <p className="text-slate-400 dark:text-slate-600 font-bold line-through leading-none mb-1 text-sm">₹{Math.round(product.price * 1.2).toLocaleString()}</p>
                  <p className="text-emerald-500 text-xs font-black uppercase tracking-widest">{t('product.flash_deal')}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-white/5 p-10 rounded-[2.5rem] mb-12 border-2 border-slate-100/50 dark:border-white/10 shadow-soft group">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                    <Package size={22} className="text-primary group-hover:scale-110 transition-transform" />
                    {t('product.tech_specs')}
                  </h3>
                  <div className="flex flex-col items-end">
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 ${
                      product.stock <= 0 
                        ? 'bg-red-500 text-white shadow-red-500/20' 
                        : product.stock < 10 
                          ? 'bg-amber-500 text-white shadow-amber-500/20' 
                          : 'bg-emerald-500 text-white shadow-emerald-500/20'
                    }`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      {product.stock <= 0 ? t('inventory.out_label') : t('inventory.stock_label', { count: product.stock })}
                    </div>
                  </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-bold text-lg mb-8">
                  {product.description || t('product.description_fallback')}
                </p>
                
                {product.specs && (
                  <div className="grid grid-cols-2 gap-4">
                    {(Array.isArray(product.specs) ? product.specs : product.specs.split('\n')).map((spec, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        {spec}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-6 mb-16">
                <button 
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`btn-primary h-20 px-12 text-xl flex-grow shadow-glow ${isOutOfStock ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                >
                  <ShoppingCart size={24} />
                  {product.stock <= 0 ? t('inventory.out_label') : isOutOfStock ? t('cart.max_limit_reached', 'Limit Reached') : t('product.btn_cart')}
                </button>
                {product.arModel && product.stock > 0 && (
                  <Link 
                    to={`/ar/${product._id}`} 
                    className="btn-outline h-20 px-12 text-xl flex-grow border-2 dark:border-white/20 dark:text-white dark:hover:bg-white/5 bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-glow group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap size={40} className="fill-white" />
                    </div>
                    <View size={24} className="group-hover:scale-110 transition-all" />
                    <span className="flex flex-col items-start leading-none">
                      <span className="text-[10px] font-black uppercase tracking-widest mb-1 text-white/80 italic">{t('product.ar_space')}</span>
                      {t('product.btn_ar')}
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Trust Markers v3 */}
            <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-white/10">
              <div className="flex flex-col gap-5 group">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight mb-1">{t('product.authenticity')}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest">{t('product.mfg')}</p>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm">
                  <Truck size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight mb-1">{t('product.logistics')}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest">{t('product.shipping')}</p>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm">
                  <RefreshCw size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight mb-1">{t('product.protection')}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest">{t('product.warranty')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
