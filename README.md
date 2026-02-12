# 🏠 RentEase - Property Management System

A full-stack rental property management system built with React + Flask.

---

## 🚀 Quick Start

### Step 1 — Backend Setup
```bash
cd backend
pip install -r requirements.txt
python init_db.py
python app.py
```
Backend runs on: http://localhost:5000

### Step 2 — Frontend Setup (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:3000

### Step 3 — Login
- **Admin:** username: `admin` / password: `admin123`
- **Tenant:** credentials created by admin

---

## ✅ Features

### Admin Panel
| Feature | Description |
|---------|-------------|
| 📊 Dashboard | Stats: buildings, rooms, tenants, revenue, complaints |
| 🏢 Buildings | Add/edit/delete buildings |
| 🚪 Rooms | Add rooms per building, view by building filter |
| 👥 Tenants | Add/edit/delete tenants, upload photo & documents |
| 💳 Bills | Create bills, generate monthly rent, view screenshots |
| 🖨 Receipts | Printable payment receipts |
| 📋 Complaints | Reply to complaints, close resolved issues |
| 📢 Announcements | Post/edit/delete announcements with priority |
| 🚨 Emergency | Manage emergency contact numbers |
| ⚙️ Payment Settings | Set UPI ID and upload QR code |

### Tenant Portal
| Feature | Description |
|---------|-------------|
| 👤 My Profile | View tenancy details, deposit amount, documents |
| 💳 My Bills | View pending/paid bills |
| 💸 Pay Bills | View UPI details, upload screenshot, mark paid |
| 🖨 Receipts | Download/print payment receipts |
| 📋 Complaints | Submit and track complaints |
| 📢 Announcements | View management updates |
| 🚨 Emergency | Quick access to emergency numbers |

---

## 🗂 Project Structure

```
rental-portal/
├── backend/
│   ├── app.py              # Flask app + all API routes
│   ├── init_db.py          # Database initialization
│   ├── requirements.txt    # Python dependencies
│   └── uploads/            # File uploads (auto-created)
│       ├── tenant_docs/
│       ├── tenant_photos/
│       ├── room_photos/
│       └── payment_screenshots/
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── App.css
        ├── api.js
        ├── main.jsx
        ├── hooks/useToast.js
        └── components/
            ├── Login.jsx
            ├── Toast.jsx
            ├── admin/
            │   ├── AdminDashboard.jsx
            │   ├── Overview.jsx
            │   ├── Buildings.jsx
            │   ├── Rooms.jsx
            │   ├── Tenants.jsx
            │   ├── Bills.jsx
            │   ├── Complaints.jsx
            │   ├── Announcements.jsx
            │   ├── Emergency.jsx
            │   └── PaymentConfig.jsx
            └── tenant/
                ├── TenantDashboard.jsx
                ├── TenantProfile.jsx
                ├── TenantBills.jsx
                ├── TenantComplaints.jsx
                ├── TenantAnnouncements.jsx
                └── TenantEmergency.jsx
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/buildings | List buildings |
| POST | /api/buildings | Create building |
| GET | /api/rooms | List rooms |
| GET | /api/rooms?building_id=X | Rooms by building |
| POST | /api/rooms | Create room |
| GET | /api/tenants | List tenants |
| POST | /api/tenants | Create tenant |
| DELETE | /api/tenants/:id | Delete tenant |
| POST | /api/tenants/:id/photo | Upload photo |
| POST | /api/tenants/:id/documents | Upload documents |
| GET | /api/tenant/my-profile | Tenant profile |
| GET | /api/bills | List bills |
| POST | /api/bills | Create bill |
| POST | /api/bills/generate-rent | Auto-generate rent |
| POST | /api/bills/:id/upload-screenshot | Upload payment proof |
| PUT | /api/bills/:id/mark-paid | Mark bill paid |
| GET | /api/bills/:id/receipt | Get receipt data |
| GET | /api/payment-settings | Get UPI settings |
| POST | /api/payment-settings | Update UPI ID |
| POST | /api/payment-settings/qr-code | Upload QR code |
| GET | /api/complaints | List complaints |
| POST | /api/complaints | Submit complaint |
| PUT | /api/complaints/:id/reply | Admin reply |
| PUT | /api/complaints/:id/close | Close complaint |
| GET | /api/announcements | List announcements |
| POST | /api/announcements | Create announcement |
| PUT | /api/announcements/:id | Edit announcement |
| DELETE | /api/announcements/:id | Delete announcement |
| GET | /api/emergency-contacts | List contacts |
| POST | /api/emergency-contacts | Add contact |
| GET | /api/dashboard/stats | Dashboard stats |

---

## 🛠 Tech Stack
- **Frontend:** React 18, React Router, Axios, Vite
- **Backend:** Flask, SQLAlchemy, JWT, Werkzeug
- **Database:** SQLite (auto-created)
- **Auth:** JWT Bearer tokens

---

## 💡 Tips
- First time setup: run `python init_db.py` to create DB and admin user
- To reset: delete `backend/rental_management.db` and run `python init_db.py` again
- Upload files are stored in `backend/uploads/`
- Default admin password can be changed in `init_db.py`
