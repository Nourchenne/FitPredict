param(
    [switch]$Start
)

$ErrorActionPreference = 'Stop'

Write-Host "=== FitPredict Docker precheck ===" -ForegroundColor Cyan

function Fail([string]$message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
    exit 1
}

function Info([string]$message) {
    Write-Host "[INFO] $message" -ForegroundColor Yellow
}

function Ok([string]$message) {
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Resolve-DockerCliPath {
    $cmd = Get-Command docker -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }

    $candidates = @(
        'C:\Program Files\Docker\Docker\resources\bin\docker.exe',
        'C:\Program Files (x86)\Docker\Docker\resources\bin\docker.exe'
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    return $null
}

$dockerCliPath = Resolve-DockerCliPath
if (-not $dockerCliPath) {
    Fail "Docker CLI introuvable. Installe Docker Desktop puis redémarre le terminal."
}

$dockerBinDir = Split-Path -Parent $dockerCliPath
if ($env:Path -notlike "*$dockerBinDir*") {
    $env:Path = "$dockerBinDir;$env:Path"
}

try {
    $dockerVersion = & $dockerCliPath --version
    Ok "Docker détecté: $dockerVersion"
} catch {
    Fail "Docker est installé mais non accessible. Vérifie que Docker Desktop est lancé."
}

try {
    $composeVersion = & $dockerCliPath compose version
    Ok "Docker Compose détecté: $composeVersion"
} catch {
    Fail "Docker Compose indisponible. Mets à jour Docker Desktop."
}

# Validate compose file from repository root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
Push-Location $repoRoot

try {
    & $dockerCliPath compose config | Out-Null
    Ok "docker-compose.yml valide."

    if ($Start) {
        Info "Démarrage de la stack en cours..."
        & $dockerCliPath compose up --build
    } else {
        Info "Précheck terminé. Pour démarrer la stack: ./scripts/docker-precheck.ps1 -Start"
    }
} catch {
    Fail "Validation Compose échouée: $($_.Exception.Message)"
} finally {
    Pop-Location
}
