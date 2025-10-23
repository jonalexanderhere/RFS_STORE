import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Edit, Eye, Trash2, Plus } from 'lucide-react'
import { getAllOrders, updateOrderStatus } from '../../lib/supabase'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
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

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter)

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300'
      case 'processing':
        return 'bg-blue-500/20 text-blue-300'
      case 'completed':
        return 'bg-green-500/20 text-green-300'
      case 'cancelled':
        return 'bg-red-500/20 text-red-300'
      default:
        return 'bg-gray-500/20 text-gray-300'
    }
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Manajemen Pesanan
          </h1>
          
          {/* Filter */}
          <div className="flex flex-wrap gap-3">
            {['all', 'pending', 'processing', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === status
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-white/10 text-gray-200 hover:bg-white/20'
                }`}
              >
                {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="glass-effect rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">No. Pesanan</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Pelanggan</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Layanan</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Tanggal</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-300">{order.order_number}</td>
                      <td className="px-6 py-4 text-white">{order.user?.full_name}</td>
                      <td className="px-6 py-4 text-gray-300">{order.service?.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {format(new Date(order.created_at), 'dd MMM yyyy', { locale: id })}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openUpdateModal(order)}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                          title="Edit Status"
                        >
                          <Edit size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-effect rounded-2xl p-12 text-center">
            <Package size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Tidak ada pesanan</h3>
            <p className="text-gray-300">
              {filter === 'all' 
                ? 'Belum ada pesanan yang masuk'
                : `Tidak ada pesanan dengan status "${filter}"`
              }
            </p>
          </div>
        )}

        {/* Update Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Update Pesanan</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">No. Pesanan</p>
                  <p className="text-white font-semibold">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Pelanggan</p>
                  <p className="text-white">{selectedOrder.user?.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Layanan</p>
                  <p className="text-white">{selectedOrder.service?.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Deskripsi</p>
                  <p className="text-white">{selectedOrder.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-semibold">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold">Catatan Admin</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                    placeholder="Tambahkan catatan untuk pelanggan"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedOrder(null)
                  }}
                  className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminOrders

