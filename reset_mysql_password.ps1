## EventSphere MySQL Password Reset Script (Run as Administrator)
## 
## INSTRUCTIONS:
## 1. Right-click PowerShell -> "Run as Administrator"
## 2. Navigate to this folder:
##    cd "C:\Users\Admin\Downloads\eventsphere_dbms"
## 3. Run this script:
##    powershell -ExecutionPolicy Bypass -File reset_mysql_password.ps1

Write-Host "==== MySQL 8.0 Root Password Reset ====" -ForegroundColor Cyan
Write-Host ""

$MySQLBin    = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
$MySQLData   = "C:\ProgramData\MySQL\MySQL Server 8.0\Data"
$NewPassword = "EventSphere@2026"    # <-- New password will be set to this
$InitFile    = "$env:TEMP\mysql_init.sql"

# Write the ALTER USER statement to a temp file
@"
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$NewPassword';
FLUSH PRIVILEGES;
"@ | Out-File -FilePath $InitFile -Encoding ASCII

Write-Host "Step 1: Stopping MySQL80 service..." -ForegroundColor Yellow
net stop MySQL80
Start-Sleep -Seconds 3

Write-Host "Step 2: Starting MySQL in skip-grant-tables mode..." -ForegroundColor Yellow
$proc = Start-Process -FilePath "$MySQLBin\mysqld.exe" `
    -ArgumentList "--skip-grant-tables", "--skip-networking", "--user=root" `
    -PassThru -NoNewWindow
Start-Sleep -Seconds 5

Write-Host "Step 3: Connecting and resetting password..." -ForegroundColor Yellow
& "$MySQLBin\mysql.exe" -u root --connect-expired-password -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$NewPassword'; FLUSH PRIVILEGES;"
Start-Sleep -Seconds 2

Write-Host "Step 4: Killing temp MySQL process..." -ForegroundColor Yellow
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "Step 5: Starting MySQL80 service normally..." -ForegroundColor Yellow
net start MySQL80
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "==== Password Reset Complete ====" -ForegroundColor Green
Write-Host "New MySQL root password: $NewPassword" -ForegroundColor Green
Write-Host ""
Write-Host "Now run in this folder:" -ForegroundColor Cyan
Write-Host "  python setup_database.py --password EventSphere@2026" -ForegroundColor White
Write-Host ""

# Clean up temp file
Remove-Item $InitFile -ErrorAction SilentlyContinue
