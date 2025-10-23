# ⚡ Quick Start Guide - RFS_STORE

Get your RFS_STORE platform running in 15 minutes!

## 🚀 Fast Track Setup

### Prerequisites (Install if you don't have them)
```bash
# Check Node.js (need v18+)
node --version

# Check npm
npm --version

# If not installed, download from: https://nodejs.org
```

---

## 📦 Step 1: Install Dependencies (2 min)

```bash
cd RFS
npm install
```

Wait for all packages to install...

---

## 🗄️ Step 2: Setup Supabase (5 min)

### 2.1 Create Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login
3. Click **"New Project"**
4. Name: `rfs-store-dev`
5. Password: Generate strong password
6. Region: Southeast Asia
7. Click **"Create new project"**
8. Wait 2 minutes for setup

### 2.2 Run Database Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Open file `supabase-schema.sql` from project
4. Copy ALL content
5. Paste in SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. Should see: "Success. No rows returned"

### 2.3 Get API Keys
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public** key (long string starting with 'eyJ...')

---

## 🤖 Step 3: Setup Telegram Bot (3 min)

### 3.1 Create Bot
1. Open Telegram app
2. Search for `@BotFather`
3. Send: `/newbot`
4. Bot name: `RFS Store Test Bot`
5. Username: `rfsstore_test_bot` (must end with 'bot')
6. Copy the **token** (looks like: 123456:ABC-DEF...)

### 3.2 Get Your Chat ID
1. Send any message to your new bot
2. Open browser: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Look for `"chat":{"id":123456789}`
4. Copy that number

---

## 📱 Step 4: Setup WhatsApp (Optional - 2 min)

### Using Fonnte (Free Trial Available)
1. Go to [fonnte.com](https://fonnte.com)
2. Sign up
3. Scan QR with WhatsApp
4. Go to **Settings**
5. Copy **API Key**

**OR skip for now** - you can add this later!

---

## ⚙️ Step 5: Configure Environment (1 min)

Create `.env` file in project root:

```env
# Copy from .env.example and fill in:

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

VITE_TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
VITE_TELEGRAM_CHAT_ID=123456789

# Optional - can add later
WHATSAPP_API_KEY=your_fonnte_key
WHATSAPP_API_URL=https://api.fonnte.com/send
```

---

## 🎯 Step 6: Run Development Server (1 min)

```bash
npm run dev
```

Should see:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

Open browser: **http://localhost:3000**

---

## ✅ Step 7: Test Basic Features (5 min)

### 7.1 Register Account
1. Click **"Daftar"** (Register)
2. Fill form:
   - Name: Your Name
   - Email: test@example.com
   - Phone: 08123456789
   - Password: test1234
3. Click **"Daftar"**
4. Should redirect to login

### 7.2 Login
1. Email: test@example.com
2. Password: test1234
3. Click **"Login"**
4. Should see Dashboard

### 7.3 Make Admin
1. Go to Supabase Dashboard
2. Go to **Authentication** → **Users**
3. Copy your User ID
4. Go to **Table Editor** → **profiles**
5. Find your profile
6. Change `role` from `user` to `admin`
7. Click **Save**
8. Refresh website
9. Should now see **"Admin"** menu

### 7.4 Test Order Flow
1. Click **"Layanan"**
2. Click **"Pesan"** on any service
3. Fill description: "Test order"
4. Click **"Kirim Pesanan"**
5. Check **Telegram** - you should receive notification!
6. Go to **Admin** → **Manajemen Pesanan**
7. See your order listed

---

## 🎉 You're Done!

### ✅ What's Working:
- Frontend running on localhost:3000
- Database connected to Supabase
- User authentication working
- Admin panel accessible
- Telegram notifications working
- Orders can be created

### 🚫 What's NOT Working Yet:
- WhatsApp notifications (need to deploy Edge Functions)
- Automatic invoice notifications (need triggers)
- Production domain (still on localhost)

---

## 🔥 Next Steps

### For Development:
```bash
# Keep developing locally
npm run dev
```

### For Production:
Read these files in order:
1. `DEPLOYMENT.md` - How to deploy
2. `API_GUIDE.md` - API documentation
3. `README.md` - Full documentation

---

## 🐛 Common Issues & Fixes

### Issue: "Module not found"
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Supabase connection failed"
- Check `.env` file exists
- Verify VITE_SUPABASE_URL is correct
- Verify VITE_SUPABASE_ANON_KEY is correct
- Restart dev server: `npm run dev`

### Issue: "Telegram notifications not working"
- Check bot token is correct
- Check chat ID is correct
- Send message to bot first (to activate chat)
- Verify you copied the right chat ID

### Issue: "Can't see admin menu after changing role"
- Clear browser cookies
- Logout and login again
- Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

### Issue: "SQL error when running schema"
- Make sure you copied ALL of supabase-schema.sql
- Run in SQL Editor, not in terminal
- Check for syntax errors in error message
- Try running in sections if needed

---

## 📝 Development Tips

### Hot Reload
Changes to code automatically reload the browser!

### View Console
Press **F12** → **Console** to see errors

### Database Changes
1. Make changes in Supabase Dashboard
2. Or write SQL in SQL Editor
3. No restart needed!

### Test User Accounts
Create multiple accounts to test:
- One as regular user
- One as admin
- Test order flow between them

---

## 🎓 Learning Resources

### React
- [React Docs](https://react.dev)
- [React Tutorial](https://react.dev/learn)

### Supabase
- [Supabase Docs](https://supabase.com/docs)
- [Supabase YouTube](https://www.youtube.com/@Supabase)

### Telegram Bot
- [Bot API Docs](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots/features#botfather)

---

## 💬 Need Help?

1. Check error in browser console (F12)
2. Check error in terminal where `npm run dev` is running
3. Check Supabase logs in Dashboard
4. Re-read this guide
5. Check README.md for more details

---

## 🎯 Quick Commands Reference

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install new package
npm install package-name

# Check for errors
npm run lint
```

---

## 🔥 Pro Tips

1. **Use Browser DevTools**: F12 → Console shows all errors
2. **Check Network Tab**: See API calls and responses
3. **Test on Mobile**: Use responsive mode in DevTools
4. **Keep Terminal Open**: Watch for build errors
5. **Git Commits**: Commit working code frequently
6. **Test Thoroughly**: Test all features before deploying

---

## ✨ Features to Try

Once everything is working:

1. ✅ Create multiple orders
2. ✅ Create invoices for orders
3. ✅ Upload payment proofs
4. ✅ Verify payments
5. ✅ Update order statuses
6. ✅ View reports
7. ✅ Export CSV
8. ✅ Test Telegram notifications
9. ✅ Try all admin features
10. ✅ Test mobile responsiveness

---

## 🚀 Ready for Production?

When you're ready to go live:

```bash
# Read deployment guide
cat DEPLOYMENT.md

# Then follow step by step!
```

---

**🎉 Happy Coding! Your RFS_STORE is now running!**

Need more details? Check:
- `README.md` - Complete documentation
- `DEPLOYMENT.md` - Production deployment
- `API_GUIDE.md` - API reference
- `PROJECT_SUMMARY.md` - What's included

