import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getServices } from '../lib/supabase'
import ServiceCard from '../components/ServiceCard'
import toast from 'react-hot-toast'

const Services = () => {
  // Hardcoded services as fallback
  const defaultServices = [
    {
      id: '1',
      name: 'Jasa Tugas',
      description: 'Pengerjaan tugas kuliah dan sekolah dengan kualitas terbaik. Dikerjakan oleh tim profesional dengan hasil memuaskan.',
      icon: '📝',
      category: 'Akademik',
      is_active: true
    },
    {
      id: '2',
      name: 'Sewa Laptop',
      description: 'Rental laptop untuk kebutuhan kuliah, kerja, dan event. Spesifikasi tinggi dengan harga terjangkau.',
      icon: '💻',
      category: 'Rental',
      is_active: true
    },
    {
      id: '3',
      name: 'Joki Makalah',
      description: 'Jasa pembuatan makalah, paper, dan karya ilmiah. Dijamin original dan berkualitas tinggi.',
      icon: '📄',
      category: 'Akademik',
      is_active: true
    },
    {
      id: '4',
      name: 'Jasa Desain',
      description: 'Desain grafis untuk poster, banner, logo, dan presentasi. Hasil profesional dan kreatif.',
      icon: '🎨',
      category: 'Desain',
      is_active: true
    },
    {
      id: '5',
      name: 'Laporan PKL',
      description: 'Pembuatan laporan Praktek Kerja Lapangan lengkap dan rapi. Sesuai format institusi Anda.',
      icon: '📊',
      category: 'Akademik',
      is_active: true
    }
  ]

  const [services, setServices] = useState(defaultServices)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      const data = await getServices()
      if (data && data.length > 0) {
        setServices(data)
      }
    } catch (error) {
      // Silently use default services if database not ready
      console.log('Using default services')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-block mb-3">
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
              Layanan Profesional
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Layanan Kami
          </h1>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Solusi profesional untuk kebutuhan akademik dan digital Anda.
            Harga kompetitif dan transparan sesuai kebutuhan.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ServiceCard service={service} />
            </motion.div>
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-xl">Belum ada layanan tersedia</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Services

