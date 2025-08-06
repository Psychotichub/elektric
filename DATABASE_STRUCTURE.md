# Database Structure Documentation

## Overview

The system uses a **multi-database architecture** with one main database for authentication and site-specific databases for data isolation. Each site has its own dedicated database with complete data separation.

## Database Architecture

```
MongoDB Instance
├── daily_report_system (Main Database)
│   ├── users
│   └── (authentication & site info)
├── sion_sion (Sion Site Database)
│   ├── SiteUser
│   ├── SiteDailyReport
│   ├── SiteMaterial
│   ├── SiteReceived
│   ├── SiteTotalPrice
│   └── SiteMonthlyReport
├── arsi_sion (Arsi Site Database)
│   ├── SiteUser
│   ├── SiteDailyReport
│   ├── SiteMaterial
│   ├── SiteReceived
│   ├── SiteTotalPrice
│   └── SiteMonthlyReport
└── dro_power (Dro Site Database)
    ├── SiteUser
    ├── SiteDailyReport
    ├── SiteMaterial
    ├── SiteReceived
    ├── SiteTotalPrice
    └── SiteMonthlyReport
```

## 1. Main Database: `daily_report_system`

### Purpose
- User authentication and authorization
- Site and company information
- System-wide configuration

### Collections

#### `users`
```javascript
{
  _id: ObjectId,
  username: String (required, unique),
  password: String (required, hashed),
  email: String,
  role: String (enum: ['admin', 'user']),
  site: String (required),
  company: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ username: 1 }` (unique)
- `{ site: 1, company: 1 }` (compound)

## 2. Site-Specific Databases

### Naming Convention
- **Format**: `{site}_{company}` (lowercase, special characters replaced with underscores)
- **Examples**:
  - `sion_sion` (Site: Sion, Company: Sion)
  - `arsi_sion` (Site: Arsi, Company: Sion)
  - `dro_power` (Site: Dro, Company: power)

### Collections in Each Site Database

#### `SiteUser`
```javascript
{
  _id: ObjectId,
  username: String (required, unique),
  password: String (required, hashed),
  email: String,
  role: String (enum: ['admin', 'user']),
  site: String (required),
  company: String (required),
  createdAt: Date
}
```

