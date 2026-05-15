import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Import Bootstrap compiled CSS to avoid compiling node_modules SCSS (prevents deprecation warnings)
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.scss'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './redux/store'
import { checkAuth, hydrateAuth } from './redux/slices/authSlice'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Hydrate auth state from localStorage on app startup
store.dispatch(hydrateAuth());
// Also run checkAuth to validate token if present
store.dispatch(checkAuth());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Provider>
  </StrictMode>,
)
