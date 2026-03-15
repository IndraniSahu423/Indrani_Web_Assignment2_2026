# E-Cell IIT Bombay Query Management Portal - RBAC System

## Multi-Level Role Based Access Control

### Roles & Permissions

#### 1. SUPERADMIN
- Seeded in database (Email: `superadmin@ecell.iitb.ac.in`, Password: `***REMOVED***`)
- Full system access
- Can create/deactivate admin accounts
- Can delete any query or data
- Can reset passwords for any user
- No email notifications
- Dashboard: all users, queries, coordinators, system stats

#### 2. ADMIN
- Created only by superadmin
- Can see ALL queries from all students
- Can assign queries to coordinators
- Can create/deactivate coordinator accounts
- Can reset coordinator passwords
- Email notification when student submits new query

#### 3. COORDINATOR
- Created only by admin
- Can ONLY see queries assigned to them
- Can submit solutions/progress updates
- Can update query status: `in_progress`, `needs_info`, `resolved`
- Email notification when admin assigns a query

#### 4. STUDENT/USER
- Self-registration enabled
- Dashboard has TWO options:
  - "My Queries" - list of submitted queries
  - "New Query" - submit new query form
- Cannot see other users' queries
- Email notifications:
  - When coordinator is assigned
  - When query is resolved

## Setup Instructions

### 1. Database Setup
```bash
# Run the schema to create tables and seed data
psql -U your_user -d your_database -f server/src/config/schema.sql
```

### 2. Server Setup
```bash
cd server
npm install
```

Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ecell_portal
JWT_SECRET=your-secret-key-here
PORT=5000

# Optional: Email notifications (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Start server:
```bash
npm run dev
```

### 3. Client Setup
```bash
cd client
npm install
npm run dev
```

## Default Credentials

**Superadmin:**
- Email: `superadmin@ecell.iitb.ac.in`
- Password: `***REMOVED***`

**Students** can self-register at `/register`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Student self-registration
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### User Management (Admin/Superadmin only)
- `POST /api/users` - Create admin/coordinator
- `GET /api/users` - Get all users
- `GET /api/users/coordinators` - Get coordinators with stats
- `GET /api/users/stats` - Get system statistics
- `PATCH /api/users/:id/deactivate` - Deactivate user
- `PATCH /api/users/:id/reset-password` - Reset password

### Queries
- `POST /api/queries` - Create query (Students)
- `GET /api/queries` - Get queries (role-based filtering)
- `GET /api/queries/:id` - Get query details
- `PATCH /api/queries/:id` - Update query (Admin/Coordinator)
- `DELETE /api/queries/:id` - Delete query (Superadmin only)

### Domains
- `GET /api/domains` - Get all domains

## Email Notifications

Configure SMTP settings in `.env` to enable:
- Admin notification on new query submission
- Coordinator notification on query assignment
- Student notification on coordinator assignment
- Student notification on query resolution

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based route protection
- Account deactivation (not deletion)
- Password reset by admin/superadmin

## Frontend Routes

- `/login` - Login page
- `/register` - Student registration
- `/dashboard` - Main dashboard (role-based view)
- `/admin` - Admin panel (admin/superadmin only)
- `/queries/new` - Create new query (students only)
- `/queries/:id` - Query details

## Network Error Fix

The axios interceptor now properly handles:
- Connection timeouts (10s)
- Network errors with clear messages
- 401 unauthorized redirects
- Better error messages for debugging

## Priority & Status Visibility Fix

Priority buttons now use proper contrast colors:
- Selected: Colored border + semi-transparent background
- Unselected: Gray border + dark background
- All options are clearly visible in dark theme

Status and priority dropdowns use `option:text-slate-100 option:bg-surface-700` for proper visibility.
