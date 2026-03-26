import { useState, useEffect } from "react"
import { db } from "../firebase"
import { collection, query, getDocs, deleteDoc, doc, updateDoc, onSnapshot, addDoc, serverTimestamp, orderBy } from "firebase/firestore"
import { useAuth } from "../context/AuthContext"
import { Package, Clock, ArrowLeft, Database, User as UserIcon, Calendar, Hash, IndianRupee, AlertCircle, Trash2, CheckCircle, Truck, Tag, MessageSquare, Mail, Phone as PhoneIcon, Send, X, ShieldCheck, MapPin } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

function AdminDashboard() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [expandedEnquiry, setExpandedEnquiry] = useState(null)
  const [activeChatId, setActiveChatId] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [activeTab, setActiveTab] = useState("pending") // "pending", "delivered", "enquiries"
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const pendingOrders = orders.filter(o => !o.isDelivered)
  const deliveredOrders = orders.filter(o => o.isDelivered)
  const missingModels = products.filter(p => !p.arModel)
  const pendingEnquiries = enquiries.filter(e => e.status === 'pending')

  // Listen to chat messages when an enquiry is selected for chat
  useEffect(() => {
    if (!activeChatId) {
      setChatMessages([])
      return
    }

    const q = query(
      collection(db, "enquiries", activeChatId, "messages"),
      orderBy("createdAt", "asc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setChatMessages(msgs)
    })

    return () => unsubscribe()
  }, [activeChatId])

  // Listen to orders in real-time
  useEffect(() => {
    if (!user || !user.isAdmin) return

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data()
        return {
          _id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt || Date.now())
        }
      })
      setOrders(data)
    }, (err) => {
      console.error("Orders Listener Error:", err)
      setError("Failed to listen for new orders: " + err.message)
    })

    return () => unsubscribe()
  }, [user])

  // Listen to enquiries in real-time
  useEffect(() => {
    if (!user || !user.isAdmin) return

    const q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data()
        return {
          _id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt || Date.now())
        }
      })
      setEnquiries(data)
    }, (err) => {
      console.error("Enquiries Listener Error:", err)
      setError("Failed to listen for new enquiries: " + err.message)
    })

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate("/")
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch Products for Health Check
        const productsQuery = query(collection(db, "products"))
        const productsSnap = await getDocs(productsQuery)
        setProducts(productsSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() })))

      } catch (err) {
        console.error("Failed to fetch admin data:", err)
        setError(err.message || "An unknown error occurred while fetching data.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, navigate])

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm(t('admin.confirm_delete_order'))) {
      try {
        await deleteDoc(doc(db, "orders", orderId))
        setOrders(orders.filter(order => order._id !== orderId))
        if (expandedOrder === orderId) setExpandedOrder(null)
      } catch (err) {
        console.error("Error deleting order:", err)
        alert(t('admin.error_delete_order') + err.message)
      }
    }
  }

  const handleDeleteEnquiry = async (enquiryId) => {
    if (window.confirm(t('admin.confirm_delete_enquiry'))) {
      try {
        await deleteDoc(doc(db, "enquiries", enquiryId))
        setEnquiries(enquiries.filter(e => e._id !== enquiryId))
      } catch (err) {
        console.error("Error deleting enquiry:", err)
      }
    }
  }

  const handleToggleEnquiryStatus = async (enquiry) => {
    const newStatus = enquiry.status === 'pending' ? 'resolved' : 'pending'
    try {
      await updateDoc(doc(db, "enquiries", enquiry._id), { status: newStatus })
      setEnquiries(enquiries.map(e => e._id === enquiry._id ? { ...e, status: newStatus } : e))
    } catch (err) {
      console.error("Error updating enquiry status:", err)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || !activeChatId) return

    setIsSending(true)
    try {
      const messageData = {
        text: chatInput,
        senderId: user.uid,
        senderName: "Admin",
        isAdmin: true,
        createdAt: serverTimestamp()
      }
      console.log("Admin sending message to:", activeChatId, messageData)
      await addDoc(collection(db, "enquiries", activeChatId, "messages"), messageData)
      setChatInput("")
    } catch (err) {
      console.error("Error sending message:", err)
      alert(t('admin.error_send_message') + err.message)
    } finally {
      setIsSending(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen pb-24 px-4 md:px-8 transition-colors duration-500">
      <div className="container mx-auto max-w-7xl pt-12">
        {/* Header v3 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="animate-in fade-in slide-in-from-left-8 duration-700">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 leading-none">
              {t('admin.title')} <span className="text-primary italic">{t('admin.title_italic')}</span>
            </h1>
            <p className="text-muted dark:text-slate-400">{t('admin.subtitle')}</p>
          </div>
          
          <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-right-8 duration-700">
            <Link to="/admin/products" className="btn-primary px-6 py-3 text-xs flex items-center gap-2 shadow-glow">
              <Tag size={16} />
              {t('admin.btn_manage_products')}
            </Link>
            <Link to="/profile" className="inline-flex items-center gap-2 text-primary hover:underline font-black uppercase tracking-widest text-[10px]">
              <ArrowLeft size={16} />
              {t('admin.back_to_profile')}
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="glass-modern dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-soft">
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em] mb-4">{t('admin.pending_orders')}</p>
            <p className="text-4xl font-black text-amber-500 italic">{pendingOrders.length}</p>
          </div>
          <div className="glass-modern dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-soft relative overflow-hidden group">
            <div className={`absolute inset-0 bg-red-500/5 transition-opacity duration-500 ${missingModels.length > 0 ? 'opacity-100' : 'opacity-0'}`}></div>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              {t('admin.health_check')}
              {missingModels.length > 0 && <AlertCircle size={10} className="text-red-500 animate-pulse" />}
            </p>
            <p className={`text-4xl font-black italic ${missingModels.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {missingModels.length > 0 ? `${missingModels.length} ${t('admin.pending')}` : t('admin.ready')}
            </p>
            {missingModels.length > 0 && (
              <Link to="/admin/products" className="text-[8px] font-black uppercase tracking-widest text-primary mt-2 block hover:underline">
                {t('admin.fix_now')} →
              </Link>
            )}
          </div>
          <div className="glass-modern dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-soft">
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em] mb-4">{t('admin.revenue')}</p>
            <p className="text-4xl font-black text-primary italic">
              ₹{orders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="glass-modern dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-soft">
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em] mb-4">{t('admin.active_system')}</p>
            <div className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              {t('admin.online')} <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Segregation Tabs */}
        <div className="flex flex-wrap gap-4 mb-12 bg-slate-100 dark:bg-white/5 p-2 rounded-3xl w-fit border border-slate-200 dark:border-white/10 shadow-soft">
          <button 
            onClick={() => setActiveTab("pending")}
            className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "pending" ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-md' : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Truck size={14} /> {t('admin.pending_tab')} ({pendingOrders.length})
          </button>
          <button 
            onClick={() => setActiveTab("delivered")}
            className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "delivered" ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-md' : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <CheckCircle size={14} /> {t('admin.delivered_tab')} ({deliveredOrders.length})
          </button>
          <button 
            onClick={() => setActiveTab("enquiries")}
            className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 relative ${activeTab === "enquiries" ? 'bg-white dark:bg-slate-800 text-primary shadow-md' : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <MessageSquare size={14} /> {t('admin.enquiries_tab')} ({enquiries.length})
            {pendingEnquiries.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full animate-pulse">
                {pendingEnquiries.length}
              </span>
            )}
          </button>
        </div>

        {/* Dynamic Content Title */}
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tight flex items-center gap-3">
          {activeTab === 'enquiries' ? <MessageSquare size={24} className="text-primary" /> : <Package size={24} className="text-primary" />}
          {activeTab === "pending" ? t('admin.pending_orders_title') : activeTab === "delivered" ? t('admin.delivered_orders_title') : t('admin.enquiries_title')}
        </h3>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 p-6 rounded-[2.5rem] mb-8 flex items-center gap-4 animate-in slide-in-from-top-4">
            <AlertCircle size={24} />
            <div>
              <p className="font-bold">{t('admin.error_loading')}</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Content Area */}
        {activeTab === 'enquiries' ? (
          /* Enquiries List */
          enquiries.length === 0 ? (
            <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] p-24 text-center border border-slate-100/50 dark:border-white/10 animate-in zoom-in-95">
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('admin.no_enquiries')}</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {enquiries.map((enquiry) => (
                <div key={enquiry._id} className="glass-modern dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-soft hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-2 h-full ${enquiry.status === 'resolved' ? 'bg-emerald-500' : 'bg-primary'}`}></div>
                  
                  <div className="flex flex-col lg:flex-row justify-between gap-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-grow">
                      <div>
                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <UserIcon size={12} /> {t('admin.label_from')}
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-sm truncate" title={enquiry.name}>{enquiry.name}</p>
                        <div className={`mt-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${enquiry.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                          {enquiry.status === 'resolved' ? <CheckCircle size={10} /> : <Clock size={10} />}
                          {enquiry.status === 'resolved' ? t('admin.resolved') : t('admin.new_enquiry')}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Mail size={12} /> {t('admin.label_contact')}
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-sm truncate" title={enquiry.email}>{enquiry.email}</p>
                        <p className="text-[10px] text-slate-700 dark:text-slate-200 font-bold truncate">{enquiry.phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Calendar size={12} /> {t('admin.label_received')}
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-sm">{new Date(enquiry.createdAt).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-700 dark:text-slate-200 font-bold">{new Date(enquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <MessageSquare size={12} /> {t('admin.label_preview')}
                        </p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 italic">"{enquiry.message}"</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          setExpandedEnquiry(expandedEnquiry === enquiry._id ? null : enquiry._id)
                          setActiveChatId(null) // Close chat if opening read full
                        }}
                        className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${expandedEnquiry === enquiry._id ? 'bg-primary text-white' : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-primary dark:hover:bg-primary dark:hover:text-white'}`}
                      >
                        <MessageSquare size={14} />
                        {expandedEnquiry === enquiry._id ? t('admin.btn_close') : t('admin.btn_read_full')}
                      </button>
                      <button 
                        onClick={() => {
                          setActiveChatId(activeChatId === enquiry._id ? null : enquiry._id)
                          setExpandedEnquiry(null) // Close read full if opening chat
                        }}
                        className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${activeChatId === enquiry._id ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white'}`}
                      >
                        <MessageSquare size={14} />
                        {activeChatId === enquiry._id ? t('admin.btn_close_chat') : t('admin.btn_chat')}
                      </button>
                      <button 
                        onClick={() => handleToggleEnquiryStatus(enquiry)}
                        className={`p-4 rounded-xl transition-all ${enquiry.status === 'resolved' ? 'text-slate-400 bg-slate-100 dark:bg-white/5' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 hover:scale-110'}`}
                        title={enquiry.status === 'resolved' ? t('admin.mark_pending') : t('admin.mark_resolved')}
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteEnquiry(enquiry._id)}
                        className="p-4 text-slate-300 dark:text-slate-700 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {expandedEnquiry === enquiry._id && (
                    <div className="mt-10 pt-10 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-500">
                      <div className="bg-slate-50 dark:bg-white/5 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5">
                        <div className="flex items-start gap-6 mb-8">
                          <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                            <MessageSquare size={32} />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">{t('admin.full_message')}</h4>
                            <p className="text-sm text-slate-500 font-medium italic">{t('admin.sent_by')} {enquiry.name}</p>
                          </div>
                        </div>
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100/50 dark:border-white/5">
                            {enquiry.message}
                          </p>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-4">
                          <a href={`mailto:${enquiry.email}`} className="btn-primary h-14 px-8 text-[10px]">
                            <Mail size={16} /> {t('admin.btn_reply_email')}
                          </a>
                          <a href={`tel:${enquiry.phone}`} className="btn-outline h-14 px-8 text-[10px] dark:border-white/20 dark:text-white">
                            <PhoneIcon size={16} /> {t('admin.btn_call')} {enquiry.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeChatId === enquiry._id && (
                    <div className="mt-10 pt-10 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-500">
                      <div className="bg-slate-50 dark:bg-white/5 p-6 md:p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 flex flex-col h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                              <MessageSquare size={24} />
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-900 dark:text-white">{t('admin.direct_chat')}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('admin.active_session')}</p>
                            </div>
                          </div>
                          <button onClick={() => setActiveChatId(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                            <X size={20} />
                          </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-grow overflow-y-auto mb-6 space-y-4 px-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                          {chatMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-10">
                              <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4">
                                <MessageSquare size={32} />
                              </div>
                              <p className="text-slate-400 font-bold italic text-sm">{t('admin.no_messages')}</p>
                            </div>
                          ) : (
                            chatMessages.map((msg) => (
                              <div key={msg.id} className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium shadow-sm ${
                                  msg.isAdmin 
                                    ? 'bg-primary text-white rounded-tr-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 rounded-tl-none'
                                }`}>
                                  {msg.text}
                                </div>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 px-2">
                                  {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('admin.sending')}
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                          <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={t('admin.placeholder_chat')}
                            className="flex-grow bg-white dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                          />
                          <button 
                            type="submit"
                            disabled={!chatInput.trim() || isSending}
                            className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                          >
                            <Send size={20} className={isSending ? 'animate-pulse' : ''} />
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* Orders List (Existing Logic) */
          (activeTab === "pending" ? pendingOrders : deliveredOrders).length === 0 ? (
            <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] p-24 text-center border border-slate-100/50 dark:border-white/10 animate-in zoom-in-95">
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('admin.no_orders_found', { status: activeTab })}</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {(activeTab === "pending" ? pendingOrders : deliveredOrders).map((order) => (
                <div key={order._id} className="glass-modern dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-soft hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 w-2 h-full ${order.isDelivered ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  
                  <div className="flex flex-col lg:flex-row justify-between gap-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-grow">
                      <div>
                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Hash size={12} /> {t('admin.label_order_id')}
                        </p>
                        <p className="font-black text-slate-900 dark:text-white font-mono text-sm uppercase truncate">#{order._id.slice(-8)}</p>
                        <div className={`mt-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${order.isDelivered ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {order.isDelivered ? <CheckCircle size={10} /> : <Clock size={10} />}
                          {order.isDelivered ? t('admin.status_delivered') : t('admin.status_pending')}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <UserIcon size={12} /> {t('admin.label_customer')}
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-sm truncate max-w-[120px]" title={order.userName || 'Anonymous'}>{order.userName || 'Anonymous'}</p>
                        <p className="text-[10px] text-slate-700 dark:text-slate-200 font-bold lowercase truncate max-w-[120px]" title={order.userEmail}>{order.userEmail}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Calendar size={12} /> {t('admin.label_placed')}
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <IndianRupee size={12} /> {t('admin.label_payment')}
                        </p>
                        <div className="flex flex-col gap-1">
                          <p className={`font-black text-xs uppercase tracking-tighter ${order.paymentMethod === 'COD' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {order.paymentMethod === 'COD' ? t('admin.cod') : t('admin.online_payment')}
                          </p>
                          <p className={`text-[10px] font-bold ${order.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {t('admin.label_status')}: {order.paymentStatus === 'Paid' ? t('admin.paid') : t('admin.pending')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        className="px-6 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all shadow-lg shadow-slate-900/10"
                      >
                        {expandedOrder === order._id ? t('admin.btn_hide') : t('admin.btn_view_logistics')}
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order._id)}
                        className="p-4 text-slate-300 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details v3 */}
                  {expandedOrder === order._id && (
                    <div className="mt-10 pt-10 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                        {/* 1. Items List */}
                        <div className="md:col-span-2 bg-slate-50 dark:bg-white/5 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Package size={14} /> {t('admin.order_items_summary')}
                          </h4>
                          <div className="space-y-4">
                            {order.orderItems?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100/50 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-lg overflow-hidden p-1 flex-shrink-0">
                                    <img 
                                      src={item.image || "https://placehold.co/150?text=No+Image"} 
                                      alt={item.name} 
                                      className="w-full h-full object-contain" 
                                      onError={(e) => { e.target.src = "https://placehold.co/150?text=Error" }}
                                    />
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm block truncate max-w-[200px]">{item.name}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('admin.qty')}: {item.quantity} × ₹{item.price?.toLocaleString()}</span>
                                  </div>
                                </div>
                                <span className="font-black text-slate-900 dark:text-white text-sm italic">₹{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-8 pt-6 border-t border-dashed border-slate-200 dark:border-white/10 flex justify-between items-center px-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.grand_total')}</p>
                            <p className="text-2xl font-black text-primary">₹{(order.totalPrice || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* 2. Customer & Shipping Details */}
                        <div className="space-y-6">
                          <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <Truck size={14} /> {t('admin.delivery_logistics')}
                            </h4>
                            <div className="space-y-4">
                              <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('admin.recipient')}</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">{order.userName || 'Customer'}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('admin.shipping_address')}</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {order.shippingAddress?.address},<br />
                                  {order.shippingAddress?.city}, {order.shippingAddress?.state || ''}<br />
                                  <span className="text-primary tracking-widest">{order.shippingAddress?.zip}</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('admin.contact')}</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                  <PhoneIcon size={12} className="text-slate-400" /> {order.phone}
                                </p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mt-1 lowercase">
                                  <Mail size={12} className="text-slate-400" /> {order.userEmail}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <ShieldCheck size={14} /> {t('admin.security_payment')}
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{t('admin.method')}</span>
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{order.paymentMethod === 'COD' ? t('admin.cod') : t('admin.online')}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{t('admin.status')}</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                  {order.paymentStatus === 'Paid' ? t('admin.paid') : t('admin.pending')}
                                </span>
                              </div>
                              {order.paymentId && (
                                <div className="pt-2">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('admin.transaction_id')}</p>
                                  <p className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-slate-900 p-2 rounded-lg">{order.paymentId}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {!order.isDelivered && (
                        <div className="flex flex-col gap-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('admin.update_tracking')}</p>
                          <div className="flex flex-wrap justify-end gap-3">
                            {[
                              { label: t('admin.stage_packed'), icon: Package, stage: 'Packed' },
                              { label: t('admin.stage_shipped'), icon: Truck, stage: 'Shipped' },
                              { label: t('admin.stage_out'), icon: MapPin, stage: 'Out for Delivery' },
                              { label: order.paymentMethod === 'COD' ? t('admin.btn_cod_deliver') : t('admin.btn_fulfill'), icon: CheckCircle, stage: 'Delivered' }
                            ].map((stage) => (
                              <button 
                                key={stage.stage}
                                onClick={async () => {
                                  const stageLabel = stage.stage;
                                  const updates = { 
                                    status: stageLabel,
                                    [`statusTimeline.${stageLabel.replace(/ /g, '_')}`]: serverTimestamp()
                                  };
                                  if (stageLabel === 'Delivered') {
                                    updates.isDelivered = true;
                                    updates.paymentStatus = 'Paid';
                                  }
                                  await updateDoc(doc(db, "orders", order._id), updates);
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                                  order.status === stage.stage 
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-white/5 hover:border-primary/50'
                                }`}
                              >
                                <stage.icon size={14} />
                                {stage.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default AdminDashboard
