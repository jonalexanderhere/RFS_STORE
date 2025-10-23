import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Send, ArrowLeft, FileText, Calendar, Phone, Mail, User, CheckCircle } from 'lucide-react'
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
    contactPhone: '',
    contactEmail: user?.email || '',
    additionalInfo: '',
    urgency: 'normal'
  })

  useEffect(() => {
    loadService()
  }, [serviceId])

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, contactEmail: user.email }))
    }
  }, [user])

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
          urgency: formData.urgency,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back Button */}
          <button
            onClick={() => navigate('/services')}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 mb-6 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            Kembali ke Layanan
          </button>

          {/* Service Header */}
          <div className="glass-effect rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{service?.icon}</div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Pesan {service?.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {service?.description}
                </p>
              </div>
              <div className="hidden md:block">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                  {service?.category}
                </span>
              </div>
            </div>
          </div>

          {/* Order Form */}
          <div className="glass-effect rounded-2xl p-6 md:p-8">

            <h2 className="text-xl font-bold text-gray-900 mb-6">Detail Pesanan</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-gray-900 mb-2 font-semibold text-sm">
                  <FileText size={18} className="text-blue-600" />
                  Deskripsi Pesanan <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  placeholder="Jelaskan detail pesanan Anda (misal: jenis tugas, mata kuliah, spesifikasi, dll)"
                />
                <p className="text-xs text-gray-500 mt-1">Jelaskan sedetail mungkin kebutuhan Anda</p>
              </div>

              {/* Urgency & Deadline Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Urgency */}
                <div>
                  <label className="flex items-center gap-2 text-gray-900 mb-2 font-semibold text-sm">
                    <CheckCircle size={18} className="text-blue-600" />
                    Tingkat Urgensi
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent (1-2 hari)</option>
                    <option value="very_urgent">Very Urgent (< 24 jam)</option>
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className="flex items-center gap-2 text-gray-900 mb-2 font-semibold text-sm">
                    <Calendar size={18} className="text-blue-600" />
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-gray-900 mb-2 font-semibold text-sm">
                    <Phone size={18} className="text-blue-600" />
                    No. WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="08123456789"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-gray-900 mb-2 font-semibold text-sm">
                    <Mail size={18} className="text-blue-600" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <label className="flex items-center gap-2 text-gray-900 mb-2 font-semibold text-sm">
                  <FileText size={18} className="text-blue-600" />
                  Informasi Tambahan (Opsional)
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  placeholder="Tambahkan informasi lain yang perlu kami ketahui"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900 text-sm leading-relaxed">
                  <strong className="font-semibold">Catatan:</strong> Setelah pesanan dibuat, admin kami akan meninjau
                  kebutuhan Anda dan membuat invoice dengan harga yang sesuai. Invoice akan
                  dikirimkan melalui email, Telegram, dan WhatsApp.
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send size={18} />
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

