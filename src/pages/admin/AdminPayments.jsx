import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Check, X, Eye, Image as ImageIcon, RefreshCw, DollarSign, User, Calendar } from 'lucide-react'
import { supabase, updateInvoiceStatus, verifyPaymentProof } from '../../lib/supabase'
import { notifyPaymentStatus } from '../../lib/telegram'
import { sendPaymentVerificationStatus } from '../../lib/whatsapp'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

const AdminPayments = () => {
  const [pendingPayments, setPendingPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [notes, setNotes] = useState('')
  const [viewingProof, setViewingProof] = useState(null)

  useEffect(() => {
    loadPendingPayments()
  }, [])

  const loadPendingPayments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          user:profiles(*),
          order:orders(*),
          payment_proofs(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPendingPayments(data)
    } catch (error) {
      toast.error('Gagal memuat data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (invoice, approved) => {
    setVerifying(true)
    try {
      // Update invoice status
      await updateInvoiceStatus(
        invoice.id, 
        approved ? 'paid' : 'unpaid',
        notes
      )

      // Verify payment proof if exists
      if (invoice.payment_proofs && invoice.payment_proofs.length > 0) {
        for (const proof of invoice.payment_proofs) {
          await verifyPaymentProof(proof.id, approved, notes)
        }
      }

      // Send notifications (non-blocking)
      const invoiceWithNotes = { ...invoice, admin_notes: notes }
      notifyPaymentStatus(invoiceWithNotes, approved).catch(err => console.log('Telegram failed:', err))
      sendPaymentVerificationStatus(invoiceWithNotes, approved).catch(err => console.log('WhatsApp failed:', err))

      toast.success(approved ? 'Pembayaran diverifikasi!' : 'Pembayaran ditolak')
      setShowModal(false)
      setSelectedPayment(null)
      setNotes('')
      loadPendingPayments()
    } catch (error) {
      toast.error('Gagal memverifikasi: ' + error.message)
    } finally {
      setVerifying(false)
    }
  }

  const openModal = (payment) => {
    setSelectedPayment(payment)
    setShowModal(true)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
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
                Verifikasi Pembayaran
              </h1>
              <p className="text-gray-600">
                <span className="font-semibold text-blue-600">{pendingPayments.length}</span> pembayaran menunggu verifikasi
              </p>
            </div>
            <button
              onClick={loadPendingPayments}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : pendingPayments.length === 0 ? (
            <div className="glass-effect rounded-xl p-12 text-center">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak ada pembayaran pending
              </h3>
              <p className="text-gray-600">
                Semua pembayaran sudah terverifikasi
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingPayments.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-effect rounded-xl p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Invoice Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                          {invoice.invoice_number}
                        </span>
                        <span className="px-3 py-1 rounded-lg border text-sm font-semibold bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pending Verification
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-3">
                        {invoice.service_type}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User size={16} className="text-blue-600" />
                          <span><span className="font-semibold text-gray-900">Customer:</span> {invoice.user?.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign size={16} className="text-green-600" />
                          <span><span className="font-semibold text-gray-900">Total:</span> <span className="text-green-600 font-bold">{formatCurrency(invoice.total_amount)}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={16} className="text-purple-600" />
                          <span><span className="font-semibold text-gray-900">Tanggal:</span> {format(new Date(invoice.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <AlertCircle size={16} className="text-orange-600" />
                          <span><span className="font-semibold text-gray-900">Metode:</span> {invoice.payment_method || 'Transfer'}</span>
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm mb-4">
                        {invoice.description}
                      </p>

                      {invoice.payment_proofs && invoice.payment_proofs.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-900 font-semibold mb-2">
                            Bukti Pembayaran:
                          </p>
                          {invoice.payment_proofs.map((proof, idx) => (
                            <button
                              key={idx}
                              onClick={() => setViewingProof(proof.file_url)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                            >
                              <ImageIcon size={16} />
                              {proof.file_name || `Bukti ${idx + 1}`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      {invoice.payment_proofs && invoice.payment_proofs.length > 0 && (
                        <a
                          href={invoice.payment_proofs[0].file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors text-sm"
                        >
                          <Eye size={16} />
                          Lihat Bukti
                        </a>
                      )}
                      <button
                        onClick={() => openModal(invoice)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                      >
                        <Check size={16} />
                        Verifikasi
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Verification Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verifikasi Pembayaran
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
              <div>
                <p className="text-xs text-gray-600">Invoice:</p>
                <p className="font-mono font-semibold text-blue-600">{selectedPayment.invoice_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Customer:</p>
                <p className="font-semibold text-gray-900">{selectedPayment.user?.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total:</p>
                <p className="font-bold text-green-600">{formatCurrency(selectedPayment.total_amount)}</p>
              </div>
            </div>

            {selectedPayment.payment_proofs && selectedPayment.payment_proofs.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-900 font-semibold mb-2">Bukti Pembayaran:</p>
                <a
                  href={selectedPayment.payment_proofs[0].file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <ImageIcon size={16} />
                  Lihat Bukti Transfer
                </a>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-900 mb-2 font-semibold text-sm">
                Catatan Admin (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Tambahkan catatan jika diperlukan..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleVerify(selectedPayment, false)}
                disabled={verifying}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <X size={18} />
                Tolak
              </button>
              <button
                onClick={() => handleVerify(selectedPayment, true)}
                disabled={verifying}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                <Check size={18} />
                {verifying ? 'Verifying...' : 'Approve'}
              </button>
            </div>

            <button
              onClick={() => {
                setShowModal(false)
                setSelectedPayment(null)
                setNotes('')
              }}
              disabled={verifying}
              className="w-full mt-3 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
            >
              Batal
            </button>
          </motion.div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingProof && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingProof(null)}
        >
          <motion.img
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            src={viewingProof}
            alt="Bukti Pembayaran"
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      )}
    </div>
  )
}

export default AdminPayments
