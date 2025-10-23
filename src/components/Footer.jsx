import { Heart, Mail, Phone, MessageCircle } from 'lucide-react'

const Footer = () => {
  const whatsappNumber = '6281234567890' // Ganti dengan nomor WhatsApp admin
  const telegramUsername = 'rfsstore_admin' // Ganti dengan username Telegram admin

  return (
    <footer className="glass-effect mt-12 py-8 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                RFS STORE
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Platform layanan digital dan akademik profesional dengan sistem manajemen terintegrasi, 
              invoice otomatis, dan notifikasi real-time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tautan Cepat</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Beranda
                </a>
              </li>
              <li>
                <a href="/services" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Layanan
                </a>
              </li>
              <li>
                <a href="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Login
                </a>
              </li>
              <li>
                <a href="/register" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Daftar
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Hubungi Kami</h3>
            <div className="space-y-3">
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <Phone size={18} />
                WhatsApp
              </a>
              <a
                href={`https://t.me/${telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <MessageCircle size={18} />
                Telegram
              </a>
              <a
                href="mailto:admin@rfsstore.com"
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Mail size={18} />
                Email
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <p className="text-gray-600 flex items-center justify-center gap-2">
            Dibuat dengan <Heart size={18} className="text-red-500" /> oleh RFS_STORE x InspiraProject © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

