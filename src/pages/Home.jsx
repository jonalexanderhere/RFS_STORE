import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Zap, Shield, Clock, BarChart3, Users, FileText } from 'lucide-react'

const Home = () => {
  const features = [
    {
      icon: <Zap size={32} className="text-blue-600" />,
      title: 'Cepat & Efisien',
      description: 'Proses pemesanan mudah dengan sistem otomatis yang terintegrasi'
    },
    {
      icon: <Shield size={32} className="text-blue-600" />,
      title: 'Aman & Terpercaya',
      description: 'Keamanan data terjamin dengan enkripsi tingkat enterprise'
    },
    {
      icon: <Clock size={32} className="text-blue-600" />,
      title: 'Real-time Updates',
      description: 'Notifikasi instan via Telegram dan WhatsApp'
    }
  ]

  const benefits = [
    'Invoice digital otomatis',
    'Pembayaran aman & terverifikasi',
    'Notifikasi multi-channel',
    'Dashboard lengkap & analitik',
    'Customer support 24/7',
    'Harga kompetitif & transparan'
  ]

  const stats = [
    { icon: <Users size={24} />, value: '500+', label: 'Klien Terpercaya' },
    { icon: <FileText size={24} />, value: '1000+', label: 'Proyek Selesai' },
    { icon: <BarChart3 size={24} />, value: '98%', label: 'Kepuasan Klien' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block mb-4"
          >
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
              Platform Layanan Profesional
            </span>
          </motion.div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Solusi Digital untuk
            <span className="block mt-1 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Kesuksesan Akademik Anda
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Platform terpadu dengan sistem invoice otomatis, integrasi komunikasi multi-channel, 
            dan manajemen proyek yang efisien.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link to="/services">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-md"
              >
                Mulai Sekarang <ArrowRight size={16} />
              </motion.button>
            </Link>
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 bg-white border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 rounded-lg text-sm font-semibold transition-all"
              >
                Daftar Gratis
              </motion.button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-10 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-1 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Mengapa Memilih Kami?
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Solusi terbaik dengan teknologi terdepan dan layanan profesional
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-effect rounded-xl p-6 card-hover text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Keuntungan Bergabung dengan Kami
              </h2>
              <p className="text-sm md:text-base text-gray-600 mb-6">
                Platform lengkap dengan fitur-fitur unggulan untuk mendukung kesuksesan Anda
              </p>
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="text-green-600" size={14} />
                    </div>
                    <span className="text-gray-700 text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="glass-effect rounded-2xl p-6"
            >
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Invoice Otomatis</h3>
                    <p className="text-sm text-gray-600">
                      Sistem invoice digital yang otomatis dan terintegrasi dengan notifikasi real-time
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Keamanan Terjamin</h3>
                    <p className="text-sm text-gray-600">
                      Data Anda dilindungi dengan enkripsi dan sistem keamanan tingkat enterprise
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Dashboard Analytics</h3>
                    <p className="text-sm text-gray-600">
                      Pantau semua aktivitas dengan dashboard lengkap dan laporan detail
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-br from-blue-600 to-blue-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Siap Memulai?
          </h2>
          <p className="text-sm md:text-base text-blue-100 mb-6 max-w-xl mx-auto">
            Bergabunglah dengan ratusan klien yang telah mempercayai layanan kami
          </p>
          <Link to="/register">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-white text-blue-600 rounded-lg text-base font-bold hover:shadow-xl transition-all"
            >
              Daftar Sekarang - Gratis
            </motion.button>
          </Link>
        </motion.div>
      </section>
    </div>
  )
}

export default Home
