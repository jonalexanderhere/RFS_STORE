import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, User, LogOut, LayoutDashboard, ShoppingBag, Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../lib/supabase'
import toast from 'react-hot-toast'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, profile, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Berhasil logout')
      navigate('/')
    } catch (error) {
      toast.error('Gagal logout: ' + error.message)
    }
  }

  const menuVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: "100%" }
  }

  return (
    <header className="glass-effect sticky top-0 z-50 border-b border-gray-200">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base">R</span>
              </div>
              <div>
                <span className="text-base font-bold text-gray-900 tracking-tight">RFS STORE</span>
                <span className="text-[10px] text-gray-500 block -mt-0.5">Professional Services</span>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Beranda
            </Link>
            <Link to="/services" className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Layanan
            </Link>
            
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="text-sm text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5 font-medium">
                    <LayoutDashboard size={16} />
                    Admin
                  </Link>
                )}
                <Link to="/dashboard" className="text-sm text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5 font-medium">
                  <User size={16} />
                  Dashboard
                </Link>
                <Link to="/my-orders" className="text-sm text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5 font-medium">
                  <ShoppingBag size={16} />
                  Pesanan Saya
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={isOpen ? "open" : "closed"}
          variants={menuVariants}
          transition={{ duration: 0.3 }}
          className={`md:hidden ${isOpen ? 'block' : 'hidden'} mt-4 space-y-4 pb-4 border-t border-gray-200 pt-4`}
        >
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block text-gray-700 hover:text-blue-600 transition-colors py-2 font-medium"
          >
            Beranda
          </Link>
          <Link
            to="/services"
            onClick={() => setIsOpen(false)}
            className="block text-gray-700 hover:text-blue-600 transition-colors py-2 font-medium"
          >
            Layanan
          </Link>
          
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 hover:text-blue-600 transition-colors py-2 flex items-center gap-2 font-medium"
                >
                  <LayoutDashboard size={18} />
                  Admin Panel
                </Link>
              )}
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 hover:text-blue-600 transition-colors py-2 flex items-center gap-2 font-medium"
              >
                <User size={18} />
                Dashboard
              </Link>
              <Link
                to="/my-orders"
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 hover:text-blue-600 transition-colors py-2 flex items-center gap-2 font-medium"
              >
                <ShoppingBag size={18} />
                Pesanan Saya
              </Link>
              <button
                onClick={() => {
                  handleLogout()
                  setIsOpen(false)
                }}
                className="flex items-center gap-2 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 hover:text-blue-600 transition-colors py-2 font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center font-medium"
              >
                Daftar
              </Link>
            </>
          )}
        </motion.div>
      </nav>
    </header>
  )
}

export default Header

