# Database Setup Guide for Windows

## Step 1: Check PostgreSQL Password

Your `.env` file shows:
```
DATABASE_URL=postgresql://postgres:***REMOVED***@localhost:5432/E-Cell_Portal
```

The password is: `***REMOVED***` (URL encoded as `***REMOVED***`)

## Step 2: Open pgAdmin

1. Open **pgAdmin 4** (search in Windows start menu)
2. Enter your master password if prompted
3. Expand **Servers** → **PostgreSQL**
4. Right-click on **Databases**

## Step 3: Create Database (if not exists)

1. Right-click **Databases** → **Create** → **Database**
2. Name: `E-Cell_Portal`
3. Click **Save**

## Step 4: Run Schema

### Option A: Using pgAdmin (Recommended)

1. Click on `E-Cell_Portal` database
2. Click **Tools** → **Query Tool**
3. Open the file: `server/src/config/schema.sql`
4. Copy ALL content from schema.sql
5. Paste into Query Tool
6. Click **Execute** (▶️ button) or press F5
7. You should see "Query returned successfully"

### Option B: Using Node Script

```bash
cd server
node src/utils/setupDb.js
```

If you get password error:
1. Open pgAdmin
2. Right-click **PostgreSQL** server → **Properties**
3. Go to **Connection** tab
4. Check the password
5. Update `.env` file with correct password

## Step 5: Verify Setup

In pgAdmin Query Tool, run:
```sql
SELECT * FROM roles;
SELECT * FROM domains;
SELECT * FROM users;
```

You should see:
- 4 roles (superadmin, admin, coordinator, student)
- 5 domains (events, marketing, tech, partnerships, media)
- 1 user (superadmin)

## Step 6: Start Server

```bash
cd server
npm run dev
```

You should see:
```
Server listening on port 5000
```

## Superadmin Login

- Email: `superadmin@ecell.iitb.ac.in`
- Password: `***REMOVED***`

## Troubleshooting

### Error: "password authentication failed"
- Check password in pgAdmin server properties
- Update DATABASE_URL in .env
- Remember to URL encode special characters:
  - @ becomes %40
  - # becomes %23
  - $ becomes %24

### Error: "database does not exist"
- Create database in pgAdmin first
- Name must match exactly: `E-Cell_Portal`

### Error: "relation already exists"
- Tables already created
- Either drop them first or skip schema.sql
- To drop: Right-click database → **DROP Cascade**
