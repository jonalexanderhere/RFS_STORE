import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Check, X, Eye, Image as ImageIcon } from 'lucide-react'
import { supabase, updateInvoiceStatus, verifyPaymentProof } from '../../lib/supabase'
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

  useEffect(() => {
    loadPendingPayments()
  }, [])

  const loadPendingPayments = async () => {
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
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Verifikasi Pembayaran
          </h1>
          <p className="text-gray-200">
            {pendingPayments.length} pembayaran menunggu verifikasi
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          </div>
        ) : pendingPayments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingPayments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white font-bold text-lg mb-1">
                      {payment.invoice_number}
                    </p>
                    <p className="text-gray-300">
                      {payment.user?.full_name}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-semibold">
                    Pending
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Layanan:</span>
                    <span className="text-white">{payment.service_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-blue-400 font-semibold">
                      {formatCurrency(payment.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Metode:</span>
                    <span className="text-white capitalize">{payment.payment_method}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tanggal Upload:</span>
                    <span className="text-white">
                      {format(new Date(payment.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </span>
                  </div>
                </div>

                {payment.proof_url && (
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-2">Bukti Pembayaran:</p>
                    <div className="bg-white/5 rounded-lg p-3">
                      <a
                        href={payment.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                      >
                        <ImageIcon size={18} />
                        Lihat Bukti Pembayaran
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => openModal(payment)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors font-semibold"
                  >
                    <Check size={18} />
                    Verifikasi
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPayment(payment)
                      handleVerify(payment, false)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors font-semibold"
                  >
                    <X size={18} />
                    Tolak
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-effect rounded-2xl p-12 text-center">
            <AlertCircle size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Tidak ada pembayaran yang menunggu
            </h3>
            <p className="text-gray-300">
              Semua pembayaran sudah diverifikasi
            </p>
          </div>
        )}

        {/* Verification Modal */}
        {showModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-effect rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Verifikasi Pembayaran
              </h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">No. Invoice</p>
                  <p className="text-white font-semibold">{selectedPayment.invoice_number}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Pelanggan</p>
                  <p className="text-white">{selectedPayment.user?.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Pembayaran</p>
                  <p className="text-blue-400 font-semibold text-xl">
                    {formatCurrency(selectedPayment.total_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Deskripsi</p>
                  <p className="text-white">{selectedPayment.description}</p>
                </div>

                {selectedPayment.proof_url && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Bukti Pembayaran</p>
                    <div className="bg-white/5 rounded-lg p-4">
                      {selectedPayment.proof_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={selectedPayment.proof_url}
                          alt="Bukti Pembayaran"
                          className="w-full rounded-lg mb-3"
                        />
                      ) : (
                        <div className="text-center py-8">
                          <ImageIcon size={48} className="text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-300 mb-3">File PDF atau format lain</p>
                        </div>
                      )}
                      <a
                        href={selectedPayment.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <Eye size={18} />
                        Buka di Tab Baru
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-white mb-2 font-semibold">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                  placeholder="Tambahkan catatan untuk pelanggan"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleVerify(selectedPayment, true)}
                  disabled={verifying}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <Check size={20} />
                  {verifying ? 'Memverifikasi...' : 'Verifikasi & Setujui'}
                </button>
                <button
                  onClick={() => handleVerify(selectedPayment, false)}
                  disabled={verifying}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                  Tolak Pembayaran
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedPayment(null)
                    setNotes('')
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

export default AdminPayments

