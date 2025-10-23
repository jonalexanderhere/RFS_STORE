# 📱 FONNTE SETUP GUIDE - LENGKAP

## 🎯 TUJUAN:
Mendapatkan **Account Token** yang valid dari Fonnte untuk WhatsApp notifications.

---

## 📋 INFORMASI TOKEN ANDA:

### **Device Token** ✅ WORKING
```
Token: zCvpmi9fjxwhyKxTqt22
Status: ACTIVE
Device: 6282297218743
Quota: 999/1000 messages remaining
Type: Personal device token
```

### **Account Token** ⚠️ INVALID
```
Token: hakuNNT3TBPHvGqtcF2QYLXnFaUYQt66Qsg91ndi6
Status: INVALID - "invalid token"
Reason: Token expired or device disconnected
Action Required: Get new token
```

---

## 🔧 CARA MENDAPATKAN TOKEN BARU:

### **Step 1: Login ke Fonnte**

**URL:** https://md.fonnte.com/

**Login Form:**
```
Your Account: [your_email_or_phone]
Your Password: [your_password]
Country: Indonesia (+62)
```

**Important:**
- Gunakan email/phone yang sama dengan saat daftar
- Pastikan password benar
- Pilih Indonesia (+62) jika menggunakan nomor lokal

---

### **Step 2: Check Dashboard**

Setelah login, Anda akan masuk ke Dashboard:

```
┌──────────────────────────────────────────┐
│           FONNTE DASHBOARD               │
├──────────────────────────────────────────┤
│                                          │
│  📱 Devices                              │
│  ┌────────────────────────────────────┐ │
│  │  Device 1: 6282297218743           │ │
│  │  Status: ⚠️ Disconnected / ✅ Connected │
│  │  [Reconnect] [Settings]            │ │
│  └────────────────────────────────────┘ │
│                                          │
│  📊 Usage                                │
│  Messages Today: 1                       │
│  Quota Remaining: 999                    │
│                                          │
│  🔑 API Token                            │
│  [Show Token] [Copy]                     │
│                                          │
└──────────────────────────────────────────┘
```

---

### **Step 3: Check Device Connection**

**PENTING:** Device harus **CONNECTED** untuk token bekerja!

#### **Jika Device DISCONNECTED:**

1. **Click "Reconnect"**
2. **Scan QR Code:**
   ```
   1. Buka WhatsApp di HP Anda
   2. Tap Menu (⋮) → Linked Devices
   3. Tap "Link a Device"
   4. Scan QR code yang muncul di Fonnte
   ```

3. **Tunggu hingga status berubah:**
   ```
   ⚠️ Disconnected → ✅ Connected
   ```

#### **Jika Device ALREADY CONNECTED:**
- ✅ Skip ke Step 4

---

### **Step 4: Get Token**

Ada 2 jenis token:

#### **Option A: Device Token** (Recommended)
**Untuk device spesifik (lebih stabil)**

1. Click **"Devices"** di sidebar
2. Pilih device yang active (6282297218743)
3. Click **"Settings"** atau **"Token"**
4. Copy **Device Token**
5. Contoh format:
   ```
   zCvpmi9fjxwhyKxTqt22
   ```

#### **Option B: Account Token**
**Untuk semua device (lebih fleksibel)**

1. Click **"Profile"** atau **"Settings"** di sidebar
2. Scroll ke **"API Configuration"**
3. Click **"Show Token"** atau **"Generate Token"**
4. Copy **Account Token**
5. Contoh format:
   ```
   hakuNNT3TBPHvGqtcF2QYLXnFaUYQt66Qsg91ndi6
   ```

---

### **Step 5: Test Token**

**Sebelum update .env, test dulu!**

```javascript
// Save as test-token.js
const TOKEN = 'YOUR_NEW_TOKEN_HERE';

fetch('https://api.fonnte.com/send', {
  method: 'POST',
  headers: {
    'Authorization': TOKEN,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    target: '6281234567890', // Your test number
    message: 'Test dari RFS_STORE',
    countryCode: '62'
  })
})
.then(res => res.json())
.then(data => {
  if (data.status) {
    console.log('✅ TOKEN VALID!');
    console.log('Quota:', data.quota);
  } else {
    console.log('❌ TOKEN INVALID:', data.reason);
  }
});
```

**Run:**
```bash
node test-token.js
```

