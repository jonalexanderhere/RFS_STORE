import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Edit, Eye, DollarSign, Search, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react'
import { getAllOrders, createInvoice, getAllInvoices } from '../../lib/supabase'
import { notifyNewInvoice } from '../../lib/telegram'
import { sendInvoiceViaWhatsApp } from '../../lib/whatsapp'
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
  const [searchTerm, setSearchTerm] = useState('')
  
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
    setLoading(true)
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

      const createdInvoice = await createInvoice(invoiceData)
      
      // Send notifications (non-blocking)
      const fullInvoice = { ...createdInvoice, user: order.user }
      notifyNewInvoice(fullInvoice).catch(err => console.log('Telegram failed:', err))
      sendInvoiceViaWhatsApp(fullInvoice).catch(err => console.log('WhatsApp failed:', err))
      
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

  const getStatusBadge = (status) => {
    const badges = {
      unpaid: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: <Clock size={14} /> },
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: <Clock size={14} /> },
      paid: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: <CheckCircle size={14} /> },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <XCircle size={14} /> }
    }
    return badges[status] || badges.unpaid
  }

  const filteredInvoices = invoices
    .filter(i => filter === 'all' || i.status === filter)
    .filter(i =>
      searchTerm === '' ||
      i.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const statusCounts = {
    all: invoices.length,
    unpaid: invoices.filter(i => i.status === 'unpaid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    paid: invoices.filter(i => i.status === 'paid').length
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Manajemen Invoice
              </h1>
              <p className="text-gray-600">
                Kelola invoice dan pembayaran
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                <Plus size={18} />
                Buat Invoice
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="glass-effect rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cari invoice number, nama customer, atau layanan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { key: 'all', label: 'Semua', count: statusCounts.all },
                { key: 'unpaid', label: 'Unpaid', count: statusCounts.unpaid },
                { key: 'pending', label: 'Pending', count: statusCounts.pending },
                { key: 'paid', label: 'Paid', count: statusCounts.paid }
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

          {/* Invoices Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="glass-effect rounded-xl p-12 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada invoice</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Tidak ada invoice yang cocok dengan pencarian' : 'Belum ada invoice dibuat'}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                <Plus size={18} />
                Buat Invoice
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredInvoices.map((invoice) => {
                const statusBadge = getStatusBadge(invoice.status)
                return (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-effect rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                            {invoice.invoice_number}
                          </span>
                          <span className={`flex items-center gap-1 px-3 py-1 rounded-lg border text-sm font-semibold ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                            {statusBadge.icon}
                            {invoice.status}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {invoice.service_type}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-semibold text-gray-900">Customer:</span> {invoice.user?.full_name || 'N/A'}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">Total:</span> <span className="text-green-600 font-bold">{formatCurrency(invoice.total_amount)}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">Tanggal:</span> {format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: id })}
                          </div>
                        </div>

                        <p className="text-gray-700 text-sm line-clamp-2">
                          {invoice.description}
                        </p>
                      </div>

                      <div className="flex md:flex-col gap-2">
                        <Link
                          to={`/invoice/${invoice.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                        >
                          <Eye size={16} />
                          Lihat
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Buat Invoice Baru
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-900 mb-2 font-semibold text-sm">
                  Pilih Pesanan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.order_id}
                  onChange={handleOrderSelect}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Pesanan --</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.order_number} - {order.user?.full_name} - {order.service?.name}
                    </option>
                  ))}
                </select>
                {orders.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Semua pesanan sudah memiliki invoice
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-900 mb-2 font-semibold text-sm">
                  Jenis Layanan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.service_type}
                  onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-900 mb-2 font-semibold text-sm">
                  Deskripsi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-900 mb-2 font-semibold text-sm">
                    Total Amount (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                    required
                    min="0"
                    step="1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 mb-2 font-semibold text-sm">
                    Metode Pembayaran
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="transfer">Transfer Bank</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
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
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating || orders.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Membuat...' : 'Buat Invoice'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AdminInvoices
