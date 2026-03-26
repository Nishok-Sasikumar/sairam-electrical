import React, { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { useTranslation } from "react-i18next"
import { 
  ArrowLeft, Moon, Sun, Globe, Bell, Shield, 
  Smartphone, Eye, Lock, User, Save, CheckCircle, CheckCircle2, Settings as SettingsIcon 
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

function Settings() {
  const { user } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [success, setSuccess] = useState("")

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true
  })

  const [privacy, setPrivacy] = useState({
    profilePublic: false,
    showOrders: true
  })

  if (!user) {
    navigate("/login")
    return null
  }

  const handleSave = () => {
    setSuccess(t('settings.success_save'))
    setTimeout(() => setSuccess(""), 3000)
  }

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="min-h-screen pb-24 px-4 md:px-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pt-12">
          <div className="animate-in fade-in slide-in-from-left-8 duration-700">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 leading-none">
              {t('settings.title')} <span className="text-primary italic">{t('settings.title_italic')}</span>
            </h1>
            <p className="text-muted">{t('settings.subtitle')}</p>
          </div>
          <Link to="/profile" className="inline-flex items-center gap-2 text-primary hover:underline font-black uppercase tracking-widest text-[10px]">
            <ArrowLeft size={16} />
            {t('settings.back_to_profile')}
          </Link>
        </div>

        {success && (
          <div className="mb-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-300">
            <CheckCircle2 size={20} />
            <p className="text-sm font-bold">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Navigation Sidebar */}
          <div className="md:col-span-1 space-y-4">
            <div className="glass-modern dark:bg-slate-900/50 rounded-[2.5rem] p-6 sticky top-32">
              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary text-white font-bold shadow-glow">
                  <SettingsIcon size={18} /> {t('settings.appearance')}
                </button>
                <button className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 font-bold transition-all">
                  <Bell size={18} /> {t('settings.notifications')}
                </button>
                <button className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 font-bold transition-all">
                  <Shield size={18} /> {t('settings.privacy')}
                </button>
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Appearance Section */}
            <section className="glass-modern dark:bg-slate-900/50 rounded-[3rem] p-10 md:p-12">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                <Eye size={24} className="text-primary" />
                {t('settings.appearance')}
              </h3>
              
              <div className="space-y-8">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-primary">
                      {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{t('settings.theme_title')}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {isDarkMode ? t('settings.currently_dark') : t('settings.currently_light')}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleDarkMode}
                    className={`relative w-16 h-8 rounded-full transition-all duration-500 ${isDarkMode ? 'bg-primary' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-500 ${isDarkMode ? 'left-9' : 'left-1'}`}></div>
                  </button>
                </div>

                {/* Language Selection */}
                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-primary">
                      <Globe size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{t('settings.lang_title')}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('settings.lang_desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => changeLanguage('en')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${i18n.language.startsWith('en') ? 'bg-primary text-white shadow-glow' : 'bg-white dark:bg-slate-800 text-slate-500'}`}
                    >
                      EN
                    </button>
                    <button 
                      onClick={() => changeLanguage('ta')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${i18n.language.startsWith('ta') ? 'bg-primary text-white shadow-glow' : 'bg-white dark:bg-slate-800 text-slate-500'}`}
                    >
                      தமிழ்
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications Section */}
            <section className="glass-modern dark:bg-slate-900/50 rounded-[3rem] p-10 md:p-12">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                <Bell size={24} className="text-primary" />
                {t('settings.notifications')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{t('settings.order_updates')}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t('settings.notif_desc')}</p>
                  </div>
                  <button 
                    onClick={() => setNotifications(prev => ({ ...prev, orderUpdates: !prev.orderUpdates }))}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${notifications.orderUpdates ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${notifications.orderUpdates ? 'left-6.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{t('settings.promotions')}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t('settings.notif_desc')}</p>
                  </div>
                  <button 
                    onClick={() => setNotifications(prev => ({ ...prev, promotions: !prev.promotions }))}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${notifications.promotions ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${notifications.promotions ? 'left-6.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{t('settings.newsletter')}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t('settings.notif_desc')}</p>
                  </div>
                  <button 
                    onClick={() => setNotifications(prev => ({ ...prev, newsletter: !prev.newsletter }))}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${notifications.newsletter ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${notifications.newsletter ? 'left-6.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
              </div>
            </section>

            {/* Privacy Section */}
            <section className="glass-modern dark:bg-slate-900/50 rounded-[3rem] p-10 md:p-12">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                <Lock size={24} className="text-primary" />
                {t('settings.privacy_security')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{t('settings.public_profile')}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t('settings.public_desc')}</p>
                  </div>
                  <button 
                    onClick={() => setPrivacy(prev => ({ ...prev, profilePublic: !prev.profilePublic }))}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${privacy.profilePublic ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${privacy.profilePublic ? 'left-6.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{t('settings.two_factor')}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t('settings.two_factor_desc')}</p>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{t('settings.coming_soon')}</span>
                </div>
              </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave}
                className="btn-primary h-20 px-12 text-lg shadow-glow"
              >
                <Save size={20} />
                {t('settings.save_all')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
