import { useEffect, useState } from "react"
import { db } from "../firebase"
import { collection, getDocs, query, where, documentId } from "firebase/firestore"
import { Search, Filter, Sparkles, Database, Heart, ArrowRight, ShoppingCart, Trash2, Zap, Star, Eye, View } from "lucide-react"
import { useTranslation } from 'react-i18next'
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import { Link } from "react-router-dom"

function Wishlist() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, toggleWishlist } = useAuth()
  const { addToCart } = useCart()
  const { t } = useTranslation()

  useEffect(() => {
    window.scrollTo(0, 0)
    const fetchWishlistProducts = async () => {
      if (!user?.wishlist || user.wishlist.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      try {
        const wishlistChunks = []
        for (let i = 0; i < user.wishlist.length; i += 10) {
          wishlistChunks.push(user.wishlist.slice(i, i + 10))
        }

        const allProducts = []
        for (const chunk of wishlistChunks) {
          const q = query(collection(db, "products"), where(documentId(), "in", chunk))
          const querySnapshot = await getDocs(q)
          const chunkData = querySnapshot.docs.map(doc => ({
            _id: doc.id,
            ...doc.data(),
            rating: doc.data().rating || (Math.random() * (5 - 3.8) + 3.8).toFixed(1),
            reviews: doc.data().reviews || Math.floor(Math.random() * 500) + 50
          }))
          allProducts.push(...chunkData)
        }
        
        setProducts(allProducts)
      } catch (err) {
        console.error("Failed to fetch wishlist products:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchWishlistProducts()
  }, [user?.wishlist])

  const handleRemove = async (productId) => {
    await toggleWishlist(productId)
  }

  const handleAddToCart = (product) => {
    addToCart(product)
    // Optional: remove from wishlist after adding to cart
    // handleRemove(product._id)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24">
      {/* Header v4 */}
      <div className="pt-24 pb-8 px-6 md:px-12 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            <Link to="/" className="hover:text-primary transition-colors">{t('wishlist.home')}</Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">{t('wishlist.my_wishlist')}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
              {t('wishlist.title')} <span className="text-primary not-italic">{t('wishlist.title_italic')}</span>
            </h1>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {t('wishlist.items_count', { count: products.length })}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-6 md:px-12 py-12">
        {products.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-24 text-center border border-slate-100 dark:border-white/5 shadow-soft animate-in zoom-in-95">
            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500 shadow-inner">
              <Heart size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{t('wishlist.empty_title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-xs mx-auto font-medium leading-relaxed">
              {t('wishlist.empty_desc')}
            </p>
            <Link to="/catalog" className="btn-primary inline-flex px-12 h-16 shadow-glow uppercase tracking-widest text-xs font-black">
              {t('wishlist.btn_explore')}
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-soft">
            <div className="divide-y divide-slate-50 dark:divide-white/5">
              {products.map((product) => {
                const isOutOfStock = product.stock <= 0
                const mrp = Math.floor(product.price * 1.25)
                
                return (
                  <div key={product._id} className="p-8 md:p-10 group hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors">
                    <div className="flex flex-col sm:flex-row gap-10">
                      {/* Image */}
                      <div className="w-48 h-48 bg-slate-50 dark:bg-slate-800 rounded-3xl overflow-hidden flex-shrink-0 p-8 border border-slate-100 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors relative">
                        <img 
                          src={product.image || "https://placehold.co/400?text=No+Image"} 
                          alt={product.name} 
                          className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 z-10 ${isOutOfStock ? 'grayscale opacity-50' : ''}`} 
                        />
                        {product.arModel && (
                          <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-lg z-20">
                            <Zap size={10} className="fill-white" />
                            {t('ar.interactive_tag', '3D')}
                          </div>
                        )}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div>
                            <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">{product.category}</span>
                            <Link to={`/product/${product._id}`}>
                              <h3 className="font-black text-slate-900 dark:text-white text-2xl tracking-tight leading-tight hover:text-primary transition-colors line-clamp-2 mb-3">
                                {product.name}
                              </h3>
                            </Link>
                            
                            <div className="flex items-center gap-4 mb-4">
                              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{product.rating}</span>
                                <Star size={10} className="fill-emerald-500 text-emerald-500" />
                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 ml-1">({product.reviews})</span>
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isOutOfStock ? 'text-red-500' : 'text-emerald-500'}`}>
                                {isOutOfStock ? t('wishlist.out_of_stock') : t('wishlist.in_stock')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-black text-slate-900 dark:text-white text-3xl tracking-tighter italic">₹{product.price.toLocaleString()}</p>
                            <p className="text-sm text-slate-400 line-through font-bold">₹{mrp.toLocaleString()}</p>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">{t('wishlist.savings')}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-8">
                          {!isOutOfStock ? (
                            <button 
                              onClick={() => handleAddToCart(product)}
                              className="h-14 px-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center gap-3 hover:bg-primary dark:hover:bg-primary hover:text-white transition-all shadow-lg font-black text-[10px] uppercase tracking-widest group/btn"
                            >
                              <ShoppingCart size={18} className="group-hover/btn:scale-110 transition-transform" />
                              {t('wishlist.add_to_logistics')}
                            </button>
                          ) : (
                            <button 
                              disabled
                              className="h-14 px-10 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest border border-slate-200 dark:border-white/10"
                            >
                              {t('wishlist.notify_available')}
                            </button>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Link 
                              to={`/product/${product._id}`}
                              className="w-14 h-14 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-all border border-slate-100 dark:border-white/5"
                              title={t('product.details')}
                            >
                              <Eye size={20} />
                            </Link>
                            {product.arModel && !isOutOfStock && (
                              <Link 
                                to={`/ar/${product._id}`}
                                className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all border border-emerald-100/50 dark:border-emerald-500/10"
                                title={t('wishlist.ar_view')}
                              >
                                <View size={20} />
                              </Link>
                            )}
                            <button 
                              onClick={() => handleRemove(product._id)}
                              className="w-14 h-14 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 transition-all border border-red-100/50 dark:border-red-500/10"
                              title={t('product.remove', 'Remove')}
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Wishlist
