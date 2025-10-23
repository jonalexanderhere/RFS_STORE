import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Clock, CheckCircle, XCircle, ShoppingBag, FileText, TrendingUp, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getUserOrders } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user, profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  const loadOrders = async () => {
    try {
      const data = await getUserOrders(user.id)
      setOrders(data)
    } catch (error) {
      toast.error('Gagal memuat pesanan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', label: 'Menunggu' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'Diproses' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: 'Selesai' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'Dibatalkan' }
    }
    return badges[status] || badges.pending
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={20} className="text-yellow-600" />,
      processing: <Package size={20} className="text-blue-600" />,
      completed: <CheckCircle size={20} className="text-green-600" />,
      cancelled: <XCircle size={20} className="text-red-600" />
    }
    return icons[status] || icons.pending
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length
  }

  const statCards = [
    {
      title: 'Total Pesanan',
      value: stats.total,
      icon: <ShoppingBag size={24} />,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Menunggu',
      value: stats.pending,
      icon: <Clock size={24} />,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Diproses',
      value: stats.processing,
      icon: <Package size={24} />,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Selesai',
      value: stats.completed,
      icon: <CheckCircle size={24} />,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="glass-effect rounded-3xl p-8 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Selamat Datang, {profile?.full_name || 'User'}! 👋
                </h1>
                <p className="text-gray-600 text-lg">
                  Kelola pesanan dan layanan Anda dengan mudah
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <User size={32} className="text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-effect rounded-2xl p-6 card-hover"
            >
              <div className={`${card.bgColor} ${card.iconColor} p-3 rounded-xl mb-4 inline-block`}>
                {card.icon}
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Link to="/services" className="glass-effect rounded-xl p-6 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Pesan Layanan</p>
                <p className="text-sm text-gray-600">Lihat layanan tersedia</p>
              </div>
            </div>
          </Link>

          <Link to="/my-orders" className="glass-effect rounded-xl p-6 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="bg-green-50 text-green-600 p-3 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Package size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Pesanan Saya</p>
                <p className="text-sm text-gray-600">Lihat semua pesanan</p>
              </div>
            </div>
          </Link>

          <Link to="/invoice" className="glass-effect rounded-xl p-6 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="bg-purple-50 text-purple-600 p-3 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <FileText size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Invoice</p>
                <p className="text-sm text-gray-600">Lihat invoice saya</p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-effect rounded-2xl p-6 md:p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package size={28} className="text-blue-600" />
              Pesanan Terbaru
            </h2>
            <Link to="/my-orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Lihat Semua →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={40} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Pesanan</h3>
              <p className="text-gray-600 mb-6">Mulai pesan layanan kami sekarang!</p>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
              >
                <ShoppingBag size={20} />
                Lihat Layanan
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => {
                const statusBadge = getStatusBadge(order.status)
                return (
                  <div
                    key={order.id}
                    className="p-5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="bg-white p-3 rounded-xl border border-gray-200">
                          {getStatusIcon(order.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="font-bold text-gray-900 mb-1">
                                #{order.order_number}
                              </p>
                              <p className="text-gray-700 font-medium">
                                {order.services?.name || 'Service'}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} whitespace-nowrap`}>
                              {statusBadge.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {order.description || 'Tidak ada deskripsi'}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>📅 {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</span>
                            {order.deadline && (
                              <span>⏰ Deadline: {format(new Date(order.deadline), 'dd MMM yyyy', { locale: id })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Link
                        to={`/order/${order.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm whitespace-nowrap self-start md:self-center"
                      >
                        Lihat Detail →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard
