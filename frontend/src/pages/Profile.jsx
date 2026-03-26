import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"
import { User, Mail, Shield, LogOut, ArrowLeft, Package, Settings, Database, CheckCircle, AlertCircle, LayoutDashboard, Phone, MapPin, Edit3, Save, X, Hash } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { db } from "../firebase"
import { doc, updateDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from "firebase/firestore"
import { MessageSquare, Send } from "lucide-react"

function Profile() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("profile") // "profile", "enquiries"
  const [enquiries, setEnquiries] = useState([])
  const [loadingEnquiries, setLoadingEnquiries] = useState(false)
  const [activeChatId, setActiveChatId] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [isSending, setIsSending] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    zip: ""
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        zip: user.zip || ""
      })
    }
  }, [user])

  // Listen to user's enquiries in real-time
  useEffect(() => {
    if (!user || activeTab !== "enquiries") return

    setLoadingEnquiries(true)
    const q = query(
      collection(db, "enquiries"),
      where("userId", "==", user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data()
        return {
          _id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt || Date.now())
        }
      })
      data.sort((a, b) => b.createdAt - a.createdAt)
      setEnquiries(data)
      setLoadingEnquiries(false)
    }, (err) => {
      console.error("User Enquiries Listener Error:", err)
      setLoadingEnquiries(false)
    })

    return () => unsubscribe()
  }, [user, activeTab])

  // Listen to chat messages
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

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || !activeChatId) return

    setIsSending(true)
    try {
      const messageData = {
        text: chatInput,
        senderId: user.uid,
        senderName: user.name,
        isAdmin: false,
        createdAt: serverTimestamp()
      }
      console.log("User sending message to:", activeChatId, messageData)
      await addDoc(collection(db, "enquiries", activeChatId, "messages"), messageData)
      setChatInput("")
    } catch (err) {
      console.error("Error sending message:", err)
      alert("Failed to send message: " + err.message)
    } finally {
      setIsSending(false)
    }
  }

  if (!user) {
    navigate("/login")
    return null
  }

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        ...formData,
        updatedAt: new Date()
      })
      setSuccess(t('profile.success_update'))
      setIsEditing(false)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Failed to update profile:", error)
      alert(t('profile.error_update'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen pb-24 px-4 md:px-8">
      <div className="container mx-auto max-w-4xl pt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="animate-in fade-in slide-in-from-left-8 duration-700">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 leading-none">{t('profile.title')} <span className="text-primary italic">{t('profile.title_italic')}</span></h1>
            <p className="text-slate-600 dark:text-slate-300 font-bold">{t('profile.subtitle')}</p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-black uppercase tracking-widest text-[10px]">
            <ArrowLeft size={16} />
            {t('nav.home')}
          </Link>
        </div>

        {success && (
          <div className="mb-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-300">
            <CheckCircle size={20} />
            <p className="text-sm font-bold">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] p-10 text-center border border-slate-100/50 dark:border-white/5">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary border-4 border-white dark:border-slate-900 shadow-glow">
                <span className="text-4xl font-black">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{user.name}</h3>
              <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4">{user.isAdmin ? t('profile.role_admin') : t('profile.role_client')}</p>
              
              <div className={`mb-8 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${user.emailVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-700'}`}>
                {user.emailVerified ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {user.emailVerified ? t('profile.verified') : t('profile.pending_verification')}
              </div>

              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-red-500 hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={14} />
                {t('profile.logout')}
              </button>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-8 text-white border border-white/10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-6">{t('profile.quick_links')}</h4>
              <nav className="space-y-4">
                {user.isAdmin ? (
                  <>
                    <Link to="/admin" className="flex items-center gap-4 text-sm font-black text-white hover:text-primary transition-colors group">
                      <div className="p-2 bg-white/10 rounded-xl group-hover:bg-primary/20 transition-all text-white">
                        <LayoutDashboard size={18} />
                      </div>
                      {t('profile.admin_dashboard')}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/my-orders" className="flex items-center gap-4 text-sm font-black text-white hover:text-primary transition-colors group">
                      <div className="p-2 bg-white/10 rounded-xl group-hover:bg-primary/20 transition-all text-white">
                        <Package size={18} />
                      </div>
                      {t('profile.my_orders')}
                    </Link>
                  </>
                )}
                
                <Link to="/settings" className="flex items-center gap-4 text-sm font-black text-white hover:text-primary transition-colors group">
                  <div className="p-2 bg-white/10 rounded-xl group-hover:bg-primary/20 transition-all text-white">
                    <Settings size={18} />
                  </div>
                  {t('profile.settings')}
                </Link>

                <Link to="/manage-addresses" className="flex items-center gap-4 text-sm font-black text-white hover:text-primary transition-colors group">
                  <div className="p-2 bg-white/10 rounded-xl group-hover:bg-primary/20 transition-all text-white">
                    <MapPin size={18} />
                  </div>
                  {t('profile.manage_addresses')}
                </Link>

                {!user.isAdmin && (
                  <button 
                    onClick={() => setActiveTab(activeTab === "enquiries" ? "profile" : "enquiries")}
                    className={`w-full flex items-center gap-4 text-sm font-black transition-colors group ${activeTab === "enquiries" ? 'text-primary' : 'text-white hover:text-primary'}`}
                  >
                    <div className={`p-2 rounded-xl transition-all ${activeTab === "enquiries" ? 'bg-primary/20 text-primary' : 'bg-white/10 group-hover:bg-primary/20 text-white'}`}>
                      <MessageSquare size={18} />
                    </div>
                    {t('profile.my_enquiries')}
                  </button>
                )}
              </nav>
            </div>
          </div>

          {/* Details / Enquiries Content Area */}
          <div className="md:col-span-2 space-y-8">
            {activeTab === "profile" ? (
              <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 md:p-12 shadow-soft animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Shield size={24} className="text-primary" />
                    {t('profile.personal_info')}
                  </h3>
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:underline"
                    >
                      <Edit3 size={14} />
                      {t('profile.edit_profile')}
                    </button>
                  ) : (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600"
                      >
                        <X size={14} />
                        {t('profile.cancel')}
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 text-emerald-500 font-black uppercase tracking-widest text-[10px] hover:underline disabled:opacity-50"
                      >
                        <Save size={14} />
                        {saving ? t('profile.saving') : t('profile.save_changes')}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-8">
                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3 block">{t('profile.label_name')}</label>
                      <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent">
                        <User size={18} className="text-slate-500 dark:text-slate-400" />
                        {isEditing ? (
                          <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="bg-transparent w-full font-black text-slate-800 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                          />
                        ) : (
                          <span className="font-black text-slate-800 dark:text-white truncate">{user.name}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3 block">{t('profile.label_email')}</label>
                      <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent opacity-60">
                        <Mail size={18} className="text-slate-500 dark:text-slate-400" />
                        <span className="font-black text-slate-800 dark:text-white truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Phone & Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3 block">{t('profile.label_phone')}</label>
                      <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent">
                        <Phone size={18} className="text-slate-500 dark:text-slate-400" />
                        {isEditing ? (
                          <input 
                            type="text" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder={t('profile.label_phone')}
                            className="bg-transparent w-full font-black text-slate-800 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                          />
                        ) : (
                          <span className="font-black text-slate-800 dark:text-white truncate">{user.phone || t('profile.not_provided')}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3 block">{t('profile.label_address')}</label>
                      <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent">
                        <MapPin size={18} className="text-slate-500 dark:text-slate-400" />
                        {isEditing ? (
                          <input 
                            type="text" 
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder={t('profile.label_address')}
                            className="bg-transparent w-full font-black text-slate-800 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                          />
                        ) : (
                          <span className="font-black text-slate-800 dark:text-white truncate">{user.address || t('profile.not_provided')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* City & Zip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3 block">{t('profile.label_city')}</label>
                      <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent">
                        <Database size={18} className="text-slate-500 dark:text-slate-400" />
                        {isEditing ? (
                          <input 
                            type="text" 
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder={t('profile.label_city')}
                            className="bg-transparent w-full font-black text-slate-800 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                          />
                        ) : (
                          <span className="font-black text-slate-800 dark:text-white truncate">{user.city || t('profile.not_provided')}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3 block">{t('profile.label_zip')}</label>
                      <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent">
                        <Hash size={18} className="text-slate-500 dark:text-slate-400" />
                        {isEditing ? (
                          <input 
                            type="text" 
                            name="zip"
                            value={formData.zip}
                            onChange={handleInputChange}
                            placeholder={t('profile.label_zip')}
                            className="bg-transparent w-full font-black text-slate-800 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                          />
                        ) : (
                          <span className="font-black text-slate-800 dark:text-white truncate">{user.zip || t('profile.not_provided')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-2xl ${user.emailVerified ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                        <Shield size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white leading-none mb-1">{t('profile.account_security')}</h4>
                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                          {user.emailVerified ? t('profile.fully_protected') : t('profile.action_required')}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-bold leading-relaxed">
                      {user.emailVerified 
                        ? t('profile.security_desc_verified')
                        : t('profile.security_desc_pending')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <MessageSquare size={24} className="text-primary" />
                    {t('profile.support_enquiries')}
                  </h3>
                  <button onClick={() => setActiveTab("profile")} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
                    {t('profile.back_to_profile')}
                  </button>
                </div>

                {loadingEnquiries ? (
                  <div className="p-24 text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : enquiries.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] p-20 text-center border border-slate-100 dark:border-white/5">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mx-auto mb-6">
                      <MessageSquare size={32} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold italic">{t('profile.no_enquiries')}</p>
                    <Link to="/" className="text-primary font-black uppercase tracking-widest text-[10px] mt-4 block hover:underline">{t('profile.start_enquiry')} →</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enquiries.map((enquiry) => (
                      <div key={enquiry._id} className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-soft">
                        <div className="flex justify-between items-start gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${enquiry.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                                {enquiry.status === 'resolved' ? t('profile.resolved') : t('profile.pending_response')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {enquiry.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-800 dark:text-white font-black leading-tight italic">"{enquiry.message}"</p>
                          </div>
                          <button 
                            onClick={() => setActiveChatId(activeChatId === enquiry._id ? null : enquiry._id)}
                            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${activeChatId === enquiry._id ? 'bg-primary text-white' : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white'}`}
                          >
                            <MessageSquare size={14} />
                            {activeChatId === enquiry._id ? t('profile.close') : t('profile.chat')}
                          </button>
                        </div>

                        {activeChatId === enquiry._id && (
                          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col h-[400px]">
                            {/* Chat Messages */}
                            <div className="flex-grow overflow-y-auto mb-6 space-y-4 px-2">
                              {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-50">
                                  <p className="text-slate-400 font-bold italic text-sm">{t('profile.no_response')}</p>
                                </div>
                              ) : (
                                chatMessages.map((msg) => (
                                  <div key={msg.id} className={`flex flex-col ${!msg.isAdmin ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium ${
                                      !msg.isAdmin 
                                        ? 'bg-primary text-white rounded-tr-none' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none'
                                    }`}>
                                      {msg.text}
                                    </div>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 px-2">
                                      {msg.isAdmin ? t('profile.support_team') : t('profile.you')} • {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('profile.sending')}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Chat Input */}
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                              <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder={t('profile.type_message')}
                                className="flex-grow bg-slate-50 dark:bg-white/5 border-none rounded-xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none"
                              />
                              <button 
                                type="submit"
                                disabled={!chatInput.trim() || isSending}
                                className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50"
                              >
                                <Send size={18} />
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
