import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Edit, Eye, DollarSign } from 'lucide-react'
import { getAllOrders, createInvoice, getAllInvoices } from '../../lib/supabase'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('all')
  
  const [formData, setFormData] = useState({
    order_id: '',
    service_type: '',
    description: '',
    total_amount: '',
    payment_method: 'transfer'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [invoicesData, ordersData] = await Promise.all([
        getAllInvoices(),
        getAllOrders()
      ])
      setInvoices(invoicesData)
      // Filter orders that don't have invoices yet
      const ordersWithoutInvoice = ordersData.filter(order => 
        !invoicesData.some(inv => inv.order_id === order.id)
      )
      setOrders(ordersWithoutInvoice)
    } catch (error) {
      toast.error('Gagal memuat data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderSelect = (e) => {
    const orderId = e.target.value
    const order = orders.find(o => o.id === orderId)
    
    if (order) {
      setFormData({
        ...formData,
        order_id: orderId,
        service_type: order.service?.name || '',
        description: order.description || ''
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.order_id || !formData.total_amount) {
      toast.error('Mohon lengkapi semua field')
      return
    }

    setCreating(true)

    try {
      const order = orders.find(o => o.id === formData.order_id)
      
      const invoiceData = {
        order_id: formData.order_id,
        user_id: order.user_id,
        service_type: formData.service_type,
        description: formData.description,
        total_amount: parseFloat(formData.total_amount),
        payment_method: formData.payment_method,
        status: 'unpaid'
      }

      await createInvoice(invoiceData)
      toast.success('Invoice berhasil dibuat!')
      setShowModal(false)
      setFormData({
        order_id: '',
        service_type: '',
        description: '',
        total_amount: '',
        payment_method: 'transfer'
      })
      loadData()
    } catch (error) {
      toast.error('Gagal membuat invoice: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const filteredInvoices = filter === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === filter)

  const getStatusColor = (status) => {
    switch (status) {
      case 'unpaid':
        return 'bg-red-500/20 text-red-300'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300'
      case 'paid':
        return 'bg-green-500/20 text-green-300'
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-300'
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-white">
              Manajemen Invoice
            </h1>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              Buat Invoice
            </button>
          </div>
          
          {/* Filter */}
          <div className="flex flex-wrap gap-3">
            {['all', 'unpaid', 'pending', 'paid', 'cancelled'].map((status) => (
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
        ) : filteredInvoices.length > 0 ? (
          <div className="glass-effect rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">No. Invoice</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Pelanggan</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Layanan</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Total</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Tanggal</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-white">{invoice.user?.full_name}</td>
                      <td className="px-6 py-4 text-gray-300">{invoice.service_type}</td>
                      <td className="px-6 py-4 text-blue-400 font-semibold">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: id })}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/invoice/${invoice.id}`}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors inline-flex"
                          title="Lihat Invoice"
                        >
                          <Eye size={18} />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-effect rounded-2xl p-12 text-center">
            <FileText size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Tidak ada invoice</h3>
            <p className="text-gray-300 mb-6">
              {filter === 'all' 
                ? 'Belum ada invoice yang dibuat'
                : `Tidak ada invoice dengan status "${filter}"`
              }
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Buat Invoice Pertama
            </button>
          </div>
        )}

        {/* Create Invoice Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Buat Invoice Baru</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-semibold">
                    Pilih Pesanan <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.order_id}
                    onChange={handleOrderSelect}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="">-- Pilih Pesanan --</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id} className="bg-gray-800">
                        {order.order_number} - {order.user?.full_name} - {order.service?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold">
                    Jenis Layanan
                  </label>
                  <input
                    type="text"
                    value={formData.service_type}
                    onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold">
                    Total Pembayaran (Rp) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                      required
                      min="0"
                      step="1000"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                      placeholder="100000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white mb-2 font-semibold">
                    Metode Pembayaran
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="transfer" className="bg-gray-800">Transfer Bank</option>
                    <option value="qris" className="bg-gray-800">QRIS</option>
                    <option value="ewallet" className="bg-gray-800">E-Wallet</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {creating ? 'Membuat Invoice...' : 'Buat Invoice'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setFormData({
                        order_id: '',
                        service_type: '',
                        description: '',
                        total_amount: '',
                        payment_method: 'transfer'
                      })
                    }}
                    className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminInvoices

