# Sri Muthukumaran Institute of Technology - College Staff ERP

Official production-ready College Staff ERP web application for **Sri Muthukumaran Institute of Technology (SMIT)**, Chennai.

Built with Next.js (App Router), TypeScript, Prisma ORM, Tailwind CSS, and secure cookie-based session authentication.

---

## 🌟 Key Application Features

### 1. Dynamic Roles & Permissions Matrix
- **No Public Registration**: Accounts are exclusively managed, created, activated/deactivated, and reset by Administrators.
- **Super Admin / Admin**: Full access to all modules, records, reports, settings, role permissions matrix, and audit trails.
- **Head of Department (HOD)**: Department-specific dashboard overview, staff list, course management, and reporting for assigned department.
- **Staff / Faculty**: Personal profile management, assigned department & subject views.
- **Dynamic Permission Engine**: Admin can toggle permissions per role dynamically via the Admin Settings UI.

### 2. Required ERP Modules
- **Secure Authentication**: Email / Employee ID login, `bcrypt` password hashing, sliding window rate limiting (5 attempts / 15 mins), HTTP-Only session cookies, forced password change on first login for new staff accounts.
- **Admin Dashboard**: Real-time stats (Active Staff, Departments, Courses, HODs), quick action bar, recent staff directory additions, and audit activity feed.
- **Staff Management**: Search, filter by department/role/status, paginated directory, staff addition modal, profile editor, status toggle (Active/Inactive/Suspended), password reset, and CSV/PDF export.
- **Academic Master Data**: Management of Departments, Degree Courses (B.E., B.Tech, M.E.), Duration, Semesters, Subjects, Subject Types (Theory/Practical/Elective), Designations, and soft-delete archive/restore capabilities.
- **Downloadable Reports Engine**: Staff Directory, Department-wise Staff Allocation, Course & Subject Master List, User Roles & Access Matrix, and Admin Audit Trail with CSV export and print-ready PDF preview.
- **Admin Audit Trail**: Immutable tracking of user CRUD, account status changes, password resets, academic structure updates, and settings changes.
- **Central Branding & Theme**: Customize college name, primary/secondary colors, contact email/phone, address, and academic year from `lib/theme-config.ts` or the Admin Settings UI.

---

## 🔑 Safe Demo Super Admin Credentials

The database comes pre-seeded with sample SMIT college data and accounts:

| Role | Email | Employee ID | Default Password | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@smit.edu.in` | `EMP-ADMIN-001` | `Admin@123456` | Prompts for mandatory password change on first login |
| **HOD (CSE Dept)** | `hod.cse@smit.edu.in` | `EMP-CSE-001` | `Staff@123456` | Access restricted to CSE department data |
| **HOD (ECE Dept)** | `hod.ece@smit.edu.in` | `EMP-ECE-001` | `Staff@123456` | Access restricted to ECE department data |
| **Faculty Staff** | `suresh.n@smit.edu.in` | `EMP-CSE-002` | `Staff@123456` | Assistant Professor, CSE |

---

## 🚀 Quick Setup & Local Running Guide

### Prerequisites
- **Node.js**: v18+ or v20+ or v24+
- **npm**: 9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default SQLite configuration (`DATABASE_URL="file:./dev.db"`) runs out of the box with zero external dependencies.

### 3. Initialize Database & Seed Demo Data
```bash
# Push schema to SQLite database
npx prisma db push

# Seed SMIT college departments, courses, subjects, designations, and users
npm run db:seed
```

### 4. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Verification Testing

To execute automated tests verifying authentication, password hashing, rate limiting, role permissions, and academic relational integrity:

```bash
npx tsx tests/run-tests.ts
```

---

## 🐳 Docker Container Deployment (College Server)

For future deployment on the college server using PostgreSQL:

1. Update `.env` to point to PostgreSQL:
```env
DATABASE_URL="postgresql://smit_admin:smit_password_2026@postgres:5432/smit_erp?schema=public"
```

2. Spin up containers using Docker Compose:
```bash
docker-compose up -d --build
```

3. Run migrations and seed data inside the app container:
```bash
docker-compose exec smit-erp-web npx prisma db push
docker-compose exec smit-erp-web npm run db:seed
```

---

## 🎨 Theme & Branding Customization

All college colors, names, logos, and contact information can be modified in two ways:
1. **Central Config File**: Edit `lib/theme-config.ts`
2. **Admin UI**: Navigate to `/settings` in the Admin dashboard to customize values live.

---

## 📁 Repository Structure
```
├── app/
│   ├── (auth)/login/       # SMIT Branded Login & First-login Password Change
│   ├── (dashboard)/        # Role-adapted dashboard shell & sidebar
│   │   ├── dashboard/      # Metrics, Quick Actions, Activity Feed
│   │   ├── staff/          # Staff Management Directory & CRUD
│   │   ├── academic/       # Departments, Courses, Subjects, Designations
│   │   ├── reports/        # Downloadable CSV & Print PDF Reports
│   │   ├── audit-logs/     # Security & Admin Audit Trail
│   │   ├── settings/       # Branding & Dynamic Role-Permission Matrix
│   │   └── profile/        # User Profile & Password Update
│   └── api/                # Production Next.js API Routes
├── components/             # Reusable UI component suite (Button, Input, Modal, etc.)
├── lib/                    # Auth, DB, Permissions, Audit, Export, Theme Config
├── prisma/                 # Schema & Seed Script
├── tests/                  # Automated verification test suite
├── Dockerfile
├── docker-compose.yml
└── README.md
```
