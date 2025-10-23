import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Clock, CheckCircle, XCircle, FileText, ExternalLink, Filter, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getUserOrders } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

const MyOrders = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

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
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', label: 'Menunggu', icon: <Clock size={16} /> },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'Diproses', icon: <Package size={16} /> },
      completed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: 'Selesai', icon: <CheckCircle size={16} /> },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'Dibatalkan', icon: <XCircle size={16} /> }
    }
    return badges[status] || badges.pending
  }

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.services?.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const filterButtons = [
    { value: 'all', label: 'Semua', count: orders.length },
    { value: 'pending', label: 'Menunggu', count: orders.filter(o => o.status === 'pending').length },
    { value: 'processing', label: 'Diproses', count: orders.filter(o => o.status === 'processing').length },
    { value: 'completed', label: 'Selesai', count: orders.filter(o => o.status === 'completed').length },
    { value: 'cancelled', label: 'Dibatalkan', count: orders.filter(o => o.status === 'cancelled').length }
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Pesanan Saya
          </h1>
          <p className="text-gray-600">
            Kelola dan pantau semua pesanan Anda
          </p>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-effect rounded-2xl p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cari nomor pesanan atau layanan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Filter Dropdown (Mobile) */}
            <div className="md:hidden">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {filterButtons.map(btn => (
                  <option key={btn.value} value={btn.value}>
                    {btn.label} ({btn.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Buttons (Desktop) */}
          <div className="hidden md:flex flex-wrap gap-2 mt-4">
            {filterButtons.map(btn => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === btn.value
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {btn.label} <span className="ml-1 text-sm">({btn.count})</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-effect rounded-2xl p-12 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filter !== 'all' ? 'Tidak Ada Pesanan Ditemukan' : 'Belum Ada Pesanan'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'Coba ubah pencarian atau filter Anda' 
                : 'Mulai pesan layanan kami sekarang!'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
              >
                <Package size={20} />
                Lihat Layanan
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const statusBadge = getStatusBadge(order.status)
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="glass-effect rounded-2xl p-6 card-hover"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-xl">
                          {statusBadge.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              #{order.order_number}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} flex items-center gap-1`}>
                              {statusBadge.icon}
                              {statusBadge.label}
                            </span>
                          </div>
                          <p className="text-lg font-semibold text-gray-800 mb-2">
                            {order.services?.name || 'Service'}
                          </p>
                          <p className="text-gray-600 mb-3">
                            {order.description || 'Tidak ada deskripsi'}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={16} />
                              Dibuat: {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                            </span>
                            {order.deadline && (
                              <span className="flex items-center gap-1">
                                <Clock size={16} />
                                Deadline: {format(new Date(order.deadline), 'dd MMM yyyy', { locale: id })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {order.notes && (
                        <div className="ml-16 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-sm text-gray-700">
                            <strong>Catatan:</strong> {order.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex flex-col gap-3 lg:min-w-[200px]">
                      <Link
                        to={`/order/${order.id}`}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
                      >
                        <ExternalLink size={18} />
                        Lihat Detail
                      </Link>
                      {order.invoice_id && (
                        <Link
                          to={`/invoice/${order.invoice_id}`}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-xl font-semibold transition-all"
                        >
                          <FileText size={18} />
                          Lihat Invoice
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyOrders
