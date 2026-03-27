# Run from repo root: .\database\import.ps1
# PowerShell-friendly alternative to: mysql -u root -p < database/schema.sql

$schema = Join-Path $PSScriptRoot "schema.sql"
Get-Content -Path $schema -Raw | mysql -u root -p
