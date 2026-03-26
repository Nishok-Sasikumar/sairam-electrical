import { createContext, useContext, useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth"
import { doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribeSnapshot = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Set up real-time listener for Firestore user document
        const userRef = doc(db, "users", firebaseUser.uid)
        
        unsubscribeSnapshot = onSnapshot(userRef, async (doc) => {
          const userData = doc.exists() ? doc.data() : {}
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || userData.name,
            phone: userData.phone || "",
            address: userData.address || "",
            city: userData.city || "",
            zip: userData.zip || "",
            wishlist: userData.wishlist || [],
            emailVerified: firebaseUser.emailVerified || userData.isVerified,
            isAdmin: userData.isAdmin || false,
            role: userData.role || "user",
            token: await firebaseUser.getIdToken()
          })
          setLoading(false)
        })
      } else {
        if (unsubscribeSnapshot) unsubscribeSnapshot()
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeSnapshot) unsubscribeSnapshot()
    }
  }, [])

  const toggleWishlist = async (productId) => {
    if (!user) return { success: false, message: "Login required" }
    
    const userRef = doc(db, "users", user.uid)
    const isFavorited = user.wishlist?.includes(productId)

    try {
      await updateDoc(userRef, {
        wishlist: isFavorited ? arrayRemove(productId) : arrayUnion(productId)
      })
      return { success: true, favorited: !isFavorited }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
      return { success: false, message: error.message }
    }
  }

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.code === 'auth/user-not-found' ? 'User not found' : 
                 error.code === 'auth/wrong-password' ? 'Invalid password' : 
                 error.message,
      }
    }
  }

  const register = async (name, email, password, role = "user") => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update profile name
      await updateProfile(firebaseUser, { displayName: name })
      
      // Save user data to Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        name,
        email,
        role,
        isAdmin: role === "admin",
        isVerified: true, // They verified via OTP before this call
        phone: "",
        address: "",
        city: "",
        zip: "",
        createdAt: new Date()
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      }
    }
  }

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const { user: firebaseUser } = await signInWithPopup(auth, provider)
      
      // Save user data to Firestore if it's a new user
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", firebaseUser.uid), {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          role: "user",
          isAdmin: false,
          isVerified: true,
          phone: "",
          address: "",
          city: "",
          zip: "",
          createdAt: new Date()
        })
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      }
    }
  }

  const logout = () => {
    return signOut(auth)
  }

  const reloadUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload()
      const firebaseUser = auth.currentUser
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
      const userData = userDoc.exists() ? userDoc.data() : {}
      
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || userData.name,
        emailVerified: firebaseUser.emailVerified || userData.isVerified,
        isAdmin: userData.isAdmin || false,
        role: userData.role || "user",
        token: await firebaseUser.getIdToken()
      })
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, reloadUser, toggleWishlist, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

/* eslint-disable react-refresh/only-export-components */
export const useAuth = () => useContext(AuthContext)
