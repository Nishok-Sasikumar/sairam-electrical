import { useEffect, useState, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { db } from "../firebase"
import { collection, getDocs } from "firebase/firestore"
import ProductCard from "../components/ProductCard"
import { Search, Filter, Sparkles, Zap, ChevronDown, SortAsc, SortDesc, SlidersHorizontal, Star, X, Check } from "lucide-react"
import { useTranslation } from 'react-i18next'
import { useAuth } from "../context/AuthContext"

function Catalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showOnly3D, setShowOnly3D] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 1000000])
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState("newest") // "newest", "priceLow", "priceHigh", "rating"
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [stockStatus, setStockStatus] = useState("all") // "all", "inStock", "outOfStock"

  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.isAdmin) {
      navigate("/admin")
      return
    }
    window.scrollTo(0, 0)
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"))
        const productsData = querySnapshot.docs.map(doc => ({
          _id: doc.id,
          ...doc.data(),
          rating: doc.data().rating || (Math.random() * (5 - 3.5) + 3.5).toFixed(1), // Simulated rating if missing
          reviews: doc.data().reviews || Math.floor(Math.random() * 500) + 50 // Simulated reviews if missing
        }))
        setProducts(productsData)
      } catch (err) {
        console.error("Failed to fetch products from Firestore:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [user?.isAdmin, navigate])

  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean)
    return [t('catalog.all_category'), ...new Set(cats)]
  }, [products, t])

  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesSearch = (product.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === t('catalog.all_category') || selectedCategory === "All" || product.category === selectedCategory
      const matches3D = !showOnly3D || product.arModel
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
      const matchesRating = parseFloat(product.rating) >= minRating
      const matchesStock = stockStatus === "all" ? true : 
                          stockStatus === "inStock" ? product.stock > 0 : product.stock <= 0
      
      return matchesSearch && matchesCategory && matches3D && matchesPrice && matchesRating && matchesStock
    })

    // Sorting
    switch (sortBy) {
      case "priceLow":
        result.sort((a, b) => a.price - b.price)
        break
      case "priceHigh":
        result.sort((a, b) => b.price - a.price)
        break
      case "rating":
        result.sort((a, b) => b.rating - a.rating)
        break
      default: // newest
        // Assuming Firestore IDs or a createdAt field, but using simple fallback
        break
    }

    return result
  }, [products, searchQuery, selectedCategory, showOnly3D, priceRange, minRating, sortBy, stockStatus, t])

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen">
      {/* Breadcrumbs & Title */}
      <div className="pt-24 pb-8 px-6 md:px-12 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="container mx-auto">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            <Link to="/" className="hover:text-primary transition-colors">{t('catalog.breadcrumb_home')}</Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">{t('catalog.breadcrumb_catalog')}</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
              {t('catalog.title')} <span className="text-primary not-italic">{t('catalog.title_italic')}</span>
            </h1>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {t('catalog.showing_results', { count: filteredProducts.length })}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-12 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Mobile Filter Button */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl"
          >
            <Filter size={18} />
            {t('catalog.btn_filters')}
          </button>

          {/* Sidebar Filters */}
          <aside className={`fixed inset-0 z-50 lg:relative lg:z-auto lg:block lg:w-80 transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="h-full bg-white dark:bg-slate-950 lg:bg-transparent overflow-y-auto p-8 lg:p-0">
              <div className="flex items-center justify-between mb-10 lg:hidden">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{t('catalog.filter_title')}</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full">
                  <X size={24} className="text-slate-900 dark:text-white" />
                </button>
              </div>

              {/* Search Within */}
              <div className="mb-10">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{t('catalog.search_catalog')}</h4>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder={t('catalog.search_input_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border-2 border-transparent focus:border-primary/20 outline-none transition-all font-bold text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-10">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{t('catalog.categories')}</h4>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl font-bold text-sm transition-all text-left ${
                        selectedCategory === cat 
                          ? 'bg-primary text-white shadow-glow' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="leading-tight">{cat}</span>
                      {selectedCategory === cat && <Check size={16} className="flex-shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-10">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{t('catalog.price_range')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-grow p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{t('catalog.min_price')}</p>
                      <input 
                        type="number" 
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="bg-transparent w-full font-black text-sm text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div className="flex-grow p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{t('catalog.max_price')}</p>
                      <input 
                        type="number" 
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                        className="bg-transparent w-full font-black text-sm text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ratings */}
              <div className="mb-10">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{t('catalog.customer_ratings')}</h4>
                <div className="space-y-2">
                  {[4, 3, 2].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                      className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                        minRating === rating 
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-800'} />
                        ))}
                      </div>
                      {t('catalog.up')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="mb-10">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{t('catalog.availability')}</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setStockStatus(stockStatus === "inStock" ? "all" : "inStock")}
                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl font-bold text-sm transition-all ${
                      stockStatus === "inStock" 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {t('catalog.in_stock_only')}
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${stockStatus === "inStock" ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 dark:border-white/10'}`}>
                      {stockStatus === "inStock" && <Check size={14} className="text-white" />}
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setShowOnly3D(!showOnly3D)}
                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl font-bold text-sm transition-all ${
                      showOnly3D 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {t('catalog.models_3d_only')}
                    <Zap size={16} className={showOnly3D ? 'fill-primary' : ''} />
                  </button>
                </div>
              </div>

              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(t('catalog.all_category'));
                  setShowOnly3D(false);
                  setPriceRange([0, 1000000]);
                  setMinRating(0);
                  setStockStatus("all");
                  setSortBy("newest");
                  setIsSidebarOpen(false);
                }}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-xl transition-all"
              >
                {t('catalog.btn_reset_all')}
              </button>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="flex-grow">
            {/* Sorting Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">{t('catalog.sort_by')}</span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'newest', label: t('catalog.sort_newest') },
                    { id: 'priceLow', label: t('catalog.sort_price_low') },
                    { id: 'priceHigh', label: t('catalog.sort_price_high') },
                    { id: 'rating', label: t('catalog.sort_rating') }
                  ].map(sort => (
                    <button
                      key={sort.id}
                      onClick={() => setSortBy(sort.id)}
                      className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                        sortBy === sort.id 
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white' 
                          : 'bg-transparent text-slate-400 dark:text-slate-500 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      {sort.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] aspect-[3/4] animate-pulse"></div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProducts.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-40 rounded-[4rem] bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                <Search size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-8" />
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase italic">{t('catalog.no_matches')}</h3>
                <p className="text-slate-500 font-bold mb-10 max-w-sm mx-auto">{t('catalog.no_matches_desc')}</p>
                <button 
                  onClick={() => { setSearchQuery(""); setSelectedCategory(t('catalog.all_category')); setShowOnly3D(false); setPriceRange([0, 1000000]); setMinRating(0); setStockStatus("all"); }}
                  className="btn-primary px-12 h-16 shadow-glow uppercase tracking-widest text-xs font-black"
                >
                  {t('catalog.btn_clear_filters')}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Catalog
