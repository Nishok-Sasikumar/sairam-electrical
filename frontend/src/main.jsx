import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"
import { CartProvider } from "./context/CartContext"
import { AuthProvider } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import ErrorBoundary from "./components/ErrorBoundary"
import "./i18n"
import "./firebase"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)