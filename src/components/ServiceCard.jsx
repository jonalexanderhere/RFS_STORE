import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, Laptop, FileText, Palette, Briefcase } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const ServiceCard = ({ service }) => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleOrder = () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu')
      navigate('/login')
      return
    }
    navigate(`/order/${service.id}`)
  }

  // Icon mapping
  const getIcon = () => {
    if (service.name.includes('Tugas')) return <BookOpen size={40} className="text-blue-600" />
    if (service.name.includes('Laptop')) return <Laptop size={40} className="text-blue-600" />
    if (service.name.includes('Makalah')) return <FileText size={40} className="text-blue-600" />
    if (service.name.includes('Desain')) return <Palette size={40} className="text-blue-600" />
    if (service.name.includes('PKL')) return <Briefcase size={40} className="text-blue-600" />
    return <FileText size={40} className="text-blue-600" />
  }

  const getCategoryLabel = () => {
    if (service.category === 'academic') return 'Akademik'
    if (service.category === 'rental') return 'Rental'
    if (service.category === 'creative') return 'Kreatif'
    return service.category
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-effect rounded-2xl p-6 card-hover h-full flex flex-col"
    >
      <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
        {getIcon()}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.name}</h3>
      <p className="text-gray-600 mb-6 flex-grow leading-relaxed">{service.description}</p>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-full font-medium">
          {getCategoryLabel()}
        </span>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOrder}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium"
        >
          Pesan <ArrowRight size={18} />
        </motion.button>
      </div>
    </motion.div>
  )
}

export default ServiceCard

