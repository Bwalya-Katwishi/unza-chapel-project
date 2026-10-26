$ErrorActionPreference = "Stop"
$proj = Split-Path -Parent $PSScriptRoot
$pgBin = "C:\Program Files\PostgreSQL\18\bin"
if (-not (Test-Path "$pgBin\pg_ctl.exe")) {
  $pgBin = "C:\Program Files\PostgreSQL\17\bin"
}
$pgData = Join-Path $proj ".pgdata"
$pgLog = Join-Path $pgData "server.log"
$port = 55432

if (-not (Test-Path $pgData)) {
  & "$pgBin\initdb.exe" -D $pgData -U unza_chapel -A trust -E UTF8 --locale=C
}

& "$pgBin\pg_ctl.exe" -D $pgData status 2>$null
if ($LASTEXITCODE -ne 0) {
  & "$pgBin\pg_ctl.exe" -D $pgData -l $pgLog -o "-p $port" start
}

$dbCheck = & "$pgBin\psql.exe" -U unza_chapel -h 127.0.0.1 -p $port -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='unza_chapel_portal'"
if ($dbCheck -ne "1") {
  & "$pgBin\psql.exe" -U unza_chapel -h 127.0.0.1 -p $port -d postgres -c "CREATE DATABASE unza_chapel_portal OWNER unza_chapel;"
}

Write-Host "Local PostgreSQL listening on 127.0.0.1:$port (database unza_chapel_portal)"
