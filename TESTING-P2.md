# Panduan Testing Backend P2 — Internet Billing System

Pegangan uji API di Postman. Base URL default: `http://localhost:3000`

Simpan ID dan token yang muncul di response ke variabel Postman:

- `admin_token`
- `customer_token`
- `customer2_token` (untuk tes kepemilikan data)
- `provider_id`
- `inactive_provider_id`
- `subscription_id`
- `billing_id`
- `payment_id`

Header JSON biasa:

```
Content-Type: application/json
Authorization: Bearer {{token}}
```

---

## 0. Siapkan server

```bash
cd my-api/my-api
npm install
# buat .env (DATABASE_URL, DIRECT_URL, JWT_SECRET)
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

Cek hidup:

- `GET /` → `Internet Billing System`

Akun seed:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@isp.test` | `Admin123!` |
| CUSTOMER | `customer@isp.test` | `Customer123!` |

---

## 1. Authentication

### 1.1 Register customer (publik)

`POST /auth/register`

```json
{
  "email": "andi@mail.test",
  "name": "Andi",
  "password": "secret123"
}
```

Harus lulus:

- Status 201/200
- `role` = `CUSTOMER` (meski request mencoba kirim `role: "ADMIN"`, role admin tidak boleh terbentuk)
- Ada `access_token`
- Password di database ter-hash (bukan plaintext)

Tes gagal:

- Email tidak valid → 400
- Email sudah terdaftar → 409
- Password < 6 karakter → 400

### 1.2 Login

`POST /auth/login`

```json
{
  "email": "admin@isp.test",
  "password": "Admin123!"
}
```

Simpan token admin.

Ulangi untuk `customer@isp.test` dan user hasil register. Simpan masing-masing token.

Tes gagal:

- Password salah → 401
- Tanpa token ke `GET /users/me` → 401
- Token rusak → 401

### 1.3 Profil

`GET /users/me` + Bearer token

Harus mengembalikan data user login (tanpa password).

---

## 2. Service Provider (paket internet)

### 2.1 Admin buat paket aktif

`POST /service-providers` (token admin)

```json
{
  "name": "Home 50 Mbps",
  "description": "Paket rumah 50 Mbps unlimited",
  "speed": 50,
  "price_per_month": 250000,
  "is_active": true
}
```

Simpan `provider_id`.

### 2.2 Admin buat paket nonaktif

```json
{
  "name": "Business 200 Mbps",
  "description": "Paket bisnis nonaktif",
  "speed": 200,
  "price_per_month": 750000,
  "is_active": false
}
```

Simpan `inactive_provider_id`.

### 2.3 List & detail

- `GET /service-providers` token **admin** → semua paket (aktif + nonaktif)
- `GET /service-providers` token **customer** → hanya `is_active: true`
- `GET /service-providers/:id` → detail
- Customer buka `inactive_provider_id` → 403

### 2.4 Update & hapus (admin)

`PATCH /service-providers/:id`

```json
{
  "price_per_month": 275000
}
```

`DELETE /service-providers/:id`

- Paket yang **belum** punya subscription boleh dihapus
- Paket yang **sudah** punya subscription → 409
- Customer mencoba POST/PATCH/DELETE → 403

Validasi gagal:

- `speed` 0 atau negatif → 400
- field wajib kosong → 400
- UUID palsu di URL → 400

---

## 3. Subscription (daftar layanan)

### 3.1 Customer daftar paket aktif

`POST /subscriptions` (token customer)

```json
{
  "service_provider_id": "{{provider_id}}"
}
```

Simpan `subscription_id`. Status harus `ACTIVE`.

### 3.2 Aturan bisnis

- Daftar paket **nonaktif** → 400
- Daftar paket **yang sama** lagi selama masih `ACTIVE` → 409
- Admin mencoba POST `/subscriptions` → 403

### 3.3 Lihat subscription

- `GET /subscriptions` customer → hanya miliknya
- `GET /subscriptions/:id` customer lain (token customer2) → 403
- `GET /subscriptions` admin → semua subscription

### 3.4 Admin lihat customer + layanannya

`GET /users` (token admin)

Harus berisi daftar CUSTOMER beserta array `subscriptions` dan `service_provider`.

Customer memanggil `GET /users` → 403

---

## 4. Billing

### 4.1 Admin buat tagihan

`POST /billings` (token admin)

```json
{
  "subscription_id": "{{subscription_id}}",
  "period_month": 11,
  "period_year": 2026,
  "due_date": "2026-12-10"
}
```

`amount` boleh dikosongkan; sistem mengisi dari `price_per_month` paket.

Atau set manual:

```json
{
  "subscription_id": "{{subscription_id}}",
  "period_month": 11,
  "period_year": 2026,
  "amount": 250000,
  "due_date": "2026-12-10"
}
```

