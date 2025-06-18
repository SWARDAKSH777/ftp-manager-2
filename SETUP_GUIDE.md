# Secure FTP Manager - Setup Guide

## Overview
This is a secure, admin-managed FTP file manager designed for family/personal use. Only administrators can configure FTP servers, while regular users get controlled access to specific files and folders.

## Key Features
- **Admin-Only Server Management**: Only admins can add/configure FTP servers
- **User Permission System**: Granular control over who can access what files
- **Single Server Architecture**: Simplified for one FTP server setup
- **Mobile-First Design**: Optimized for phone usage
- **Secure Credentials**: FTP credentials are hidden from regular users
- **Progress Indicators**: Real-time upload/download progress

## Initial Setup

### 1. Database Setup
The application uses Supabase for the backend. Run the migration to set up the database:

```sql
-- The migration file creates:
-- - user_profiles table (stores user info and roles)
-- - user_permissions table (controls file access)
-- - admin_settings table (app configuration)
-- - Updated RLS policies for security
```

### 2. Create First Admin User
1. Sign up through the application
2. Manually update the user's role in the database:
```sql
UPDATE user_profiles 
SET role = 'admin', is_active = true 
WHERE user_id = 'your-user-id';
```

### 3. Configure FTP Server (Admin Only)
1. Login as admin
2. Go to "Server Config" tab
3. Enter your FTP server details:
   - Server Name
   - Hostname/IP
   - Port (usually 21 for FTP)
   - Username & Password
   - Protocol (FTP/FTPS/SFTP)
   - Passive Mode setting
4. Test the connection
5. Save configuration

### 4. User Management
As an admin, you can:
- Approve new user registrations
- Activate/deactivate users
- Change user roles
- Reset passwords

### 5. Set User Permissions
1. Go to "Permissions" tab
2. Add permissions for each user:
   - Select user
   - Specify path (/ for root, /folder for specific folder, * for all)
   - Set read/write/delete permissions
3. Users will only see files they have access to

## User Workflow

### For Regular Users:
1. Request access through sign-up
2. Wait for admin approval
3. Once approved, access "My Files" tab
4. Browse only accessible files/folders
5. Upload/download based on permissions

### For Admins:
1. Full access to all admin panels
2. Manage users and permissions
3. Configure server settings
4. Monitor system activity

## Security Features

### 1. Credential Protection
- FTP credentials are encrypted in database
- Only admins can view/modify server settings
- Regular users never see connection details

### 2. Access Control
- Row Level Security (RLS) on all tables
- Path-based permission system
- Admin-only server management

### 3. User Isolation
- Users only see files they have permission for
- No access to server configuration
- Activity logging for audit trails

## Mobile Optimization

### Design Considerations:
- Touch-friendly interface
- Responsive layout for small screens
- Simplified navigation
- Progress indicators for file operations
- Optimized for portrait orientation

### Performance:
- Efficient file loading
- Progress bars for uploads/downloads
- Minimal data usage
- Fast navigation

## File Operations

### Upload Process:
1. Select file from device
2. Check user permissions
3. Show progress bar
4. Upload to FTP server
5. Update file cache
6. Refresh file list

### Download Process:
1. User clicks download
2. Check permissions
3. Show progress bar
4. Download from FTP server
5. Save to device

### Permission Checks:
- Read: Can view and download files
- Write: Can upload new files
- Delete: Can remove files

## Admin Tasks

### Daily Operations:
1. **User Management**
   - Approve new users
   - Monitor user activity
   - Adjust permissions as needed

2. **System Monitoring**
   - Check server connection status
   - Review activity logs
   - Monitor storage usage

3. **Permission Updates**
   - Grant access to new folders
   - Revoke access when needed
   - Set up project-specific permissions

### Maintenance:
1. **Regular Backups**
   - Export user data
   - Backup permission settings
   - Document server configuration

2. **Security Reviews**
   - Audit user permissions
   - Review access logs
   - Update FTP credentials if needed

## Troubleshooting

### Common Issues:

1. **Connection Failed**
   - Check FTP server status
   - Verify credentials
   - Test network connectivity
   - Check firewall settings

2. **User Can't Access Files**
   - Verify user is active
   - Check permission settings
   - Ensure correct path format

3. **Upload/Download Fails**
   - Check user permissions
   - Verify file size limits
   - Test server connection

### Error Messages:
- "Access Denied": User lacks permission for that path
- "Connection Failed": FTP server unreachable
- "Account Pending": User needs admin approval

## Best Practices

### For Admins:
1. **Permission Strategy**
   - Use specific paths instead of wildcards when possible
   - Grant minimum necessary permissions
   - Regular permission audits

2. **User Management**
   - Prompt approval of new users
   - Regular cleanup of inactive accounts
   - Clear naming conventions

3. **Security**
   - Strong FTP passwords
   - Regular credential rotation
   - Monitor access logs

### For Users:
1. **File Organization**
   - Use clear file names
   - Organize in folders
   - Clean up old files

2. **Best Practices**
   - Don't share login credentials
   - Log out when done
   - Report issues to admin

## Technical Architecture

### Frontend:
- React with TypeScript
- Tailwind CSS for styling
- Mobile-first responsive design
- Real-time progress indicators

### Backend:
- Supabase (PostgreSQL + Auth)
- Edge functions for FTP operations
- Row Level Security (RLS)
- Real-time subscriptions

### Security:
- JWT authentication
- Encrypted FTP credentials
- Path-based access control
- Activity logging

This setup provides a secure, user-friendly FTP management system perfect for family or small team use, with strong admin controls and mobile optimization.