import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Edit, Eye, Trash2, Search, Filter, RefreshCw, CheckCircle, Clock, XCircle, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAllOrders, updateOrderStatus } from '../../lib/supabase'
import { notifyOrderStatus } from '../../lib/telegram'
import { sendOrderStatusUpdate } from '../../lib/whatsapp'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await getAllOrders()
      setOrders(data)
    } catch (error) {
      toast.error('Gagal memuat pesanan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return

    setUpdating(true)
    try {
      await updateOrderStatus(selectedOrder.id, newStatus, adminNotes)
      
      // Send notifications (non-blocking)
      const updatedOrder = { ...selectedOrder, status: newStatus, admin_notes: adminNotes }
      notifyOrderStatus(updatedOrder).catch(err => console.log('Telegram failed:', err))
      sendOrderStatusUpdate(updatedOrder).catch(err => console.log('WhatsApp failed:', err))
      
      toast.success('Status pesanan berhasil diupdate')
      loadOrders()
      setShowModal(false)
      setSelectedOrder(null)
      setNewStatus('')
      setAdminNotes('')
    } catch (error) {
      toast.error('Gagal update status: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const openUpdateModal = (order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setAdminNotes(order.admin_notes || '')
    setShowModal(true)
  }

  const filteredOrders = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => 
      searchTerm === '' || 
      o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.service?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: <Clock size={14} /> },
      processing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <RefreshCw size={14} /> },
      completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: <CheckCircle size={14} /> },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <XCircle size={14} /> }
    }
    return badges[status] || badges.pending
  }

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Manajemen Pesanan
              </h1>
              <p className="text-gray-600">
                Kelola dan pantau semua pesanan
              </p>
            </div>
            <button
              onClick={loadOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Search & Filter */}
          <div className="glass-effect rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cari order number, nama customer, atau layanan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { key: 'all', label: 'Semua', count: statusCounts.all },
                { key: 'pending', label: 'Pending', count: statusCounts.pending },
                { key: 'processing', label: 'Processing', count: statusCounts.processing },
                { key: 'completed', label: 'Completed', count: statusCounts.completed },
                { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled }
              ].map((status) => (
                <button
                  key={status.key}
                  onClick={() => setFilter(status.key)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    filter === status.key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {status.label} ({status.count})
                </button>
              ))}
            </div>
          </div>

          {/* Orders Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="glass-effect rounded-xl p-12 text-center">
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada pesanan</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Tidak ada pesanan yang cocok dengan pencarian' : 'Belum ada pesanan masuk'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => {
                const statusBadge = getStatusBadge(order.status)
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-effect rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                            {order.order_number}
                          </span>
                          <span className={`flex items-center gap-1 px-3 py-1 rounded-lg border text-sm font-semibold ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                            {statusBadge.icon}
                            {order.status}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {order.service?.name || 'N/A'}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-semibold text-gray-900">Customer:</span> {order.user?.full_name || 'N/A'}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">Phone:</span> {order.user?.phone || 'N/A'}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">Tanggal:</span> {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 text-sm line-clamp-2 mb-2">
                          {order.description}
                        </p>

                        {order.admin_notes && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                            <p className="text-sm text-blue-900">
                              <span className="font-semibold">Admin Notes:</span> {order.admin_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col gap-2">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm"
                        >
                          <Send size={16} />
                          Kirim Hasil
                        </Link>
                        <button
                          onClick={() => openUpdateModal(order)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                        >
                          <Edit size={16} />
                          Update Status
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Update Status Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Update Status Pesanan
            </h2>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Order Number:</p>
              <p className="font-mono font-semibold text-blue-600">{selectedOrder.order_number}</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-900 mb-2 font-semibold text-sm">
                Status Baru
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-900 mb-2 font-semibold text-sm">
                Catatan Admin (Opsional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Tambahkan catatan untuk customer..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedOrder(null)
                }}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