**Expected Output:**
```
✅ TOKEN VALID!
Quota: { '6282297218743': { remaining: 999 } }
```

---

### **Step 6: Update Environment Variables**

#### **Local (.env):**
```bash
# Open .env
notepad .env

# Update or add:
VITE_FONNTE_DEVICE_TOKEN=zCvpmi9fjxwhyKxTqt22
VITE_FONNTE_TOKEN=YOUR_NEW_ACCOUNT_TOKEN_HERE

# Save and close
```

#### **Vercel (Production):**
```bash
# Remove old token
vercel env rm VITE_FONNTE_TOKEN production

# Add new token
echo "YOUR_NEW_ACCOUNT_TOKEN_HERE" | vercel env add VITE_FONNTE_TOKEN production

# Redeploy
vercel --prod
```

---

## 🔍 TROUBLESHOOTING:

### **Problem 1: "invalid token"**
**Cause:** Token expired, revoked, or device disconnected

**Solution:**
1. Check device connection in Fonnte dashboard
2. Reconnect device if disconnected
3. Generate new token
4. Update .env & Vercel
5. Test again

---

### **Problem 2: "device not found"**
**Cause:** WhatsApp device not linked to Fonnte

**Solution:**
1. Login to https://md.fonnte.com/
2. Go to Devices → Add Device
3. Scan QR code with WhatsApp
4. Wait for connection
5. Get new device token

---

### **Problem 3: "quota exceeded"**
**Cause:** Daily message limit reached

**Solution:**
1. Check quota in Fonnte dashboard
2. Upgrade plan if needed
3. Or wait for daily reset (00:00 UTC+7)

---

### **Problem 4: Token works in test, fails in production**
**Cause:** Environment variable not updated in Vercel

**Solution:**
```bash
# Check current env vars
vercel env ls

# Pull latest
vercel env pull

# Re-add token
vercel env add VITE_FONNTE_TOKEN production

# Force redeploy
vercel --force --prod
```

---

## 📊 TOKEN COMPARISON:

| Feature | Device Token | Account Token |
|---------|-------------|---------------|
| **Scope** | Single device | All devices |
| **Stability** | More stable | May expire faster |
| **Recommended** | ✅ For production | Backup/testing |
| **Format** | Short (20 chars) | Long (40+ chars) |
| **Current Status** | ✅ WORKING | ⚠️ INVALID |

---

## ✅ CHECKLIST:

Setelah mendapatkan token baru:

- [ ] Login ke https://md.fonnte.com/
- [ ] Check device connected (✅ status hijau)
- [ ] Copy new Account Token
- [ ] Test token dengan test-token.js
- [ ] Update local .env file
- [ ] Update Vercel environment variable
- [ ] Redeploy to production
- [ ] Test complete notification flow
- [ ] Verify customer receives WhatsApp
- [ ] Verify admin receives Telegram

---

## 🎯 RECOMMENDED SETUP:

**Production:**
```bash
# Primary: Device Token (stable, device-specific)
VITE_FONNTE_DEVICE_TOKEN=zCvpmi9fjxwhyKxTqt22

# Fallback: Account Token (flexible, all devices)
VITE_FONNTE_TOKEN=YOUR_NEW_ACCOUNT_TOKEN
```

**Behavior:**
```
1. Try Device Token first
2. If fails → auto-retry with Account Token
3. If both fail → log error & continue (non-blocking)
```

**Benefits:**
- ✅ High reliability (2-layer fallback)
- ✅ No service interruption
- ✅ Auto-recovery from token issues

---

## 📞 SUPPORT:

**Fonnte:**
- Website: https://fonnte.com/
- Login: https://md.fonnte.com/
- Support: (check their contact page)

**RFS_STORE:**
- GitHub: https://github.com/jonalexanderhere/RFS_STORE
- Vercel: https://rfs-store.vercel.app

---

## 🎉 DONE!

Setelah setup lengkap, sistem notifikasi akan:

✅ **Customer dengan Telegram ID:**
  - Telegram: ✅ (instant)
  - WhatsApp: ✅ (via Fonnte)

✅ **Customer tanpa Telegram ID:**
  - WhatsApp: ✅ (via Fonnte)

✅ **Admin:**
  - Telegram: ✅ (multi-admin support)

---

*Last Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*
*Status: Device Token ✅ | Account Token ⚠️*

