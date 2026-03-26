import {BrowserRouter,Routes,Route} from "react-router-dom"
import { useTranslation } from 'react-i18next'
import Home from "./pages/Home"
import Catalog from "./pages/Catalog"
import ProductPage from "./pages/ProductPage"
import Cart from "./pages/Cart"
import ARView from "./pages/ARView"
import Checkout from "./pages/Checkout"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import MyOrders from "./pages/MyOrders"
import Profile from "./pages/Profile"
import ManageAddresses from "./pages/ManageAddresses"
import Wishlist from "./pages/Wishlist"
import Settings from "./pages/Settings"
import AdminDashboard from "./pages/AdminDashboard"
import AdminProducts from "./pages/AdminProducts"
import SeedFirestore from "./pages/SeedFirestore"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import { useAuth } from "./context/AuthContext"
import { Navigate } from "react-router-dom"
import { useEffect } from "react"

const UserRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}

function App(){
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.language
    if (i18n.language.startsWith('ta')) {
      document.body.classList.add('lang-ta')
    } else {
      document.body.classList.remove('lang-ta')
    }
  }, [i18n.language])

  return(
    <BrowserRouter>
      <div className={`flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 ${i18n.language.startsWith('ta') ? 'font-tamil' : ''}`}>
        <Navbar/>
        <main className="pt-20">
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/catalog" element={<Catalog/>} />
            <Route path="/product/:id" element={<ProductPage/>} />
            <Route path="/cart" element={<UserRoute><Cart/></UserRoute>} />
            <Route path="/ar/:id" element={<ARView/>} />
            <Route path="/checkout" element={<UserRoute><Checkout/></UserRoute>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/signup" element={<Signup/>} />
            <Route path="/wishlist" element={<UserRoute><Wishlist/></UserRoute>} />
            <Route path="/my-orders" element={<UserRoute><MyOrders/></UserRoute>} />
            <Route path="/profile" element={<UserRoute><Profile/></UserRoute>} />
            <Route path="/manage-addresses" element={<UserRoute><ManageAddresses/></UserRoute>} />
            <Route path="/settings" element={<UserRoute><Settings/></UserRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard/></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts/></AdminRoute>} />
            <Route path="/seed-firestore" element={<SeedFirestore/>} />
          </Routes>
        </main>
        <Footer/>
      </div>
    </BrowserRouter>
  )
}
export default App