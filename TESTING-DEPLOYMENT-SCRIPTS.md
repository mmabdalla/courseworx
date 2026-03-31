# Testing CourseWorx Deployment Scripts

This guide provides step-by-step instructions to safely test the deployment scripts before using them in production.

## 🔧 Prerequisites Setup

### 1. Update Configuration
Before testing, update the PostgreSQL password in all scripts:

**In `Deploy.ps1`, `DatabaseManager.ps1`, and `Stop-Deployment.ps1`:**
```powershell
$PostgresPassword = "your_actual_postgres_password"
```

### 2. Verify PostgreSQL
Ensure PostgreSQL is running and accessible:
```powershell
# Test connection
psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();"
```

### 3. Check Current CourseWorx Status
```powershell
# Check if CourseWorx is currently running
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
```

## 🧪 Testing Phase 1: Database Manager Script

### Test 1: List Databases
```powershell
# This should show existing CourseWorx databases
.\DatabaseManager.ps1 list
```

**Expected Result:**
- Shows list of databases starting with `cx_`
- No errors in connection

### Test 2: Create Test Database Dump
```powershell
# Create a dump of your current database (replace with actual database name)
.\DatabaseManager.ps1 dump -DatabaseName cx_2.0.4 -OutputFile "test-dump.sql"
```

**Expected Result:**
- Creates `test-dump.sql` file
- Shows success message
- File size > 0 bytes

### Test 3: Verify Dump File
```powershell
# Check if dump file was created
Get-ChildItem "test-dump.sql"
Get-Content "test-dump.sql" -Head 10
```

**Expected Result:**
- File exists
- Contains SQL commands (CREATE DATABASE, CREATE TABLE, etc.)

## 🧪 Testing Phase 2: Stop Deployment Script

### Test 4: Stop Current Services
```powershell
# Stop any running CourseWorx services
.\Stop-Deployment.ps1
```

**Expected Result:**
- Shows processes being stopped
- No errors
- Ports 3000 and 5000 become available

### Test 5: Verify Ports Are Free
```powershell
# Check that ports are now free
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
```

**Expected Result:**
- No processes on ports 3000 and 5000

## 🧪 Testing Phase 3: Main Deployment Script

### Test 6: Deploy Current Version (Dry Run)
```powershell
# Deploy current version without test data
.\Deploy.ps1
```

**Expected Result:**
- Creates test directory structure
- Installs dependencies
- Creates new database
- Starts services
- Opens browser

### Test 7: Verify Deployment
```powershell
# Check if services are running
Get-NetTCPConnection -LocalPort 3000
Get-NetTCPConnection -LocalPort 5000

# Check if test directory was created
Get-ChildItem "D:\dev\projects\CourseWorx\test\"

# Check if database was created
.\DatabaseManager.ps1 list
```

**Expected Result:**
- Services running on ports 3000 and 5000
- Test directory exists with version folder
- New database appears in list

### Test 8: Test Browser Access
- Browser should open automatically to `http://localhost:3000`
- Backend should be accessible at `http://localhost:5000`
- Login should work with existing credentials

## 🧪 Testing Phase 4: Full Workflow Test

### Test 9: Complete Workflow Test
```powershell
# 1. Create dump of current database
.\DatabaseManager.ps1 dump -DatabaseName cx_2.0.4 -OutputFile "workflow-test.sql"

# 2. Stop current deployment
.\Stop-Deployment.ps1

# 3. Deploy new version with test data
.\Deploy.ps1 "2.0.5" "workflow-test.sql"

# 4. Verify everything works
# - Check browser access
# - Test login
# - Verify data is present
```

**Expected Result:**
- Complete workflow executes without errors
- New version deployed successfully
- Test data restored correctly
- All functionality works

### Test 10: Cleanup Test
```powershell
# Clean up test deployment
.\Stop-Deployment.ps1 "2.0.5"

# Verify cleanup
Get-ChildItem "D:\dev\projects\CourseWorx\test\"
.\DatabaseManager.ps1 list
```

