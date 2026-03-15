# ✅ SETUP COMPLETE - Quick Start Guide

## 🎉 Your database has been successfully migrated!

### Available Accounts

**Superadmin (Full Access)**
- Email: `superadmin@ecell.iitb.ac.in`
- Password: `***REMOVED***`
- Can: Create admins, manage all users, delete anything

**Your Student Account**
- Email: `***REMOVED***`
- Password: (your existing password)
- Can: Submit queries, view your queries

## 🚀 Start the Application

### 1. Start Backend Server
```bash
cd server
npm run dev
```
Server will run on: http://localhost:5000

### 2. Start Frontend (in new terminal)
```bash
cd client
npm run dev
```
Client will run on: http://localhost:5173

## 📋 Testing the RBAC System

### Step 1: Login as Superadmin
1. Go to http://localhost:5173/login
2. Login with superadmin credentials
3. You'll see "Admin Panel" button in dashboard
4. Click "Admin Panel" to access `/admin` route

### Step 2: Create an Admin
1. In Admin Panel, click "Create User"
2. Fill in:
   - Name: Test Admin
   - Email: admin@ecell.iitb.ac.in
   - Password: ***REMOVED***
   - Role: Admin
3. Click "Create"

### Step 3: Create a Coordinator
1. Login as Admin (or stay as Superadmin)
2. Click "Create User"
3. Fill in:
   - Name: Tech Coordinator
   - Email: ***REMOVED***
   - Password: ***REMOVED***
   - Role: Coordinator
   - Domain: tech
4. Click "Create"

### Step 4: Test Student Flow
1. Logout and login as student (your account)
2. Click "New Query"
3. Submit a query
4. Admin will see it in their dashboard

### Step 5: Test Assignment
1. Login as Admin
2. View the query
3. Assign it to the coordinator
4. Coordinator will receive email (if SMTP configured)

### Step 6: Test Coordinator Flow
1. Login as Coordinator
2. You'll ONLY see queries assigned to you
3. Update status to "in_progress"
4. Add solution text
5. Mark as "resolved"

## 🔧 Features Working

✅ Multi-level RBAC (4 roles)
✅ Role-based dashboards
✅ Admin panel for user management
✅ Query assignment workflow
✅ Email notifications (if SMTP configured)
✅ Network error handling
✅ Priority/Status visibility fixed
✅ Proper permissions on all routes

## 📧 Email Notifications (Optional)

To enable email notifications, add to `server/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🐛 Troubleshooting

### Server won't start
```bash
cd server
node src/utils/testServer.js
```

### Database issues
```bash
cd server
node src/utils/verifyDb.js
```

### Need to reset database
```bash
# In pgAdmin, run the full schema.sql file
# Or use the migration script again
node src/utils/migrate.js
```

## 📚 API Endpoints

### Authentication
- POST `/api/auth/register` - Student registration
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Current user

### User Management (Admin/Superadmin)
- POST `/api/users` - Create user
- GET `/api/users` - List all users
- GET `/api/users/coordinators` - List coordinators
- GET `/api/users/stats` - System stats
- PATCH `/api/users/:id/deactivate` - Deactivate user
- PATCH `/api/users/:id/reset-password` - Reset password

### Queries
- POST `/api/queries` - Create query
- GET `/api/queries` - List queries (filtered by role)
- GET `/api/queries/:id` - Query details
- PATCH `/api/queries/:id` - Update query
- DELETE `/api/queries/:id` - Delete (superadmin only)

## 🎯 Next Steps

1. Test all role flows
2. Configure email notifications
3. Customize domains in database
4. Add more coordinators
5. Deploy to production

## 📞 Support

If you encounter issues:
1. Check server logs
2. Run verification scripts
3. Check browser console for frontend errors
4. Verify DATABASE_URL in .env

---

**Everything is ready! Start the servers and test the system! 🚀**
