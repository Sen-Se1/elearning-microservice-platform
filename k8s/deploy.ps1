# =============================================================
# deploy.ps1 — Windows PowerShell
# Run from the K8S\ root folder:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\deploy.ps1
# Requires kubectl configured with your cluster kubeconfig
# =============================================================
$ErrorActionPreference = "Stop"

function Log    { param($m) Write-Host "[OK] $m" -ForegroundColor Green }
function Warn   { param($m) Write-Host "[..] $m" -ForegroundColor Yellow }
function Header { param($m) Write-Host "`n=== $m ===" -ForegroundColor Cyan }

Write-Host ""
Write-Host "  eLearning Platform - K8s Deploy (Windows)" -ForegroundColor Cyan
Write-Host ""

Header "Namespace"
kubectl apply -f namespaces/elearning.yaml
Log "Namespace ready"

Header "Secrets & ConfigMaps"
kubectl apply -f secrets/app-secrets.yaml
kubectl apply -f configmaps/app-config.yaml
kubectl apply -f configmaps/nginx-config.yaml
Log "Secrets & ConfigMaps ready"

Header "Persistent Volume Claims"
kubectl apply -f volumes/pvc-postgres.yaml
kubectl apply -f volumes/pvc-mongodb.yaml
kubectl apply -f volumes/pvc-redis.yaml
kubectl apply -f volumes/pvc-minio.yaml
Warn "Waiting for PVCs to bind..."
kubectl wait --for=condition=Bound `
  pvc/pvc-postgres pvc/pvc-mongodb pvc/pvc-redis pvc/pvc-minio `
  -n elearning --timeout=120s
Log "All PVCs bound"

Header "Database Deployments"
kubectl apply -f deployments/postgres.yaml
kubectl apply -f deployments/mongodb.yaml
kubectl apply -f deployments/redis.yaml
kubectl apply -f deployments/minio.yaml
kubectl apply -f services/postgres.yaml
kubectl apply -f services/mongodb.yaml
kubectl apply -f services/redis.yaml
kubectl apply -f services/minio.yaml
Warn "Waiting for databases..."
kubectl rollout status deployment/postgres -n elearning --timeout=120s
kubectl rollout status deployment/mongo    -n elearning --timeout=120s
kubectl rollout status deployment/redis    -n elearning --timeout=120s
kubectl rollout status deployment/minio    -n elearning --timeout=120s
Log "Databases ready"

Header "Ollama LLM"
kubectl apply -f deployments/ollama.yaml
kubectl apply -f services/ollama.yaml
Warn "Waiting for Ollama (llama3 pull may take several minutes)..."
kubectl rollout status deployment/ollama -n elearning --timeout=300s
Log "Ollama ready"

Header "n8n"
kubectl apply -f deployments/n8n.yaml
kubectl apply -f services/n8n.yaml
Log "n8n deployed"

Header "Backend Microservices"
kubectl apply -f deployments/user-service.yaml
kubectl apply -f deployments/course-service.yaml
kubectl apply -f deployments/analytics-service.yaml
kubectl apply -f deployments/ai-tutor-service.yaml
kubectl apply -f services/user-service.yaml
kubectl apply -f services/course-service.yaml
kubectl apply -f services/analytics-service.yaml
kubectl apply -f services/ai-tutor-service.yaml
Warn "Waiting for backend services..."
kubectl rollout status deployment/user-service      -n elearning --timeout=120s
kubectl rollout status deployment/course-service    -n elearning --timeout=120s
kubectl rollout status deployment/analytics-service -n elearning --timeout=120s
kubectl rollout status deployment/ai-tutor-service  -n elearning --timeout=120s
Log "Backend services ready"

Header "Frontend & Gateway"
kubectl apply -f deployments/learning-portal.yaml
kubectl apply -f deployments/api-gateway.yaml
kubectl apply -f services/learning-portal.yaml
kubectl apply -f services/api-gateway.yaml
Warn "Waiting for frontend & gateway..."
kubectl rollout status deployment/learning-portal -n elearning --timeout=120s
kubectl rollout status deployment/api-gateway     -n elearning --timeout=120s
Log "Frontend & gateway ready"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  App:            http://192.168.66.10:30080"
Write-Host "  n8n:            http://192.168.66.10:30567"
Write-Host "  MinIO Console:  http://192.168.66.10:30901"
Write-Host ""
kubectl get pods -n elearning
Write-Host ""
kubectl get svc  -n elearning