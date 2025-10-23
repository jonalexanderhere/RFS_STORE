import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Package, DollarSign, Users, Clock, TrendingUp, 
  FileText, AlertCircle, CheckCircle, ArrowRight, Activity
} from 'lucide-react'
import { getStatistics, getAllOrders, getAllInvoices } from '../../lib/supabase'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsData, ordersData, invoicesData] = await Promise.all([
        getStatistics(),
        getAllOrders(),
        getAllInvoices()
      ])

      setStats(statsData)
      setRecentOrders(ordersData.slice(0, 5))
      setRecentInvoices(invoicesData.slice(0, 5))
    } catch (error) {
      toast.error('Gagal memuat data dashboard: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      unpaid: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Pesanan',
      value: stats?.totalOrders || 0,
      icon: <Package size={24} />,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Pesanan Aktif',
      value: stats?.activeOrders || 0,
      icon: <Clock size={24} />,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Total Pendapatan',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: <DollarSign size={24} />,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: '+23%',
      trendUp: true
    },
    {
      title: 'Total Pengguna',
      value: stats?.totalUsers || 0,
      icon: <Users size={24} />,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: '+5%',
      trendUp: true
    }
  ]

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Activity size={18} />
                Kelola dan monitor semua aktivitas platform
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-effect rounded-2xl p-6 card-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.bgColor} ${card.iconColor} p-3 rounded-xl`}>
                  {card.icon}
                </div>
                <div className={`text-sm font-semibold ${card.trendUp ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                  <TrendingUp size={16} className={card.trendUp ? '' : 'rotate-180'} />
                  {card.trend}
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Link to="/admin/orders" className="glass-effect rounded-xl p-4 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Package size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Kelola</p>
                <p className="font-semibold text-gray-900">Pesanan</p>
              </div>
              <ArrowRight size={18} className="ml-auto text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link to="/admin/invoices" className="glass-effect rounded-xl p-4 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 text-green-600 p-2 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Kelola</p>
                <p className="font-semibold text-gray-900">Invoice</p>
              </div>
              <ArrowRight size={18} className="ml-auto text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link to="/admin/payments" className="glass-effect rounded-xl p-4 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-50 text-yellow-600 p-2 rounded-lg group-hover:bg-yellow-600 group-hover:text-white transition-colors">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Verifikasi</p>
                <p className="font-semibold text-gray-900">Pembayaran</p>
              </div>
              <ArrowRight size={18} className="ml-auto text-gray-400 group-hover:text-yellow-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link to="/admin/reports" className="glass-effect rounded-xl p-4 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 text-purple-600 p-2 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lihat</p>
                <p className="font-semibold text-gray-900">Laporan</p>
              </div>
              <ArrowRight size={18} className="ml-auto text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass-effect rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package size={24} className="text-blue-600" />
                Pesanan Terbaru
              </h2>
              <Link to="/admin/orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                Lihat Semua <ArrowRight size={16} />
              </Link>
            </div>

            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Belum ada pesanan</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">#{order.order_number}</p>
                        <p className="text-sm text-gray-600">{order.services?.name || 'Service'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{order.users?.full_name || 'User'}</span>
                      <span className="text-gray-500">{format(new Date(order.created_at), 'dd MMM yyyy', { locale: id })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Invoices */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass-effect rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText size={24} className="text-green-600" />
                Invoice Terbaru
              </h2>
              <Link to="/admin/invoices" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                Lihat Semua <ArrowRight size={16} />
              </Link>
            </div>

            <div className="space-y-3">
              {recentInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Belum ada invoice</p>
                </div>
              ) : (
                recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-600">{invoice.users?.full_name || 'User'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(invoice.payment_status)}`}>
                        {invoice.payment_status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 font-semibold">{formatCurrency(invoice.total_amount)}</span>
                      <span className="text-gray-500">{format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: id })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
