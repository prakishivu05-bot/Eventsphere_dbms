# Run this script AS ADMINISTRATOR
# Right-click PowerShell -> Run as Administrator
# Then run: powershell -ExecutionPolicy Bypass -File "C:\Users\Admin\Downloads\eventsphere_dbms\reset_mysql_admin.ps1"

$MySQLBin    = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
$NewPassword = "EventSphere@2026"
$InitFile    = "C:\Users\Admin\Downloads\eventsphere_dbms\mysql_init.sql"

Write-Host "MySQL 8.0 Root Password Reset" -ForegroundColor Cyan

# Write the init SQL
"ALTER USER 'root'@'localhost' IDENTIFIED BY '$NewPassword';" | Out-File -FilePath $InitFile -Encoding ASCII

Write-Host "Stopping MySQL service..."
Stop-Service -Name "MySQL80" -Force
Start-Sleep -Seconds 4

Write-Host "Starting MySQL with init file (no auth)..."
$proc = Start-Process -FilePath "$MySQLBin\mysqld.exe" `
    -ArgumentList "--init-file=`"$InitFile`"", "--console", "--skip-grant-tables" `
    -PassThru -NoNewWindow
Start-Sleep -Seconds 6

Write-Host "Stopping temp MySQL process..."
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "Starting MySQL80 service normally..."
Start-Service -Name "MySQL80"
Start-Sleep -Seconds 5

# Test the new password
Write-Host "Testing new password..."
$result = & "$MySQLBin\mysql.exe" -u root "-pEventSphere@2026" -e "SELECT 'LOGIN OK' AS result;" 2>&1
Write-Host $result

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! New password: EventSphere@2026" -ForegroundColor Green
} else {
    Write-Host "Password reset may not have worked. Check error above." -ForegroundColor Red
}

Remove-Item $InitFile -ErrorAction SilentlyContinue
Read-Host "Press Enter to close"