#### `SiteDailyReport`
```javascript
{
  _id: ObjectId,
  date: Date (required),
  materialName: String (required),
  quantity: Number (required),
  location: String,
  materialPrice: Number (required),
  labourPrice: Number (required),
  unit: String (required),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### `SiteMaterial`
```javascript
{
  _id: ObjectId,
  materialName: String (required, unique),
  unit: String (required),
  materialPrice: Number (required),
  laborPrice: Number (required),
  createdAt: Date,
  updatedAt: Date
}
```

#### `SiteReceived`
```javascript
{
  _id: ObjectId,
  date: Date (required),
  materialName: String (required),
  quantity: Number (required),
  supplier: String (required),
  location: String,
  notes: String,
  unit: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

#### `SiteTotalPrice`
```javascript
{
  _id: ObjectId,
  date: Date (required),
  materialName: String (required),
  quantity: Number (required),
  unit: String (required),
  materialPrice: Number (required),
  laborPrice: Number (required),
  materialCost: Number (required),
  laborCost: Number (required),
  totalPrice: Number (required),
  location: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### `SiteMonthlyReport`
```javascript
{
  _id: ObjectId,
  date: Date (required),
  materialName: String (required),
  totalQuantity: Number (required),
  totalMaterialCost: Number (required),
  totalLaborCost: Number (required),
  totalCost: Number (required),
  unit: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

## Database Connections

### Main Database Connection
```javascript
// src/db/mongoose.js
await mongoose.connect(process.env.MONGO_URI, { 
  dbName: 'daily_report_system' 
});
```

### Site-Specific Database Connections
```javascript
// src/models/siteDatabase.js
const connection = mongoose.createConnection(
  process.env.MONGO_URI,
  { dbName: `${site}_${company}` }
);
```

## Data Flow

### 1. User Authentication
1. User logs in → Main database (`daily_report_system`)
2. JWT token contains user info (id, username, role, site, company)
3. All subsequent requests use site-specific database

### 2. Data Operations
1. API request comes in with JWT token
2. Extract site and company from token
3. Connect to site-specific database (`{site}_{company}`)
4. Perform operations on site-specific collections
5. Return site-specific data only

### 3. Site Isolation
- Each site has its own database
- No cross-site data access possible
- Database-level security and isolation
- Automatic data scoping by site

## API Endpoints

### User Routes (`/api/user/*`)
All routes automatically use site-specific databases:

- `GET /api/user/daily-reports` → `SiteDailyReport.find()`
- `POST /api/user/daily-reports` → `SiteDailyReport.insertMany()`
- `GET /api/user/materials` → `SiteMaterial.find()`
- `POST /api/user/materials` → `SiteMaterial.save()`
- `GET /api/user/received` → `SiteReceived.find()`
- `POST /api/user/received` → `SiteReceived.insertMany()`
- `GET /api/user/total-prices` → `SiteTotalPrice.find()`
- `POST /api/user/total-prices` → `SiteTotalPrice.insertMany()`

### Settings Routes (`/api/settings/*`)
- `GET /api/settings/user-site-details` → Site-specific statistics

## Migration Status

### ✅ Completed
- **Main Database**: User authentication working
- **Site Databases**: All site-specific databases created
- **Data Migration**: Existing data migrated to site-specific databases
- **API Routes**: All routes updated for site-specific databases
- **Settings**: Site-specific statistics working

### 📊 Current Database Status
- **Sion_Sion**: 1 material record
- **Arsi_Sion**: 0 records (clean)
- **Dro_power**: 0 records (clean)

## Security Features

### ✅ Database-Level Isolation
- Each site has its own database
- No possibility of cross-site data access
- Database-level security

### ✅ Authentication & Authorization
- JWT-based authentication
- Site-based authorization
- Role-based access control

### ✅ Data Validation
- Mongoose schema validation
- Required field validation
- Data type validation

## Backup Strategy

### Individual Site Backups
```bash
# Backup Sion site
mongodump --db sion_sion --out ./backups/sion_sion

# Backup Arsi site
mongodump --db arsi_sion --out ./backups/arsi_sion

# Backup Dro site
mongodump --db dro_power --out ./backups/dro_power
```

### Main Database Backup
```bash
# Backup main database
mongodump --db daily_report_system --out ./backups/main_db
```

## Performance Considerations

### ✅ Benefits
- **No Cross-Site Performance Impact**: Each site's performance is independent
- **Scalable**: Easy to add new sites without affecting existing ones
- **Isolated**: Database operations don't interfere with other sites
- **Optimized**: Each site can be optimized independently

### 📊 Monitoring
- Monitor each site database separately
- Track performance per site
- Independent scaling per site

## File Structure

```
src/
├── models/
│   ├── user.js (Main database)
│   └── siteDatabase.js (Site-specific databases)
├── controllers/
│   ├── authController.js (Main database)
│   ├── userDailyReportController.js (Site-specific)
│   ├── userMaterialController.js (Site-specific)
│   ├── userReceivedController.js (Site-specific)
│   ├── userTotalPriceController.js (Site-specific)
│   └── settingsController.js (Site-specific)
├── middleware/
│   └── auth.js (Site-based authorization)
└── db/
    └── mongoose.js (Main database connection)
```

## Testing

### ✅ Test Scripts
- `src/scripts/testSiteDatabases.js` - Test site-specific databases
- `src/scripts/testCleanConnections.js` - Test database connections
- `src/scripts/migrateToSiteDatabases.js` - Migration script

### ✅ Test Results
- Site isolation working ✅
- Cross-site access blocked ✅
- Data creation isolated ✅
- API functionality working ✅

## Maintenance

### Adding New Sites
1. Create new user with site/company info
2. Site-specific database created automatically
3. No changes to existing sites required

### Database Cleanup
```javascript
// Remove old data from main database
await DailyReport.deleteMany({ site: { $exists: true } });
await Material.deleteMany({ site: { $exists: true } });
await Received.deleteMany({ site: { $exists: true } });
await TotalPrice.deleteMany({ site: { $exists: true } });
```

## Summary

The database structure provides:
- ✅ **Complete data isolation** between sites
- ✅ **Database-level security** and access control
- ✅ **Scalable architecture** for multiple sites
- ✅ **Independent performance** per site
- ✅ **Easy backup and maintenance** per site
- ✅ **Clean separation** of concerns

This architecture ensures that each site operates independently with its own dedicated database, providing maximum security, performance, and scalability. 🎉 