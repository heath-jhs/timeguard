/*
===========================================
COMPLETE TIME CLOCK APP CODE EXPORT
===========================================

Copy all code from the files listed below.
Each section shows the file path and complete contents.

===========================================
DATABASE SCHEMAS (JSON)
===========================================
*/

// entities/Profile.json
const ProfileSchema = {
  "name": "Profile",
  "type": "object",
  "properties": {
    "user_id": { "type": "string", "description": "Auth user ID reference" },
    "username": { "type": "string" },
    "first_name": { "type": "string" },
    "last_name": { "type": "string" },
    "full_name": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "mailing_address": { "type": "string" },
    "phone_number": { "type": "string" },
    "role": { "type": "string", "enum": ["admin", "manager", "employee"], "default": "employee" },
    "registration_status": { "type": "string", "enum": ["pending", "approved", "rejected"], "default": "approved" },
    "has_password": { "type": "boolean", "default": false },
    "preferred_dashboard": { "type": "string", "enum": ["AdminDashboard", "ManagerDashboard", "EmployeeDashboard"] },
    "work_hours": { "type": "number", "default": 8 },
    "daily_start": { "type": "string", "default": "09:00" },
    "daily_end": { "type": "string", "default": "17:00" },
    "work_days": { "type": "array", "items": { "type": "string" }, "default": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    "avatar_url": { "type": "string" }
  },
  "required": ["email", "role"]
};

// entities/Site.json
const SiteSchema = {
  "name": "Site",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "address": { "type": "string" },
    "latitude": { "type": "number" },
    "longitude": { "type": "number" },
    "geofence_radius": { "type": "number", "default": 100 },
    "allowed_hours_start": { "type": "string" },
    "allowed_hours_end": { "type": "string" },
    "variance_threshold": { "type": "integer", "default": 5 },
    "manager_id": { "type": "string" },
    "is_active": { "type": "boolean", "default": true }
  },
  "required": ["name", "address", "allowed_hours_start", "allowed_hours_end"]
};

// entities/TimeEntry.json
const TimeEntrySchema = {
  "name": "TimeEntry",
  "type": "object",
  "properties": {
    "employee_id": { "type": "string" },
    "site_id": { "type": "string" },
    "clock_in_time": { "type": "string", "format": "date-time" },
    "clock_out_time": { "type": "string", "format": "date-time" },
    "clock_in_lat": { "type": "number" },
    "clock_in_lon": { "type": "number" },
    "clock_out_lat": { "type": "number" },
    "clock_out_lon": { "type": "number" },
    "status": { "type": "string", "enum": ["active", "completed", "invalid"], "default": "active" },
    "notes": { "type": "string" }
  },
  "required": ["employee_id", "site_id", "clock_in_time"]
};

/*
===========================================
TO EXPORT ALL FILES:
===========================================

1. Go to Base44 Dashboard → Code
2. Copy each file manually:
   - Layout.js
   - All files in pages/
   - All files in components/
   - All files in functions/
   
3. Or use browser console:

// Run this in browser console on Base44 dashboard:
console.log('Export ready - manually copy files from dashboard');

===========================================
FILE LIST TO COPY:
===========================================

LAYOUT:
- Layout.js

PAGES:
- pages/Home.js
- pages/EmployeeDashboard.js
- pages/AdminDashboard.js
- pages/ManagerDashboard.js
- pages/EnrollUser.js
- pages/SetPassword.js

COMPONENTS:
- components/admin/UserManagement.jsx
- components/admin/SiteManagement.jsx
- components/admin/SiteAssignment.jsx
- components/admin/EnhancedReports.jsx
- components/admin/LiveActivityMap.jsx
- components/admin/PendingEnrollments.jsx
- components/manager/VarianceAlerts.jsx
- components/timeclock/SiteMap.jsx
- components/timeclock/ClockWidget.jsx
- components/timeclock/TimeHistory.jsx
- components/employee/AssignmentsList.jsx
- components/employee/OnsiteActions.jsx

FUNCTIONS:
- functions/validateInvitation.js
- functions/submitEnrollment.js
- functions/approveEnrollment.js

*/

export default function ExportGuide() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Code Export Instructions</h1>
      <p>Go to your Base44 Dashboard → Code section and manually copy each file listed in this file's comments.</p>
      <p>All schemas and file paths are documented above.</p>
    </div>
  );
}