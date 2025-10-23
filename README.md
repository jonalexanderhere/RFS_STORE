# RFS_STORE x InspiraProject

<div align="center">
  <h3>🚀 Platform Layanan Digital & Akademik Profesional</h3>
  <p>Sistem terintegrasi dengan invoice otomatis, notifikasi real-time via Telegram & WhatsApp</p>
  
  [![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?logo=supabase)](https://supabase.com/)
</div>

---

## 📋 Deskripsi

**RFS_STORE** adalah platform modern untuk layanan digital dan akademik dengan sistem manajemen terintegrasi. Platform ini menyediakan:

- ✅ **Invoice Otomatis** - Generate invoice digital secara otomatis
- 📱 **Notifikasi Multi-Channel** - Telegram Bot & WhatsApp Gateway
- 📊 **Dashboard Lengkap** - Monitoring real-time untuk admin & user
- 🔒 **Keamanan Tingkat Enterprise** - Enkripsi data & RLS
- 🎨 **UI Modern & Professional** - Clean design, responsive, smooth animations

---

## ✨ Features

### 🎯 Core Features
- **Manajemen Pesanan** - Sistem order lengkap dengan tracking status
- **Invoice Digital** - Generate & kelola invoice otomatis
- **Payment Verification** - Upload bukti bayar & verifikasi admin
- **User Dashboard** - Pantau pesanan & invoice
- **Admin Dashboard** - Kelola semua aktivitas platform

### 📱 Integrasi Komunikasi
- **Telegram Bot** - Notifikasi otomatis via Telegram
- **WhatsApp Gateway** - Integrasi dengan Fonnte API
- **Email Notifications** - Notifikasi via email (opsional)

### 🎨 UI/UX
- **Modern Design** - Clean white theme, professional blue scheme
- **Fully Responsive** - Mobile, tablet, desktop optimized
- **Smooth Animations** - Framer Motion untuk UX yang mulus
- **Accessible** - Focus states, keyboard navigation

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **Lucide Icons** - Icon library
- **React Hot Toast** - Notifications
- **date-fns** - Date formatting

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Row Level Security (RLS)
  - Edge Functions
  - Real-time subscriptions
  - Storage

### Integrations
- **Telegram Bot API** - Bot notifications
- **Fonnte WhatsApp API** - WhatsApp messaging
- **Supabase Edge Functions** - Serverless functions

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js >= 18.0.0
npm >= 9.0.0
Git
```

### Installation

1. **Clone repository**
```bash
git clone https://github.com/jonalexanderhere/RFS_STORE.git
cd RFS_STORE
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
# Copy CONFIG_ENV.txt dan buat .env file
cp CONFIG_ENV.txt .env

# Edit .env dan isi dengan kredensial Anda:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_TELEGRAM_BOT_TOKEN
# - VITE_FONNTE_TOKEN
```

4. **Setup Supabase database**
```bash
# Login ke Supabase dashboard
# Buka SQL Editor
# Copy & run supabase-schema.sql
```

5. **Run development server**
```bash
npm run dev
```

6. **Open browser**
```
http://localhost:3000
```

---

## 📦 Project Structure

```
RFS_STORE/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── ServiceCard.jsx
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   └── admin/          # Admin pages
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx
│   ├── lib/                # Utilities & integrations
│   │   ├── supabase.js
│   │   ├── telegram.js
│   │   └── whatsapp.js
│   └── App.jsx
├── supabase/
│   └── functions/          # Edge functions
│       ├── send-whatsapp/
│       ├── telegram-webhook/
│       ├── notify-order/
│       └── notify-invoice/
├── public/                 # Static assets
└── docs/                   # Documentation
```

---

## 📚 Documentation

Dokumentasi lengkap tersedia di folder root:

- **`MULAI_DISINI.md`** - 📖 Panduan lengkap (MULAI DI SINI!)
- **`QUICK_START.md`** - ⚡ Setup cepat
- **`SETUP_LOCAL.md`** - 💻 Setup environment lokal
- **`DEPLOYMENT.md`** - 🚀 Deploy ke production
- **`API_GUIDE.md`** - 📡 Dokumentasi API
- **`PROJECT_SUMMARY.md`** - 📊 Overview project

---

## 🎨 Design System

### Color Palette
- **Primary Blue:** `#2563eb` - Main actions, links
- **Success Green:** `#10b981` - Success states
- **Warning Yellow:** `#f59e0b` - Warnings, pending
- **Danger Red:** `#ef4444` - Errors, destructive actions
- **Gray Scale:** `#111827` to `#f8fafc` - Text & backgrounds

### Typography
- **Font Family:** Inter (Google Fonts)
- **Headings:** Bold, 700-800 weight
- **Body:** Regular, 400-500 weight
- **Small:** 300 weight for secondary text

---

## 🔐 Environment Variables

Create `.env` file in root directory:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Telegram Bot
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
VITE_TELEGRAM_ADMIN_CHAT_ID=your_admin_chat_id

# WhatsApp (Fonnte)
VITE_FONNTE_TOKEN=your_fonnte_token
VITE_FONNTE_SENDER=your_phone_number
```

⚠️ **NEVER commit `.env` file to Git!**

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect GitHub repository**
```bash
# Visit https://vercel.com
# Import RFS_STORE repository
```

2. **Configure environment variables**
```
Add all variables from .env file
```

3. **Deploy**
```
Click "Deploy" button
```

### Alternative Platforms
- **Netlify** - Similar to Vercel
- **Railway** - Full-stack deployment
- **Render** - Free tier available

Lihat `DEPLOYMENT.md` untuk panduan lengkap.

---

## 📱 Screenshots

### Landing Page
Modern professional landing page dengan clean design.

### Dashboard
User dashboard dengan stats overview & quick actions.

### Admin Panel
Complete admin dashboard untuk manage orders, invoices, payments.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👥 Authors

- **Jonathan Alexander** - *Initial work* - [@jonalexanderhere](https://github.com/jonalexanderhere)

---

## 🙏 Acknowledgments

- Design inspiration from modern SaaS platforms
- UI components inspired by Stripe, Linear, Vercel
- Community feedback & testing

---

## 📞 Support

Need help? Contact us:

- 📧 Email: admin@rfsstore.com
- 💬 Telegram: [@rfsstore_support](https://t.me/rfsstore_support)
- 📱 WhatsApp: +62 812-3456-7890

---

## 🔗 Links

- **Live Demo:** [https://rfs-store.vercel.app](https://rfs-store.vercel.app) (coming soon)
- **Documentation:** [GitHub Wiki](https://github.com/jonalexanderhere/RFS_STORE/wiki)
- **Issues:** [GitHub Issues](https://github.com/jonalexanderhere/RFS_STORE/issues)
- **Discussions:** [GitHub Discussions](https://github.com/jonalexanderhere/RFS_STORE/discussions)

---

<div align="center">
  <p>Made with ❤️ by RFS_STORE Team</p>
  <p>© 2025 RFS_STORE x InspiraProject. All rights reserved.</p>
</div>
