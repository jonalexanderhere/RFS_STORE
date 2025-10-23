# 👥 ADMIN USER CREDENTIALS

## Admin 1

**Login:**
- Email: `admin1@rfsstore.com`
- Password: `Admin@123`

**Contact:**
- Phone: `082181183590`
- WhatsApp: `6282181183590`
- Telegram Chat ID: `5788748857`

**Role:** `admin`

**Created:** Via SQL (permanent)

---

## Admin 2

**Login:**
- Email: `admin2@rfsstore.com`
- Password: `Admin@123`

**Contact:**
- Phone: `082176466707`
- WhatsApp: `6282176466707`
- Telegram Chat ID: `6478150893`

**Role:** `admin`

**Created:** Via SQL (permanent)

---

## Login URL

**Production:** https://rfs-store.vercel.app/login

**Local:** http://localhost:3000/login (if running locally)

---

## Admin Panel Access

After login, admins can access:
- `/admin` - Dashboard
- `/admin/orders` - Manage Orders
- `/admin/invoices` - Manage Invoices
- `/admin/payments` - Verify Payments
- `/admin/reports` - View Reports

---

## Notifications

**Both admins receive notifications for:**
- 🆕 New orders (Telegram + WhatsApp)
- 💰 Payment proofs (Telegram + WhatsApp)
- 📊 System events

**Admin 1 receives at:**
- Telegram: 5788748857
- WhatsApp: 6282181183590

**Admin 2 receives at:**
- Telegram: 6478150893
- WhatsApp: 6282176466707

---

## Security Notes

⚠️ **Change passwords after first login!**

To change password:
1. Login as admin
2. Go to Profile Settings
3. Click "Change Password"
4. Enter new password

Or via SQL:
```sql
UPDATE auth.users 
SET encrypted_password = crypt('NewPassword123', gen_salt('bf'))
WHERE email = 'admin1@rfsstore.com';
```

---

## Database Info

These admin users are created in `COMPLETE_DATABASE_PRODUCTION.sql`:
- Stored in `auth.users` table (Supabase Auth)
- Profile in `public.profiles` table
- Role: `admin` (checked by `isAdmin` in AuthContext)
- **Permanent:** Won't be deleted when SQL is re-run

---

*Last Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

