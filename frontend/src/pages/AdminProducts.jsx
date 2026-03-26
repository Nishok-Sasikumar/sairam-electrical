import { useState, useEffect } from "react"
import { db } from "../firebase"
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "../context/AuthContext"
import { Package, Plus, Search, Edit3, Trash2, X, Image as ImageIcon, IndianRupee, Tag, Layers, ArrowLeft, Save, AlertCircle, TrendingUp, TrendingDown, Box, AlertTriangle, CheckCircle2, MoreVertical, Filter, Download, Eye as View } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
    description: "",
    specs: "",
    arModel: "",
    stock: "",
    images: ""
  })

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate("/")
      return
    }

    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"))
        const productsData = querySnapshot.docs.map(doc => ({
          _id: doc.id,
          ...doc.data()
        }))
        setProducts(productsData)
      } catch (err) {
        console.error("Failed to fetch products:", err)
        setError("Failed to load products.")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [user, navigate])

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name || "",
        price: product.price || "",
        category: product.category || "",
        image: product.image || "",
        description: product.description || "",
        specs: Array.isArray(product.specs) ? product.specs.join("\n") : product.specs || "",
        arModel: product.arModel || "",
        stock: product.stock || "",
        images: Array.isArray(product.images) ? product.images.join(", ") : product.images || ""
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: "",
        price: "",
        category: "",
        image: "",
        description: "",
        specs: "",
        arModel: "",
        stock: "",
        images: ""
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setError(null)
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const productData = {
        ...(editingProduct || {}), // Preserve existing fields
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        specs: formData.specs.split("\n").filter(line => line.trim() !== ""),
        images: formData.images.split(",").map(img => img.trim()).filter(img => img !== ""),
        updatedAt: serverTimestamp()
      }
      
      // Clean up internal fields if they exist
      delete productData._id;

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct._id), productData)
        setProducts(products.map(p => p._id === editingProduct._id ? { ...p, ...productData } : p))
      } else {
        const docRef = await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: serverTimestamp()
        })
        setProducts([{ _id: docRef.id, ...productData }, ...products])
      }
      handleCloseModal()
    } catch (err) {
      console.error("Error saving product:", err)
      setError(t('inventory.error_save'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (productId) => {
    if (window.confirm(t('inventory.confirm_delete'))) {
      try {
        await deleteDoc(doc(db, "products", productId))
        setProducts(products.filter(p => p._id !== productId))
      } catch (err) {
        console.error("Error deleting product:", err)
        alert(t('inventory.error_delete'))
      }
    }
  }

  const [activeView, setActiveView] = useState("grid") // grid, list
  const [filterCategory, setFilterCategory] = useState("All")
  const [stockFilter, setStockFilter] = useState("All") // All, Low, Out

  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))].sort()

  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (p.name || "").toLowerCase().includes(searchLower) ||
                         (p.category || "").toLowerCase().includes(searchLower) ||
                         (p.description || "").toLowerCase().includes(searchLower);
    const matchesCategory = filterCategory === "All" || p.category === filterCategory;
    const matchesStock = stockFilter === "All" || 
                        (stockFilter === "Low" && (p.stock || 0) > 0 && (p.stock || 0) < 10) ||
                        (stockFilter === "Out" && (p.stock || 0) <= 0);
    return matchesSearch && matchesCategory && matchesStock;
  }).sort((a, b) => (a.name || "").localeCompare(b.name || ""))

  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
    outOfStock: products.filter(p => p.stock <= 0).length,
    totalValue: products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="bg-[#f8fafc] dark:bg-slate-950 min-h-screen pb-24">
      {/* Top Professional Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 transition-colors duration-500">
        <div className="container mx-auto max-w-7xl px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Box className="text-primary" size={24} />
                {t('inventory.title')} <span className="text-primary italic">{t('inventory.title_italic')}</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">{t('inventory.control_center')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleOpenModal()}
              className="bg-primary hover:bg-primary/90 text-white px-6 h-12 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 transition-all font-black uppercase tracking-widest text-[10px]"
            >
              <Plus size={16} />
              {t('inventory.btn_add')}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 pt-8">
        {/* Inventory Stats - Flipkart/Amazon Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl">
                <Box size={20} />
              </div>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('inventory.total_skus')}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl">
                <AlertTriangle size={20} />
              </div>
              <span className="text-[10px] font-black text-amber-500 uppercase">{t('inventory.attention')}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('inventory.low_stock')}</p>
            <p className="text-3xl font-black text-amber-500">{stats.lowStock}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl">
                <X size={20} />
              </div>
              <TrendingDown size={16} className="text-red-500" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('inventory.out_of_stock')}</p>
            <p className="text-3xl font-black text-red-500">{stats.outOfStock}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl">
                <IndianRupee size={20} />
              </div>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('inventory.value')}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">₹{stats.totalValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Toolbar - Search & Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm mb-10 flex flex-col lg:flex-row items-center gap-6">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder={t('inventory.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-700 dark:text-white"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border-none font-bold text-slate-600 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? t('inventory.all_categories') : cat}</option>
              ))}
            </select>

            <select 
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="h-14 px-6 rounded-2xl bg-slate-50 dark:bg-white/5 border-none font-bold text-slate-600 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            >
              <option value="All">{t('inventory.all_stock')}</option>
              <option value="Low">{t('inventory.low_stock')}</option>
              <option value="Out">{t('inventory.out_of_stock')}</option>
            </select>

            <div className="h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center p-1">
              <button 
                onClick={() => setActiveView("grid")}
                title={t('inventory.grid_view')}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeView === "grid" ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Layers size={18} />
              </button>
              <button 
                onClick={() => setActiveView("list")}
                title={t('inventory.list_view')}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeView === "list" ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <MoreVertical size={18} className="rotate-90" />
              </button>
            </div>
          </div>
        </div>

        {/* Product View */}
        {activeView === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {filteredProducts.map((product) => (
              <div key={product._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-500 group relative">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button 
                    onClick={() => handleOpenModal(product)}
                    className="p-3 bg-white dark:bg-slate-800 text-primary rounded-xl shadow-lg hover:scale-110 transition-transform"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product._id)}
                    className="p-3 bg-white dark:bg-slate-800 text-red-500 rounded-xl shadow-lg hover:scale-110 transition-transform"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="w-full aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 mb-6 flex items-center justify-center overflow-hidden relative z-0 border border-slate-100 dark:border-white/5">
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-black text-slate-900 dark:text-white text-sm leading-tight line-clamp-1">{product.name}</h3>
                    <span className="bg-slate-100 dark:bg-white/10 text-slate-500 text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest flex-shrink-0">
                      {product.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black text-slate-900 dark:text-white italic">₹{product.price.toLocaleString()}</p>
                    <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest flex-shrink-0 border ${
                      product.stock <= 0 
                        ? 'bg-red-50 text-red-500 border-red-100' 
                        : product.stock < 10 
                          ? 'bg-amber-50 text-amber-500 border-amber-100' 
                          : 'bg-emerald-50 text-emerald-500 border-emerald-100'
                    }`}>
                      {product.stock <= 0 ? t('inventory.out_label') : t('inventory.stock_label', { count: product.stock })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 text-left border-b border-slate-100 dark:border-white/5">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('inventory.product_info')}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('inventory.category')}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('inventory.stock_level')}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('inventory.price')}</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('inventory.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-lg p-2 border border-slate-100 dark:border-white/5">
                            <img src={product.image} alt="" className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">{product.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">ID: {product._id.slice(-8).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="bg-slate-100 dark:bg-white/10 text-slate-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            product.stock <= 0 ? 'bg-red-500' : product.stock < 10 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}></div>
                          <span className={`text-sm font-black ${
                            product.stock <= 0 ? 'text-red-500' : product.stock < 10 ? 'text-amber-500' : 'text-slate-900 dark:text-white'
                          }`}>
                            {t('inventory.units', { count: product.stock })}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <p className="font-black text-slate-900 dark:text-white text-sm italic">₹{product.price.toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleOpenModal(product)}
                            className="p-3 text-slate-400 hover:text-primary transition-colors"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(product._id)}
                            className="p-3 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] p-10 md:p-12 shadow-2xl relative animate-in zoom-in-95 duration-500">
              <button 
                onClick={handleCloseModal}
                className="absolute top-8 right-8 p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400"
              >
                <X size={24} />
              </button>

              <div className="mb-10">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
                  {editingProduct ? t('inventory.btn_update') : t('inventory.btn_add')} <span className="text-primary italic">{t('inventory.product_dot')}</span>
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-bold">{t('inventory.modal_subtitle')}</p>
              </div>

              {error && (
                <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Tag size={12} /> {t('inventory.label_name')}
                    </label>
                    <input 
                      required
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder={t('inventory.placeholder_name')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <IndianRupee size={12} /> {t('inventory.label_price')}
                    </label>
                    <input 
                      required
                      type="number" 
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Layers size={12} /> {t('inventory.label_category')}
                    </label>
                    <input 
                      required
                      type="text" 
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder={t('inventory.placeholder_category')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <ImageIcon size={12} /> {t('inventory.label_image')}
                    </label>
                    <input 
                      required
                      type="text" 
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <View size={12} /> {t('inventory.label_ar')}
                    </label>
                    <input 
                      type="text" 
                      name="arModel"
                      value={formData.arModel}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="/models/product.glb"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Package size={12} /> {t('inventory.label_stock')}
                    </label>
                    <input 
                      type="number" 
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest ml-1">{t('inventory.label_images')}</label>
                  <textarea 
                    name="images"
                    value={formData.images}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 dark:text-white resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    placeholder="url1, url2, url3"
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest ml-1">{t('inventory.label_desc')}</label>
                  <textarea 
                    required
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 dark:text-white resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    placeholder={t('inventory.placeholder_desc')}
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest ml-1">{t('inventory.label_specs')}</label>
                  <textarea 
                    name="specs"
                    value={formData.specs}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border-none focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 dark:text-white resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    placeholder="Voltage: 240V&#10;Material: Polycarbonate&#10;IP Rating: IP65"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-primary w-full h-20 text-xl shadow-glow disabled:opacity-50"
                >
                  <Save size={24} />
                  {saving ? t('profile.saving') : (editingProduct ? t('inventory.btn_update') : t('inventory.btn_add_product'))}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminProducts
