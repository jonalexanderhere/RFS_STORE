# Migration Guide - RFS Database Schema Fix

## 🔍 Problem yang Diperbaiki

**Error**: `Could not find the 'completed_at' column of 'orders' in the schema cache`

## ✅ Perbaikan yang Dilakukan

### 1. **Kolom Baru di Tabel Orders**
- ✨ `completed_at` - Timestamp otomatis ketika order selesai
- ✨ `cancelled_at` - Timestamp otomatis ketika order dibatalkan

### 2. **Fungsi Otomatis Baru**
```sql
handle_order_status_change()
```
Fungsi ini otomatis mengatur:
- `completed_at` saat status berubah ke 'completed'
- `cancelled_at` saat status berubah ke 'cancelled'
- Reset timestamps jika status berubah kembali

### 3. **Trigger Baru**
```sql
handle_order_status_on_update
```
Trigger yang menjalankan fungsi `handle_order_status_change()` setiap kali order di-update

### 4. **Index Performance**
- Index untuk `completed_at` (DESC)
- Index untuk `cancelled_at` (DESC)

### 5. **Migration Script**
Script otomatis yang:
- Menambah kolom `completed_at` dan `cancelled_at` jika belum ada
- Mengisi `completed_at` untuk orders yang sudah 'completed'
- Mengisi `cancelled_at` untuk orders yang sudah 'cancelled'

## 📋 Cara Menggunakan

### Untuk Database Baru:
1. Buka **Supabase Dashboard** → SQL Editor
2. Copy semua isi dari `supabase-schema-fixed.sql`
3. Paste dan jalankan script
4. ✅ Selesai!

### Untuk Database yang Sudah Ada:
Script ini sudah termasuk migration yang aman:
- ✅ Tidak akan error jika kolom sudah ada
- ✅ Otomatis mengisi data untuk orders yang sudah ada
- ✅ Tidak akan menghapus data yang ada

1. Buka **Supabase Dashboard** → SQL Editor
2. Copy semua isi dari `supabase-schema-fixed.sql`
3. Paste dan jalankan script
4. Periksa output untuk konfirmasi:
   - "Added completed_at column to orders table"
   - "Added cancelled_at column to orders table"

## 🧪 Cara Testing

### Test 1: Buat Order Baru
```sql
-- Buat order baru
INSERT INTO orders (order_number, user_id, service_id, description, status)
VALUES ('TEST-001', 'user-id-here', 'service-id-here', 'Test order', 'pending');
```

### Test 2: Update Status ke Completed
```sql
-- Update status ke completed
UPDATE orders 
SET status = 'completed' 
WHERE order_number = 'TEST-001';

-- Cek completed_at (seharusnya terisi otomatis)
SELECT order_number, status, completed_at, cancelled_at 
FROM orders 
WHERE order_number = 'TEST-001';
```

### Test 3: Update Status ke Cancelled
```sql
-- Update status ke cancelled
UPDATE orders 
SET status = 'cancelled' 
WHERE order_number = 'TEST-001';

-- Cek cancelled_at (seharusnya terisi otomatis, completed_at jadi NULL)
SELECT order_number, status, completed_at, cancelled_at 
FROM orders 
WHERE order_number = 'TEST-001';
```

## 📊 Struktur Tabel Orders (Updated)

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID | Primary key |
| order_number | TEXT | Nomor order (unique) |
| user_id | UUID | Foreign key ke profiles |
| service_id | UUID | Foreign key ke services |
| description | TEXT | Deskripsi order |
| details | JSONB | Detail tambahan |
| status | order_status | Status: pending/processing/completed/cancelled |
| admin_notes | TEXT | Catatan admin |
| **completed_at** | **TIMESTAMP** | **✨ Otomatis terisi saat status = completed** |
| **cancelled_at** | **TIMESTAMP** | **✨ Otomatis terisi saat status = cancelled** |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu terakhir diupdate |

## 🎯 Manfaat Perbaikan

1. ✅ **Error 'completed_at' sudah hilang**
2. ✅ **Tracking otomatis** kapan order selesai atau dibatalkan
3. ✅ **Performance lebih baik** dengan index baru
4. ✅ **Data history lengkap** untuk reporting dan analytics
5. ✅ **Migration aman** untuk database yang sudah berjalan

## 🔒 Security & RLS

Semua RLS policies tetap sama, tidak ada perubahan pada security.

## 📞 Troubleshooting

### Error: "column completed_at already exists"
- ✅ Normal! Script sudah handle ini
- Migration akan skip jika kolom sudah ada

### Error: "trigger already exists"
- ✅ Normal! Script akan DROP dan CREATE ulang

### Data lama tidak punya completed_at
- ✅ Script otomatis mengisi dari `updated_at` untuk orders yang sudah completed

## 🚀 Next Steps

Setelah migration berhasil:
1. Test aplikasi Anda
2. Cek bahwa error `completed_at` sudah hilang
3. Monitoring untuk memastikan timestamps terisi otomatis
4. Update aplikasi frontend/backend jika perlu menggunakan `completed_at`

---

**Created**: 2025-10-30  
**Version**: 1.1  
**Status**: Ready for Production ✅

