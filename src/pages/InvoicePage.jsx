import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Download, Upload, Check, Clock, AlertCircle } from 'lucide-react'
import { getInvoice, uploadPaymentProof } from '../lib/supabase'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

const InvoicePage = () => {
  const { invoiceId } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    loadInvoice()
  }, [invoiceId])

  const loadInvoice = async () => {
    try {
      const data = await getInvoice(invoiceId)
      setInvoice(data)
    } catch (error) {
      toast.error('Gagal memuat invoice: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        toast.error('Format file tidak valid. Gunakan JPG, PNG, WEBP, atau PDF')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB')
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Pilih file terlebih dahulu')
      return
    }

    setUploading(true)

    try {
      await uploadPaymentProof(invoiceId, selectedFile)
      toast.success('Bukti pembayaran berhasil diupload! Admin akan segera memverifikasi.')
      loadInvoice() // Reload invoice data
      setSelectedFile(null)
    } catch (error) {
      toast.error('Gagal upload bukti: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'unpaid':
        return 'bg-red-500/20 text-red-300 border-red-400/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'paid':
        return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'unpaid':
        return 'Belum Dibayar'
      case 'pending':
        return 'Menunggu Verifikasi'
      case 'paid':
        return 'Sudah Dibayar'
      case 'cancelled':
        return 'Dibatalkan'
      default:
        return status
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'unpaid':
        return <AlertCircle className="text-red-400" />
      case 'pending':
        return <Clock className="text-yellow-400" />
      case 'paid':
        return <Check className="text-green-400" />
      default:
        return <AlertCircle className="text-gray-400" />
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText size={64} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Invoice Tidak Ditemukan</h2>
          <p className="text-gray-300">Invoice yang Anda cari tidak tersedia</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-effect rounded-3xl p-8 md:p-12"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Invoice
              </h1>
              <p className="text-gray-200 text-lg font-semibold">
                {invoice.invoice_number}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(invoice.status)}`}>
              {getStatusIcon(invoice.status)}
              <span className="font-semibold">{getStatusText(invoice.status)}</span>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Pelanggan</p>
                <p className="text-white font-semibold">{invoice.user?.full_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Tanggal Invoice</p>
                <p className="text-white font-semibold">
                  {format(new Date(invoice.created_at), 'dd MMMM yyyy', { locale: id })}
                </p>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Layanan</p>
              <p className="text-white font-semibold text-lg">{invoice.service_type}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-1">Deskripsi</p>
              <p className="text-white">{invoice.description}</p>
            </div>

            {invoice.payment_method && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Metode Pembayaran</p>
                <p className="text-white font-semibold capitalize">{invoice.payment_method}</p>
              </div>
            )}
          </div>

          {/* Total Amount */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-white text-xl font-semibold">Total Pembayaran</span>
              <span className="text-white text-3xl font-bold">
                {formatCurrency(invoice.total_amount)}
              </span>
            </div>
          </div>

          {/* Admin Notes */}
          {invoice.admin_notes && (
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 mb-8">
              <p className="text-blue-300 text-sm font-semibold mb-1">Catatan Admin:</p>
              <p className="text-white">{invoice.admin_notes}</p>
            </div>
          )}

          {/* Upload Payment Proof */}
          {invoice.status === 'unpaid' && (
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Upload size={24} />
                Upload Bukti Pembayaran
              </h3>
              <p className="text-gray-300 mb-4">
                Upload bukti transfer atau pembayaran Anda. Format yang diterima: JPG, PNG, WEBP, PDF (Maks. 5MB)
              </p>
              
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:cursor-pointer"
                />
                
                {selectedFile && (
                  <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                    <span className="text-white text-sm">{selectedFile.name}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-red-400 hover:text-red-300 text-sm font-semibold"
                    >
                      Hapus
                    </button>
                  </div>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Upload size={20} />
                      Upload Bukti Pembayaran
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          )}

          {/* Pending Verification */}
          {invoice.status === 'pending' && (
            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock size={24} className="text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Menunggu Verifikasi</h3>
              </div>
              <p className="text-gray-200">
                Bukti pembayaran Anda sedang dalam proses verifikasi oleh admin.
                Anda akan menerima notifikasi segera setelah pembayaran dikonfirmasi.
              </p>
              {invoice.proof_url && (
                <a
                  href={invoice.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <FileText size={18} />
                  Lihat Bukti yang Diupload
                </a>
              )}
            </div>
          )}

          {/* Paid Status */}
          {invoice.status === 'paid' && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Check size={24} className="text-green-400" />
                <h3 className="text-xl font-bold text-white">Pembayaran Terverifikasi</h3>
              </div>
              <p className="text-gray-200 mb-2">
                Pembayaran Anda telah diverifikasi pada{' '}
                {invoice.paid_at && format(new Date(invoice.paid_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
              </p>
              <p className="text-gray-200">
                Terima kasih! Pesanan Anda sedang diproses.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default InvoicePage

