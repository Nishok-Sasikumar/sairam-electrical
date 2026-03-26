import { Link, useLocation } from "react-router-dom"
import { ShoppingCart, Home, Search, Menu, X, Zap, User, Languages, Heart } from "lucide-react"
import { useState, useEffect } from "react"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from 'react-i18next'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { cartCount } = useCart()
  const { user, logout } = useAuth()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path) => location.pathname === path

  return (
    <div className={`fixed top-6 left-0 right-0 z-50 flex justify-center transition-all duration-500 ${scrolled ? 'top-4' : 'top-6'}`}>
      <nav className={`flex items-center gap-8 px-6 py-3 rounded-full border border-slate-200 dark:border-white/20 shadow-xl transition-all duration-500 bg-white dark:bg-slate-900/95 backdrop-blur-md max-w-[95vw] overflow-x-auto no-scrollbar ${scrolled ? 'px-8 py-2.5 shadow-emerald-500/10 border-primary/20' : 'px-6 py-3'}`}>
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="bg-primary p-1.5 rounded-full shadow-glow">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white leading-none">{t('nav.brand_part1')} {t('nav.brand_part2')}</span>
            <span className="text-[8px] font-black text-primary uppercase tracking-widest">{t('nav.traders')}</span>
          </div>
        </Link>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-200 dark:bg-white/20 hidden md:block"></div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/" className={`px-5 py-2.5 rounded-full text-sm font-black transition-all flex items-center min-h-[44px] ${isActive('/') ? 'bg-primary text-white shadow-glow' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary'}`}>
            <span className="pb-0.5 uppercase tracking-widest text-[10px] whitespace-nowrap">{t('nav.home')}</span>
          </Link>
          {user && user.isAdmin && (
            <Link to="/admin" className={`px-5 py-2.5 rounded-full text-sm font-black transition-all flex items-center min-h-[44px] ${isActive('/admin') ? 'bg-primary text-white shadow-glow' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary'}`}>
              <span className="pb-0.5 uppercase tracking-widest text-[10px] whitespace-nowrap">{t('nav.admin')}</span>
            </Link>
          )}
          {(!user || !user.isAdmin) && (
            <Link to="/catalog" className={`px-5 py-2.5 rounded-full text-sm font-black transition-all flex items-center min-h-[44px] ${isActive('/catalog') ? 'bg-primary text-white shadow-glow' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary'}`}>
              <span className="pb-0.5 uppercase tracking-widest text-[10px] whitespace-nowrap">{t('nav.catalog')}</span>
            </Link>
          )}
          {user && !user.isAdmin && (
            <>
              <Link to="/wishlist" className={`px-5 py-2.5 rounded-full text-sm font-black transition-all relative flex items-center min-h-[44px] ${isActive('/wishlist') ? 'bg-primary text-white shadow-glow' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary'}`}>
                <span className="pb-0.5 uppercase tracking-widest text-[10px] whitespace-nowrap">{t('nav.wishlist', 'Wishlist')}</span>
                {user.wishlist?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 font-black shadow-lg">
                    {user.wishlist.length}
                  </span>
                )}
              </Link>
              <Link to="/cart" className={`px-5 py-2.5 rounded-full text-sm font-black transition-all relative flex items-center min-h-[44px] ${isActive('/cart') ? 'bg-primary text-white shadow-glow' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary'}`}>
                <span className="pb-0.5 uppercase tracking-widest text-[10px] whitespace-nowrap">{t('nav.cart')}</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 font-black shadow-lg">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}
        </div>

        {/* Language Switcher */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-white/10 p-1.5 rounded-full border border-slate-200 dark:border-white/10 ml-4">
          <button 
            onClick={() => changeLanguage('en')}
            className={`min-w-[40px] h-10 px-3 rounded-full text-[11px] font-black transition-all flex items-center justify-center ${i18n.language.startsWith('en') ? 'bg-white dark:bg-slate-800 text-primary shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            EN
          </button>
          <button 
            onClick={() => changeLanguage('ta')}
            className={`min-w-[64px] h-10 px-4 rounded-full text-[11px] font-black transition-all flex items-center justify-center ${i18n.language.startsWith('ta') ? 'bg-white dark:bg-slate-800 text-primary shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            தமிழ்
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-900 dark:text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* User Auth Section */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  {user.isAdmin && (
                    <span className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white dark:text-slate-900 text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border border-white/20 flex-shrink-0">{t('nav.admin_tag', 'Admin')}</span>
                  )}
                  <Link to="/profile" className="text-[10px] font-black text-slate-900 dark:text-white leading-none hover:text-primary transition-colors truncate max-w-[100px] uppercase tracking-widest" title={user.name}>{user.name}</Link>
                </div>
                <button 
                  onClick={logout}
                  className="text-[8px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors"
                >
                  {t('nav.logout')}
                </button>
              </div>
              <Link to="/profile" className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs hover:scale-110 transition-all shadow-glow">
                {user.name.charAt(0).toUpperCase()}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-5 py-2.5 rounded-full text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest hover:text-primary transition-all">
                {t('nav.login')}
              </Link>
              <Link to="/signup" className="btn-primary px-6 py-2.5 text-[10px] shadow-none hover:shadow-glow">
                {t('nav.signup', 'Sign Up')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu (Floating Dropdown) */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-4 mx-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/10 shadow-2xl p-6 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
            <Link to="/" className={`px-6 py-4 rounded-2xl font-bold ${isActive('/') ? 'bg-primary text-white shadow-glow' : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`} onClick={() => setIsOpen(false)}>
              <div className="flex items-center gap-3">
                <Home size={18} /> {t('nav.home')}
              </div>
            </Link>
            {user && user.isAdmin && (
              <Link to="/admin" className={`px-6 py-4 rounded-2xl font-bold ${isActive('/admin') ? 'bg-primary text-white shadow-glow' : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`} onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-3">
                  <Zap size={18} /> {t('nav.admin')}
                </div>
              </Link>
            )}
            {(!user || !user.isAdmin) && (
              <Link to="/catalog" className={`px-6 py-4 rounded-2xl font-bold ${isActive('/catalog') ? 'bg-primary text-white shadow-glow' : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`} onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-3">
                  <Search size={18} /> {t('nav.catalog')}
                </div>
              </Link>
            )}
            {user && !user.isAdmin && (
              <>
                <Link to="/wishlist" className={`px-6 py-4 rounded-2xl font-bold ${isActive('/wishlist') ? 'bg-primary text-white shadow-glow' : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`} onClick={() => setIsOpen(false)}>
                  <div className="flex items-center gap-3 relative">
                    <Heart size={18} /> {t('nav.wishlist', 'Wishlist')}
                    {user.wishlist?.length > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{user.wishlist.length}</span>
                    )}
                  </div>
                </Link>
                <Link to="/cart" className={`px-6 py-4 rounded-2xl font-bold ${isActive('/cart') ? 'bg-primary text-white shadow-glow' : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`} onClick={() => setIsOpen(false)}>
                  <div className="flex items-center gap-3 relative">
                    <ShoppingCart size={18} /> {t('nav.cart')}
                    {cartCount > 0 && (
                      <span className="bg-secondary dark:bg-primary text-white text-xs px-2 py-0.5 rounded-full">{cartCount}</span>
                    )}
                  </div>
                </Link>
              </>
            )}

            <div className="h-px bg-slate-100 dark:bg-white/10 my-2"></div>
            
            {user ? (
                <div className="flex items-center justify-between px-4 py-2">
                  <Link to="/profile" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">{user.name}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{user.email}</p>
                    </div>
                  </Link>
                  <button onClick={logout} className="text-red-500 font-black uppercase text-[10px] tracking-widest">{t('nav.logout')}</button>
                </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Link to="/login" className="px-6 py-4 rounded-2xl font-bold bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-center" onClick={() => setIsOpen(false)}>{t('nav.login')}</Link>
                <Link to="/signup" className="px-6 py-4 rounded-2xl font-bold bg-primary text-white text-center shadow-glow" onClick={() => setIsOpen(false)}>{t('nav.signup', 'Sign Up')}</Link>
              </div>
            )}

            <div className="h-px bg-slate-100 dark:bg-white/10 my-2"></div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => { changeLanguage('en'); setIsOpen(false); }}
                className={`flex-grow py-4 rounded-2xl font-bold text-sm ${i18n.language.startsWith('en') ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}
              >
                {t('nav.lang_en')}
              </button>
              <button 
                onClick={() => { changeLanguage('ta'); setIsOpen(false); }}
                className={`flex-grow py-4 rounded-2xl font-bold text-sm ${i18n.language.startsWith('ta') ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}
              >
                {t('nav.lang_ta')}
              </button>
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}

export default Navbar
