import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Package, User, Calendar, Phone, Mail, 
  Upload, Send, CheckCircle, FileText, Download, Link as LinkIcon
} from 'lucide-react'
import { supabase, updateOrderStatus } from '../../lib/supabase'
import { notifyOrderStatus } from '../../lib/telegram'
import { sendOrderStatusUpdate } from '../../lib/whatsapp'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import toast from 'react-hot-toast'

const AdminOrderDetail = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  
  const [resultData, setResultData] = useState({
    result_url: '',
    result_message: '',
    notify_telegram: true,
    notify_whatsapp: true
  })

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:profiles(*),
          service:services(*),
          invoice:invoices(*)
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrder(data)
      setResultData(prev => ({
        ...prev,
        result_url: data.result_url || '',
        result_message: data.result_message || ''
      }))
    } catch (error) {
      toast.error('Gagal memuat order: ' + error.message)
      navigate('/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('order-results')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('order-results')
        .getPublicUrl(fileName)

      setResultData(prev => ({ ...prev, result_url: publicUrl }))
      toast.success('File uploaded successfully!')
    } catch (error) {
      toast.error('Upload failed: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSendResult = async () => {
    if (!resultData.result_url && !resultData.result_message) {
      toast.error('Mohon isi URL atau pesan untuk customer')
      return
    }

    setSending(true)
    try {
      // Update order with result
      const { error } = await supabase
        .from('orders')
        .update({
          result_url: resultData.result_url,
          result_message: resultData.result_message,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // Call Edge Function to send notifications
      const notify_channels = []
      if (resultData.notify_telegram) notify_channels.push('telegram')
      if (resultData.notify_whatsapp) notify_channels.push('whatsapp')

      const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-result', {
        body: {
          order_id: orderId,
          result_url: resultData.result_url,
          result_message: resultData.result_message,
          notify_channels
        }
      })

      if (sendError) {
        console.error('Notification error:', sendError)
      }

      toast.success('Hasil berhasil dikirim ke customer!')
      loadOrder()
    } catch (error) {
      toast.error('Gagal kirim hasil: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) return null

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
      processing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
    }
    return badges[status] || badges.pending
  }

  const statusBadge = getStatusBadge(order.status)

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 mb-6 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            Kembali ke Orders
          </button>

          {/* Order Info Card */}
          <div className="glass-effect rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Order Detail
                </h1>
                <p className="text-sm font-mono text-blue-600">{order.order_number}</p>
              </div>
              <span className={`px-4 py-2 rounded-lg border font-semibold ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="flex items-start gap-3">
                <User size={20} className="text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold text-gray-900">{order.user?.full_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={20} className="text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{order.user?.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={20} className="text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{order.user?.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={20} className="text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package size={20} className="text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Service</p>
                  <p className="font-semibold text-gray-900">{order.service?.name}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Description:</p>
              <p className="text-gray-900">{order.description}</p>
            </div>
          </div>

          {/* Send Result Card */}
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Send size={20} className="text-blue-600" />
              Kirim Hasil Jokian
            </h2>

            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-gray-900 mb-2 font-semibold text-sm">
                Upload File Hasil
              </label>
              <div className="flex gap-3">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                {uploading && (
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload PDF, ZIP, DOC, atau file lainnya
              </p>
            </div>

            {/* Result URL */}
            <div className="mb-4">
              <label className="block text-gray-900 mb-2 font-semibold text-sm">
                Atau Masukkan Link
              </label>
              <div className="flex gap-2">
                <LinkIcon size={20} className="text-gray-400 mt-2" />
                <input
                  type="url"
                  value={resultData.result_url}
                  onChange={(e) => setResultData(prev => ({ ...prev, result_url: e.target.value }))}
                  placeholder="https://drive.google.com/... atau link lainnya"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Result Message */}
            <div className="mb-4">
              <label className="block text-gray-900 mb-2 font-semibold text-sm">
                Pesan untuk Customer
              </label>
              <textarea
                value={resultData.result_message}
                onChange={(e) => setResultData(prev => ({ ...prev, result_message: e.target.value }))}
                rows={4}
                placeholder="Contoh: Halo, tugas Anda sudah selesai dikerjakan. Silakan download file hasil melalui link di atas. Terima kasih!"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Notification Options */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-3">Kirim Notifikasi Via:</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resultData.notify_telegram}
                    onChange={(e) => setResultData(prev => ({ ...prev, notify_telegram: e.target.checked }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-blue-900">Telegram</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resultData.notify_whatsapp}
                    onChange={(e) => setResultData(prev => ({ ...prev, notify_whatsapp: e.target.checked }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-blue-900">WhatsApp</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSendResult}
              disabled={sending || (!resultData.result_url && !resultData.result_message)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Mengirim...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Kirim Hasil ke Customer
                </>
              )}
            </button>

            {order.result_url && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900 font-semibold mb-2">
                  ✅ Hasil sudah dikirim:
                </p>
                <a
                  href={order.result_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <Download size={14} />
                  {order.result_url}
                </a>
                {order.result_message && (
                  <p className="text-sm text-gray-700 mt-2">{order.result_message}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminOrderDetail

