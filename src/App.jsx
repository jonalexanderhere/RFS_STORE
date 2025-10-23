import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'

// Pages
import Home from './pages/Home'
import Services from './pages/Services'
import OrderPage from './pages/OrderPage'
import InvoicePage from './pages/InvoicePage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MyOrders from './pages/MyOrders'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminInvoices from './pages/admin/AdminInvoices'
import AdminPayments from './pages/admin/AdminPayments'
import AdminReports from './pages/admin/AdminReports'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/services" element={<Layout><Services /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/invoice/:invoiceId" element={<Layout><InvoicePage /></Layout>} />
          
          {/* Protected User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/my-orders" element={
            <ProtectedRoute>
              <Layout><MyOrders /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/order/:serviceId" element={
            <ProtectedRoute>
              <Layout><OrderPage /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <Layout><AdminDashboard /></Layout>
            </AdminRoute>
          } />
          <Route path="/admin/orders" element={
            <AdminRoute>
              <Layout><AdminOrders /></Layout>
            </AdminRoute>
          } />
          <Route path="/admin/invoices" element={
            <AdminRoute>
              <Layout><AdminInvoices /></Layout>
            </AdminRoute>
          } />
          <Route path="/admin/payments" element={
            <AdminRoute>
              <Layout><AdminPayments /></Layout>
            </AdminRoute>
          } />
          <Route path="/admin/reports" element={
            <AdminRoute>
              <Layout><AdminReports /></Layout>
            </AdminRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

