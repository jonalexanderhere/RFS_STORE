import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Send, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { createOrder, supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const OrderPage = () => {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    deadline: '',
    additionalInfo: ''
  })

  useEffect(() => {
    loadService()
  }, [serviceId])

  const loadService = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single()
      
      if (error) throw error
      setService(data)
    } catch (error) {
      toast.error('Gagal memuat layanan: ' + error.message)
      navigate('/services')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.description.trim()) {
      toast.error('Mohon isi deskripsi pesanan')
      return
    }

    setSubmitting(true)

    try {
      const orderData = {
        service_id: serviceId,
        description: formData.description,
        details: {
          deadline: formData.deadline,
          additionalInfo: formData.additionalInfo
        },
        status: 'pending'
      }

      await createOrder(orderData)
      
      toast.success('Pesanan berhasil dibuat! Admin akan segera membuat invoice.')
      navigate('/my-orders')
    } catch (error) {
      toast.error('Gagal membuat pesanan: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <button
            onClick={() => navigate('/services')}
            className="flex items-center gap-2 text-white hover:text-blue-300 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Kembali ke Layanan
          </button>

          <div className="glass-effect rounded-3xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{service?.icon}</div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {service?.name}
              </h1>
              <p className="text-gray-200">
                {service?.description}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white mb-2 font-semibold">
                  Deskripsi Pesanan <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                  placeholder="Jelaskan detail pesanan Anda (misal: jenis tugas, mata kuliah, spesifikasi, dll)"
                />
              </div>

              <div>
                <label className="block text-white mb-2 font-semibold">
                  Deadline (Opsional)
                </label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white mb-2 font-semibold">
                  Informasi Tambahan (Opsional)
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors resize-none"
                  placeholder="Tambahkan informasi lain yang perlu kami ketahui"
                />
              </div>

              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>Catatan:</strong> Setelah pesanan dibuat, admin kami akan meninjau
                  kebutuhan Anda dan membuat invoice dengan harga yang sesuai. Invoice akan
                  dikirimkan melalui Telegram dan WhatsApp.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send size={20} />
                    Kirim Pesanan
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default OrderPage

