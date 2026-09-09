# Jains Prakriti — Apartment Operations Management System

![Status](https://img.shields.io/badge/Status-Active_Development-brightgreen?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-React_19_%7C_Vite-blue?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/Backend-Django_REST-092E20?style=for-the-badge&logo=django)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)

Welcome to the **Jains Prakriti Apartment Operations Management System**. This is a highly scalable, full-stack digital platform designed to manage the day-to-day operations of a modern residential apartment complex (scale: ~150-175 flats). 

This platform serves multiple stakeholders — residents, management staff, security, maintenance workers, accountants, and vendors — through secure, role-specific interfaces.

---

## 🎯 Project Goals

- **Digitize Operations:** Eliminate manual communication and paperwork within the apartment ecosystem.
- **Resident Empowerment:** Provide transparent, self-service access for residents to view financials, service requests, and community information.
- **Operational Control:** Equip management with real-time visibility across all apartment functions (utilities, maintenance, staff, and vendors).
- **Scalable Architecture:** Build a robust, domain-driven backend paired with a rapid, state-based frontend capable of growing with the community.

---

## 🏗️ Technical Architecture

### Frontend Workspace
- **Framework:** React 19 + TypeScript (Vite)
- **Styling:** Tailwind CSS v3.4 + `lucide-react` icons
- **Architecture:** Unified Single Page Application (SPA). A master `/dashboard` layout dynamically controls access and rendering based on the user's explicit permission IDs from the backend.
- **Features:** Auto-refreshing JWT interceptors, robust DataTables, Real-time WebSockets, and complex drag-and-drop Media Uploads.

### Backend Workspace
- **Framework:** Django + Django REST Framework
- **Architecture:** Domain-Driven Design. A single master app (`apt_proj`) split into strict feature domains (e.g., `Apt_Accounts`, `Apt_Issues`, `Apt_Notices`).
- **Database:** PostgreSQL (`apartment_db`)
- **Real-Time Engine:** Django Channels + Daphne + Redis (for WebSockets and Celery background tasks).
- **Security:** Highly secure JWT authentication and Hierarchical JSON RBAC array (`permission_tabs`).

---

## 📁 Repository Structure

```text
/
├── .agents/                    # Core Architectural Rules & Design Documentation
│   ├── docs/                   # Master requirements, DB schema, Frontend/Backend primers
│   └── rules/                  # Strict LLM/Agent coding rules
├── workspace_simple/           
│   ├── Backend/                # Django REST Backend & Celery
│   └── Frontend/               # React Vite Frontend
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Backend Setup
1. Ensure **PostgreSQL** and **Redis** are running.
2. Initialize the database schema: `psql -U postgres -f workspace_simple/Backend/db-init.sql`
3. Navigate to the backend: `cd workspace_simple/Backend`
4. Install dependencies: `pip install -r requirements.txt`
5. Run migrations: `python manage.py migrate`
6. Start the Daphne ASGI server: `daphne -b 0.0.0.0 -p 8000 backend.asgi:application`
7. Start Celery Worker: `celery -A backend worker -l info -P eventlet`

### Frontend Setup
1. Navigate to the frontend: `cd workspace_simple/Frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

---

## 📚 Core Modules (The 12 Domains)

1. **Apartment & Facility Management:** Buildings, blocks, flats, and common areas.
2. **Utility Management (Core):** Water, electricity, and diesel billing.
3. **Maintenance & Asset Management:** Lifts, pumps, generators, and tracking condition.
4. **Facility Operations:** Daily logs for the pool, gardens, and clubhouse.
5. **Staff Management:** Housekeeping, security, and maintenance attendance/shifts.
6. **Vendor Management:** AMCs, invoices, and performance history.
7. **Finance & Expenses:** The financial backbone and budgeting.
8. **Daily Operations & Tasks:** Shift handovers and checklists.
9. **Security & Access:** Visitor, vehicle, and delivery tracking.
10. **Resident Services:** Helpdesk complaints, facility booking, and real-time **Notices**.
11. **Management Dashboard:** Top-level operational metrics and SLA tracking.
12. **Administration:** Deep hierarchical RBAC and system controls.

---

*Designed and developed specifically for Jains Prakriti Apartments.*
