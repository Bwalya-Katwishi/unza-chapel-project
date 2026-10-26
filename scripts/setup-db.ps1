<#
.SYNOPSIS
  Creates the local PostgreSQL role/database for UNZA Chapel Portal development.

.DESCRIPTION
  Requires an existing PostgreSQL superuser password.
  Does not guess credentials. Pass -PostgresPassword explicitly or set env PGPASSWORD.

.EXAMPLE
  .\scripts\setup-db.ps1 -PostgresPassword 'your-postgres-password' -Port 5432
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$PostgresPassword,
  [string]$AdminUser = "postgres",
  [int]$Port = 5432,
  [string]$HostName = "127.0.0.1",
  [string]$AppUser = "unza_chapel",
  [string]$AppPassword = "unza_chapel_dev_password",
  [string]$AppDb = "unza_chapel_portal"
)

$ErrorActionPreference = "Stop"
$psql = @(
  "C:\Program Files\PostgreSQL\18\bin\psql.exe",
  "C:\Program Files\PostgreSQL\17\bin\psql.exe",
  "C:\Program Files\PostgreSQL\13\bin\psql.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $psql) { throw "psql.exe not found. Install PostgreSQL or start Docker Compose." }

$env:PGPASSWORD = $PostgresPassword

Write-Host "Creating role/database on ${HostName}:${Port} ..."
& $psql -U $AdminUser -h $HostName -p $Port -d postgres -v ON_ERROR_STOP=1 -c @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$AppUser') THEN
    CREATE ROLE $AppUser LOGIN PASSWORD '$AppPassword';
  ELSE
    ALTER ROLE $AppUser WITH LOGIN PASSWORD '$AppPassword';
  END IF;
END
`$`$;
"@

$dbExists = & $psql -U $AdminUser -h $HostName -p $Port -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$AppDb'"
if ($dbExists -ne "1") {
  & $psql -U $AdminUser -h $HostName -p $Port -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $AppDb OWNER $AppUser;"
}

& $psql -U $AdminUser -h $HostName -p $Port -d $AppDb -v ON_ERROR_STOP=1 -c "GRANT ALL ON SCHEMA public TO $AppUser;"

Write-Host "Done. Update .env DATABASE_URL if needed, then run:"
Write-Host "  npx prisma migrate dev --name init"
Write-Host "  npm run db:seed"
