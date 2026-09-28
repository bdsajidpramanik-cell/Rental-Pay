# 🏢 Rental Pay - Multi-Tenant Shop & Property Management System

Rental Pay is a robust multi-tenant property management platform designed to manage commercial properties, shops/units, tenant onboardings, lease agreements, billing, payment verifications, and audit logging.

---

## 🛠️ Tech Stack

### Backend
- **Framework:** NestJS (TypeScript)
- **Database & ORM:** PostgreSQL & Prisma ORM
- **Authentication:** Firebase Admin SDK (JWT Bearer Verification)
- **Security & Access:** Role-Based Access Control (RBAC) & Audit Interceptors

### Frontend
- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios (with Firebase Token Interceptor)

---

## 📁 Project Structure

```text
rental-pay/
├── prisma/
│   ├── schema.prisma         # Database models and enums
│   └── seed.ts               # Database seeder script
├── src/                      # NestJS Backend Application
│   ├── audit/                # Audit logging interceptors
│   ├── auth/                 # Guards & decorators for Firebase/RBAC
│   ├── firebase/             # Firebase Admin integration
│   ├── prisma/               # Prisma service instance
│   ├── qr-onboarding/        # Tenant QR onboarding logic
│   ├── shops/                # Shop management service
│   ├── users/                # User sync & demotion safeguards
│   ├── agreements/           # Agreement versioning & lifecycle
│   └── payments/             # Proof submission & verification
├── context/                  # Frontend Auth & State Management
├── components/               # React / Tailwind UI Components
└── types/                    # Shared TypeScript interfaces
