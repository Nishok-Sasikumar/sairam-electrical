import { Link, useNavigate } from "react-router-dom"
import { Eye, ShoppingCart, Star, Zap, ArrowRight, Plus, Heart, Share2, Check, View, ShoppingBag } from "lucide-react"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { useMemo } from "react"
import { useTranslation } from 'react-i18next'

function ProductCard({ product }) {
  const { addToCart, getItemQuantity } = useCart()
  const { user, toggleWishlist } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const cartQuantity = getItemQuantity(product._id)
  const isFavorited = user?.wishlist?.includes(product._id)
  const isOutOfStock = product.stock <= 0 || cartQuantity >= product.stock

  // Deterministic simulation based on product ID string
  const getSimulatedValue = (id, min, max) => {
    if (!id) return min;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return min + (Math.abs(hash) % 1000) / 1000 * (max - min);
  }

  const rating = useMemo(() => product.rating || getSimulatedValue(product._id, 3.8, 5.0).toFixed(1), [product.rating, product._id])
  const reviews = useMemo(() => product.reviews || Math.floor(getSimulatedValue(product._id, 120, 920)), [product.reviews, product._id])
  const mrp = useMemo(() => Math.floor(product.price * 1.25), [product.price])
  const discount = useMemo(() => Math.round(((mrp - product.price) / mrp) * 100), [mrp, product.price])

  const handleToggleFavorite = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate("/login")
      return
    }
    await toggleWishlist(product._id)
  }

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate("/login")
      return
    }
    addToCart(product)
  }

  return (
    <div className={`group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col h-full ${isOutOfStock ? 'opacity-80' : ''}`}>
      {/* Top Badges */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-[calc(100%-3rem)]">
        {discount > 15 && (
          <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-lg inline-block w-fit break-words">
            {t('product.off_tag', { count: discount })}
          </span>
        )}
        {product.arModel && (
          <div className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-lg w-fit break-words">
            <Zap size={10} className="fill-white flex-shrink-0" />
            <span className="leading-tight">{t('ar.interactive_tag', '3D')}</span>
          </div>
        )}
      </div>

      {/* Wishlist Button */}
      <button 
        onClick={handleToggleFavorite}
        className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isFavorited 
            ? 'bg-red-50 text-red-500 shadow-inner' 
            : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-400 hover:text-red-500 border border-slate-100 dark:border-white/5 shadow-sm'
        }`}
      >
        <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
      </button>

      {/* Image Section */}
      <Link to={`/product/${product._id}`} className="relative aspect-[4/5] bg-slate-50 dark:bg-slate-800/30 p-8 flex items-center justify-center overflow-hidden">
        <img 
          src={product.image || "https://placehold.co/400?text=No+Image"} 
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 z-10"
          onError={(e) => { e.target.src = "https://placehold.co/400?text=Error" }}
        />
        
        {/* Hover Quick Actions */}
        <div className="absolute inset-x-4 bottom-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-30 hidden md:flex gap-2">
          <Link 
            to={`/product/${product._id}`}
            className="flex-grow h-12 bg-white text-slate-900 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-primary hover:text-white transition-all"
          >
            <Eye size={16} />
            {t('product.details')}
          </Link>
          {product.arModel && !isOutOfStock && (
            <Link 
              to={`/ar/${product._id}`}
              className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all"
            >
              <View size={18} />
            </Link>
          )}
        </div>

        {/* Stock Overlay for Out of Stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <span className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl">
              {product.stock <= 0 ? t('product.out_of_stock') : t('cart.max_limit_reached')}
            </span>
          </div>
        )}
      </Link>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">{product.category}</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{rating}</span>
            <Star size={10} className="fill-emerald-500 text-emerald-500" />
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 ml-1">({reviews})</span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/product/${product._id}`} className="block mb-4">
          <h3 className={`font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight tracking-tight hover:text-primary transition-colors min-h-[3rem] ${product.name.length > 40 ? 'text-sm' : 'text-base'}`}>
            {product.name}
          </h3>
        </Link>

        {/* Price & Action */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">₹{product.price.toLocaleString()}</span>
            <span className="text-sm font-bold text-slate-400 line-through opacity-50">₹{mrp.toLocaleString()}</span>
          </div>
          
          <div className="flex gap-2">
            {!isOutOfStock ? (
              <>
                <button 
                  onClick={handleAddToCart}
                  className="flex-grow h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center gap-2 hover:bg-primary dark:hover:bg-primary hover:text-white transition-all shadow-lg font-black text-[10px] uppercase tracking-widest"
                >
                  <ShoppingCart size={16} />
                  {t('product.btn_add')}
                </button>
                <button 
                  onClick={() => navigate(`/product/${product._id}`)}
                  className="w-12 h-12 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                >
                  <ShoppingBag size={18} />
                </button>
              </>
            ) : (
              <button 
                disabled
                className="w-full h-12 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 rounded-xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest border border-slate-200 dark:border-white/10"
              >
                {t('product.notify_me')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
