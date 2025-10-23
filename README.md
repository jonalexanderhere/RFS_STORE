# 🚀 RFS_STORE x InspiraProject

Complete digital services platform with automated invoice system.

## Features

✅ **6 Services**
- Jasa Tugas
- Sewa Laptop  
- Joki Makalah
- Jasa Desain
- Laporan PKL
- **Jasa Pembuatan Website** (NEW)

✅ **Auto-Invoice System**
- Invoice created automatically when order completed
- Flexible pricing (no fixed price)
- Payment proof verification
- Result delivery

✅ **Smart Notifications**
- Telegram Bot integration
- WhatsApp via Fonnte
- Multi-admin support

## Quick Start

### 1. Database Setup
```bash
# Run in Supabase SQL Editor
COMPLETE_DATABASE_PRODUCTION.sql
```

### 2. Admin Login
```
URL: https://rfs-store.vercel.app/login

Admin 1: admin1@rfsstore.com / Admin@123
Admin 2: admin2@rfsstore.com / Admin@123
```

### 3. Environment Variables
```bash
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_TELEGRAM_BOT_TOKEN=your_token
VITE_TELEGRAM_ADMIN_CHAT_ID=id1,id2
VITE_FONNTE_DEVICE_TOKEN=your_token
VITE_ADMIN_WHATSAPP_1=6282181183590
VITE_ADMIN_WHATSAPP_2=6282176466707
```

## Workflow

See [WORKFLOW.md](WORKFLOW.md) for complete flowchart.

**Simple Flow:**
1. Customer creates order
2. Admin marks as "completed" → Invoice auto-created
3. Admin sets invoice amount
4. Customer uploads payment proof
5. Admin verifies payment
6. Admin sends result

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Supabase (Database + Auth + Storage)
- **Notifications:** Telegram Bot + WhatsApp (Fonnte)
- **Deployment:** Vercel

## Admin Numbers

**Admin 1:**
- WhatsApp: 6282181183590
- Telegram: 5788748857

**Admin 2:**
- WhatsApp: 6282176466707
- Telegram: 6478150893

## License

MIT