Status awal: `UNPAID`. Simpan `billing_id`.

### 4.2 Unique periode

Buat tagihan **bulan dan tahun yang sama** untuk subscription yang sama → 409

### 4.3 List & detail

- `GET /billings` admin → semua
- `GET /billings` customer → hanya tagihan subscription miliknya
- `GET /billings/:id` customer lain → 403

### 4.4 Update & hapus (admin)

`PATCH /billings/:id`

```json
{
  "due_date": "2026-12-20",
  "amount": 260000
}
```

`DELETE /billings/:id`

- Boleh jika belum ada payment
- Sudah ada payment → 409
- Customer PATCH/DELETE → 403
- Tagihan `PAID` tidak boleh diubah → 409

Validasi:

- `period_month` di luar 1–12 → 400
- `period_year` tidak valid → 400
- UUID salah → 400

---

## 5. Payment & upload bukti

### 5.1 Customer unggah bukti

`POST /payments` (token **customer** pemilik tagihan)

Body type: **form-data** (bukan JSON)

| Key | Type | Value |
|---|---|---|
| `billing_id` | Text | `{{billing_id}}` |
| `payment_proof` | File | gambar jpeg/png/webp atau pdf, max 2MB |

Setelah sukses:

- `payment.status` = `PENDING`
- billing terkait = `WAITING_VERIFICATION`
- path file tersimpan di `payment_proof`
- file ada di folder `uploads/payment-proofs/`
- nama file unik (bukan nama asli)

Simpan `payment_id`.

### 5.2 Tes gagal upload

- Bukan pemilik tagihan → 403
- Tagihan sudah `WAITING_VERIFICATION` / `PAID` → 409
- Tanpa file → 400
- Tipe file `.exe` / selain jpeg png webp pdf → 400
- File > 2MB → 400
- Admin POST `/payments` → 403

### 5.3 Lihat pembayaran

- `GET /payments` customer → hanya miliknya
- `GET /payments?status=PENDING` admin → antrian verifikasi (rubrik P2)
- `GET /payments/:id` → detail + path bukti
- Customer lain akses id payment ini → 403

Buka file di browser (jika server sudah serve static):

`http://localhost:3000/{{payment_proof}}`

contoh: `http://localhost:3000/uploads/payment-proofs/<uuid>.jpg`

---

## 6. Verifikasi admin

### 6.1 Tolak dulu (tes alur ulang)

`PATCH /payments/:id/verify` (token admin)

```json
{
  "action": "REJECT"
}
```

Harus:

- `payment.status` = `REJECTED`
- `verified_by` terisi id admin
- `verified_at` terisi
- billing kembali `UNPAID`

Customer unggah **lagi** ke `billing_id` yang sama:

- record payment **tetap satu** (bukan row baru)
- `status` kembali `PENDING`
- `verified_by` dan `verified_at` dikosongkan
- billing `WAITING_VERIFICATION`

### 6.2 Setujui

```json
{
  "action": "APPROVE"
}
```

Harus:

- `payment.status` = `APPROVED`
- billing `PAID`
- customer unggah lagi ke tagihan ini → 409

Customer tidak boleh memanggil verify → 403

Verifikasi payment yang sudah `APPROVED`/`REJECTED` → 409

---

## 7. Checklist cepat sesuai rubrik P2

Gunakan ini saat uji di depan penguji.

| Aspek | Yang dicek | OK? |
|---|---|---|
| Init | `npm run start:dev` jalan, `.env` dipakai | |
| DB | 5 tabel + FK + unique sesuai schema | |
| Auth | register customer, login JWT, password hash | |
| Role | customer tidak bisa CRUD provider / billing / verify | |
| Validasi | body/params/query salah → 400 | |
| Provider | CRUD admin; customer hanya lihat aktif | |
| Subscription | daftar layanan aktif; blokir duplikat aktif | |
| Billing | CRUD admin; unique periode; customer hanya lihat milik sendiri | |
| Upload | file tersimpan, path di DB, validasi tipe/ukuran | |
| Verify | PENDING list, APPROVE→PAID, REJECT→UNPAID, upload ulang | |

---

## 8. Urutan request siap demo (ringkas)

1. Login admin + login customer  
2. Admin buat 1 paket aktif  
3. Customer `POST /subscriptions`  
4. Admin `GET /users` (customer + layanan terlihat)  
5. Admin `POST /billings`  
6. Customer `POST /payments` (form-data)  
7. Admin `GET /payments?status=PENDING`  
8. Admin `REJECT` → customer upload ulang → admin `APPROVE`  
9. Customer coba bayar lagi → gagal  
10. Customer coba akses billing/payment orang lain → 403  

Selesai: alur P2 dari registrasi sampai verifikasi pembayaran sudah tertutup.
