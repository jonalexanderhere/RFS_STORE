# 🚀 DEPLOY TO VERCEL - STEP BY STEP

## ⚠️ MASALAH SAAT INI

Website https://rfs-store.vercel.app/ menampilkan error:
```
Missing Supabase environment variables
```

## ✅ SOLUSI - IKUTI 2 LANGKAH INI

---

## 🔧 LANGKAH 1: SET ENVIRONMENT VARIABLES DI VERCEL

### 1.1 Buka Vercel Settings
**Klik link ini:** https://vercel.com/jonalexanderhere/rfs-store/settings/environment-variables

### 1.2 Tambah Variable Pertama

Click tombol **"Add New"**

**Name:**
```
VITE_SUPABASE_URL
```

**Value:**
```
https://lzuqfckzboeqwtlqjfgm.supabase.co
```

**Environments:** (Centang SEMUA)
- ✅ Production
- ✅ Preview
- ✅ Development

Click **"Save"**

---

### 1.3 Tambah Variable Kedua

Click tombol **"Add New"** lagi

**Name:**
```
VITE_SUPABASE_ANON_KEY
```

**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dXFmY2t6Ym9lcXd0bHFqZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTQ0OTYsImV4cCI6MjA3Njc5MDQ5Nn0.Zjy_gk4c2dgXNW_EUOY-J4Vk3-VCxaL8W8D70WgQmjk
```

**Environments:** (Centang SEMUA)
- ✅ Production
- ✅ Preview
- ✅ Development

Click **"Save"**

---

### 1.4 Redeploy

Setelah menambah environment variables:

1. Buka: https://vercel.com/jonalexanderhere/rfs-store
2. Click deployment teratas
3. Click tombol **"..."** (three dots)
4. Click **"Redeploy"**
5. Confirm **"Redeploy"**
6. **Tunggu 2-3 menit** sampai status "Ready"

---

## 🗄️ LANGKAH 2: SETUP DATABASE

### 2.1 Buka Supabase SQL Editor
**Klik link ini:** https://supabase.com/dashboard/project/lzuqfckzboeqwtlqjfgm/sql

### 2.2 Run Schema

1. Click **"New Query"**
2. Copy **SEMUA** isi file `supabase-schema-fixed.sql`
3. Paste ke SQL Editor
4. Click **"Run"** (atau Ctrl + Enter)
5. Tunggu ~10 detik
6. Lihat success message

### 2.3 Verify Tables

Go to Table Editor: https://supabase.com/dashboard/project/lzuqfckzboeqwtlqjfgm/editor

Harus ada 7 tables:
- ✅ profiles
- ✅ services
- ✅ orders
- ✅ invoices
- ✅ payment_proofs
- ✅ notifications
- ✅ audit_logs

---

## 🧪 TEST WEBSITE

Setelah deployment "Ready":

1. **Buka:** https://rfs-store.vercel.app/
2. **Hard Refresh:** `Ctrl + Shift + R`
3. **Check Console:** Press `F12` → Console tab
4. **Harus tidak ada error!**

### Expected Results:
- ✅ Homepage muncul
- ✅ Logo "RFS STORE" terlihat
- ✅ Navigation menu ada
- ✅ No error di console
- ✅ Services tampil

---

## 📋 CHECKLIST

### Environment Variables (Vercel)
- [ ] VITE_SUPABASE_URL added
- [ ] VITE_SUPABASE_ANON_KEY added
- [ ] All 3 environments selected
- [ ] Saved both variables
- [ ] Redeployed project
- [ ] Deployment status "Ready"

### Database (Supabase)
- [ ] SQL Editor opened
- [ ] supabase-schema-fixed.sql executed
- [ ] 7 tables created
- [ ] Sample services inserted

### Testing
- [ ] Website loads
- [ ] No console errors
- [ ] Can register
- [ ] Can login
- [ ] Dashboard accessible

---

## ❌ TROUBLESHOOTING

### Error: Still showing blank page
**Solution:** 
- Clear browser cache (`Ctrl + Shift + Delete`)
- Hard refresh (`Ctrl + Shift + R`)
- Try incognito mode (`Ctrl + Shift + N`)

### Error: Missing Supabase environment variables
**Solution:**
- Verify both variables added in Vercel
- Check all 3 environments selected
- Redeploy after adding variables

### Error: Database error / 401
**Solution:**
- Run supabase-schema-fixed.sql
- Check tables exist in Table Editor
- Verify RLS policies active

---

## 🎯 SUMMARY

**Problem:** Website blank + Missing environment variables

**Solution:**
1. ✅ Add 2 environment variables in Vercel
2. ✅ Run database schema in Supabase
3. ✅ Redeploy

**Time:** ~5 minutes
**Difficulty:** Easy

**After fix:**
- ✅ Website live at https://rfs-store.vercel.app/
- ✅ Fully functional
- ✅ Ready for production

---

## 🔗 Quick Links

- **Vercel Env Vars:** https://vercel.com/jonalexanderhere/rfs-store/settings/environment-variables
- **Vercel Deploy:** https://vercel.com/jonalexanderhere/rfs-store
- **Supabase SQL:** https://supabase.com/dashboard/project/lzuqfckzboeqwtlqjfgm/sql
- **Your Website:** https://rfs-store.vercel.app/

---

**🎉 Setelah follow langkah-langkah di atas, website Anda akan langsung live!**