**Expected Result:**
- Test directory removed
- Database dropped
- Services stopped

## 🚨 Troubleshooting Common Issues

### Issue 1: PostgreSQL Connection Failed
**Symptoms:**
```
❌ PostgreSQL connection failed
❌ PostgreSQL not accessible
```

**Solutions:**
1. Check if PostgreSQL service is running:
   ```powershell
   Get-Service postgresql*
   ```

2. Verify connection settings:
   ```powershell
   psql -h localhost -p 5432 -U postgres -d postgres
   ```

3. Check firewall settings
4. Verify password in scripts

### Issue 2: Port Already in Use
**Symptoms:**
```
⚠️ Port 3000 is in use
⚠️ Port 5000 is in use
```

**Solutions:**
1. Scripts should automatically kill processes
2. If not, manually kill processes:
   ```powershell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
   Stop-Process -Id [PID] -Force
   ```

### Issue 3: Permission Denied
**Symptoms:**
```
❌ Access denied
❌ Permission denied
```

**Solutions:**
1. Run PowerShell as Administrator
2. Check file permissions
3. Ensure write access to test directory

### Issue 4: Database Creation Failed
**Symptoms:**
```
❌ Database creation failed
❌ Failed to drop database
```

**Solutions:**
1. Check PostgreSQL user permissions
2. Verify database doesn't already exist
3. Check PostgreSQL logs

### Issue 5: Dependencies Installation Failed
**Symptoms:**
```
❌ Backend dependency installation failed
❌ Frontend dependency installation failed
```

**Solutions:**
1. Check Node.js installation:
   ```powershell
   node --version
   npm --version
   ```

2. Clear npm cache:
   ```powershell
   npm cache clean --force
   ```

3. Check disk space
4. Verify network connection

## 📊 Success Criteria

### ✅ All Tests Pass If:
- [ ] Database Manager can list, dump, and restore databases
- [ ] Stop Deployment can stop services and cleanup
- [ ] Main Deployment can create version-specific environments
- [ ] Services start successfully on correct ports
- [ ] Browser opens and application loads
- [ ] Test data is restored correctly
- [ ] Cleanup removes all test artifacts
- [ ] No errors in any script execution

### ⚠️ Partial Success If:
- [ ] Scripts run but with warnings
- [ ] Services start but with issues
- [ ] Some functionality works but not all

### ❌ Tests Fail If:
- [ ] Scripts crash with errors
- [ ] Services don't start
- [ ] Database operations fail
- [ ] Application doesn't load

## 🎯 Next Steps After Testing

### If All Tests Pass:
1. **Update version.txt** to document successful testing
2. **Commit scripts to Git** for version control
3. **Create production deployment** workflow
4. **Set up automated testing** pipeline

### If Tests Fail:
1. **Fix identified issues** in scripts
2. **Re-test specific components** that failed
3. **Update configuration** as needed
4. **Repeat testing cycle** until all pass

## 📝 Testing Log Template

Keep a log of your testing:

```
Date: 2024-12-19
Tester: [Your Name]
Environment: Windows 10, PowerShell 5.1

Test 1 - Database Manager List: ✅ PASS
Test 2 - Create Dump: ✅ PASS
Test 3 - Verify Dump: ✅ PASS
Test 4 - Stop Services: ✅ PASS
Test 5 - Verify Ports: ✅ PASS
Test 6 - Deploy Current: ✅ PASS
Test 7 - Verify Deployment: ✅ PASS
Test 8 - Browser Access: ✅ PASS
Test 9 - Full Workflow: ✅ PASS
Test 10 - Cleanup: ✅ PASS

Overall Result: ✅ ALL TESTS PASSED
Issues Found: None
Recommendations: Ready for production use
```

This testing approach ensures your deployment scripts work correctly before you rely on them for actual development work!






