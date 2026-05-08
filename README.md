# Rupa Enterprises CRM

Custom CRM & Field Sales Automation Platform for Rupa Enterprises.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Vite |
| Backend | Node.js, Express.js |
| Database | MySQL 8+ |
| Auth | JWT (access + refresh tokens) |
| Charts | Recharts |
| File Upload | Multer |
| Excel Export | ExcelJS |
| Process Manager | PM2 |
| Web Server | Nginx |
| Server | Ubuntu VPS (Hostinger) |

---

## Project Structure

```
rupa-crm/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, JWT, Multer config
│   │   ├── controllers/     # Business logic
│   │   ├── database/        # schema.sql, migrate.js, seed.js
│   │   ├── jobs/            # Cron jobs (followup escalation)
│   │   ├── middleware/       # auth, error handler, rate limiter
│   │   ├── routes/          # Express routers
│   │   ├── uploads/         # File storage (gitignored)
│   │   ├── utils/           # response, pagination, audit, logger
│   │   └── server.js        # Entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI (Badge, Modal, Spinner, etc.)
│   │   ├── constants/       # Roles, stages, types
│   │   ├── context/         # AuthContext
│   │   ├── hooks/           # useApi, downloadBlob
│   │   ├── layouts/         # AppLayout, Sidebar, TopBar
│   │   ├── pages/           # All CRM pages
│   │   ├── routes/          # PrivateRoute
│   │   ├── services/        # Axios API client
│   │   └── App.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
└── docs/
    ├── nginx.conf           # Production Nginx config
    ├── ecosystem.config.js  # PM2 config
    ├── deploy.sh            # Full VPS setup script
    ├── update.sh            # Update deployed app
    ├── API.md               # REST API reference
    └── ADMIN_GUIDE.md       # Admin usage guide
```

---

## Local Development

### Prerequisites
- Node.js 18+
- MySQL 8+

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials

npm install
node src/database/migrate.js    # Create tables
node src/database/seed.js       # Create default admin
npm run dev                     # Start on port 5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                     # Start on port 3000
```

Open: http://localhost:3000  
Login: `admin@rupaenterprises.com` / `Admin@123`

---

## Deployment (Hostinger VPS)

```bash
# 1. Upload project to server
scp -r rupa-crm/ root@YOUR_VPS_IP:/var/www/

# 2. SSH to server
ssh root@YOUR_VPS_IP

# 3. Copy and configure environment
cd /var/www/rupa-crm/backend
cp .env.example .env
nano .env   # Set DB password, JWT secrets, domain

# 4. Run full setup
bash /var/www/rupa-crm/docs/deploy.sh

# 5. Run migrations
node src/database/migrate.js
node src/database/seed.js
```

Full instructions: [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md)

---

## User Roles

| Role | Access |
|------|--------|
| super_admin | Full access |
| admin | Users, clients, brands, reports |
| sales_manager | Team visits, approvals, pipeline |
| sales_executive | Own visits, clients, opportunities |
| backend_ops | Quotations, POs, billing imports |
| management | View-only dashboards & reports |

---

## Modules — MVP (Phase 1)

- [x] Authentication (JWT, roles, forgot/reset password)
- [x] User management with role assignment
- [x] Client master with GPS, brands, categories
- [x] Field visit tracking with GPS capture & file upload
- [x] Manager visit approval workflow
- [x] Follow-up creation, tracking, overdue detection
- [x] Auto follow-up from visit next-followup-date
- [x] Cron job: daily overdue marking + escalation
- [x] Opportunity pipeline with 8 stages & stage history
- [x] Brand-wise pipeline tracking
- [x] Role-based dashboards (salesperson, manager, management)
- [x] Reports: visits, opportunities, follow-ups, billing
- [x] Excel/CSV export for all major modules
- [x] Audit trail for all critical actions
- [x] In-app notification system

## Phase 2 (Ready to activate)

- [x] Manual quotation tracking
- [x] Purchase order tracking
- [x] Tally billing import (Excel upload, client mapping)
- [x] Overdue payment report
- [x] Client-wise MOM billing comparison

## Phase 3 (Future)

- [ ] Zoho Books OAuth integration
- [ ] WhatsApp notifications
- [ ] SMS reminders
- [ ] Native mobile app

---

## API Documentation

See [docs/API.md](docs/API.md)
