#!/bin/bash
# =============================================================
# deploy.sh — Linux/macOS
# Run from the K8S/ root folder on the master node:
#   export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
#   bash deploy.sh
# =============================================================
set -e
cd "$(dirname "$0")"
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

G='\033[0;32m'; Y='\033[1;33m'; C='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${G}[✔] $1${NC}"; }
warn() { echo -e "${Y}[…] $1${NC}"; }
header() { echo -e "\n${C}=== $1 ===${NC}"; }

echo -e "${C}"
echo "  ██╗  ██╗ █████╗ ███████╗"
echo "  ██║ ██╔╝██╔══██╗██╔════╝"
echo "  █████╔╝ ╚█████╔╝███████╗"
echo "  ██╔═██╗ ██╔══██╗╚════██║"
echo "  ██║  ██╗╚█████╔╝███████║"
echo "  ╚═╝  ╚═╝ ╚════╝ ╚══════╝  K8s Deploy (Linux)"
echo -e "${NC}"

header "Namespace"
kubectl apply -f namespaces/elearning.yaml
log "Namespace ready"

header "Secrets & ConfigMaps"
kubectl apply -f secrets/app-secrets.yaml
kubectl apply -f configmaps/app-config.yaml
kubectl apply -f configmaps/nginx-config.yaml
log "Secrets & ConfigMaps ready"

header "Persistent Volume Claims"
kubectl apply -f volumes/pvc-postgres.yaml
kubectl apply -f volumes/pvc-mongodb.yaml
kubectl apply -f volumes/pvc-redis.yaml
kubectl apply -f volumes/pvc-minio.yaml
warn "Waiting for PVCs to bind..."
kubectl wait --for=condition=Bound \
  pvc/pvc-postgres pvc/pvc-mongodb pvc/pvc-redis pvc/pvc-minio \
  -n elearning --timeout=120s
log "All PVCs bound"

header "Database Deployments"
kubectl apply -f deployments/postgres.yaml
kubectl apply -f deployments/mongodb.yaml
kubectl apply -f deployments/redis.yaml
kubectl apply -f deployments/minio.yaml
kubectl apply -f services/postgres.yaml
kubectl apply -f services/mongodb.yaml
kubectl apply -f services/redis.yaml
kubectl apply -f services/minio.yaml
warn "Waiting for databases..."
kubectl rollout status deployment/postgres -n elearning --timeout=120s
kubectl rollout status deployment/mongo    -n elearning --timeout=120s
kubectl rollout status deployment/redis    -n elearning --timeout=120s
kubectl rollout status deployment/minio    -n elearning --timeout=120s
log "Databases ready"

header "Ollama LLM"
kubectl apply -f deployments/ai/ollama.yaml
kubectl apply -f services/ai/ollama.yaml
warn "Waiting for Ollama (llama3 pull may take several minutes)..."
kubectl rollout status deployment/ollama -n elearning --timeout=300s
log "Ollama ready"

header "n8n"
kubectl apply -f deployments/n8n.yaml
kubectl apply -f services/n8n.yaml
log "n8n deployed"

header "Backend Microservices"
kubectl apply -f deployments/user-service.yaml
kubectl apply -f deployments/course-service.yaml
kubectl apply -f deployments/analytics-service.yaml
kubectl apply -f deployments/ai-tutor-service.yaml
kubectl apply -f services/user-service.yaml
kubectl apply -f services/course-service.yaml
kubectl apply -f services/analytics-service.yaml
kubectl apply -f services/ai-tutor-service.yaml
warn "Waiting for backend services..."
kubectl rollout status deployment/user-service      -n elearning --timeout=120s
kubectl rollout status deployment/course-service    -n elearning --timeout=120s
kubectl rollout status deployment/analytics-service -n elearning --timeout=120s
kubectl rollout status deployment/ai-tutor-service  -n elearning --timeout=120s
log "Backend services ready"

header "Frontend & Gateway"
kubectl apply -f deployments/learning-portal.yaml
kubectl apply -f deployments/api-gateway.yaml
kubectl apply -f services/learning-portal.yaml
kubectl apply -f services/api-gateway.yaml
warn "Waiting for frontend & gateway..."
kubectl rollout status deployment/learning-portal -n elearning --timeout=120s
kubectl rollout status deployment/api-gateway     -n elearning --timeout=120s
log "Frontend & gateway ready"

echo ""
echo -e "${G}=================================================="
echo "  ✅  Deployment Complete!"
echo -e "==================================================${NC}"
echo ""
echo "  🌐 App:            http://192.168.66.10:30080"
echo "  🔧 n8n:            http://192.168.66.10:30567"
echo "  📦 MinIO Console:  http://192.168.66.10:30901"
echo ""
kubectl get pods -n elearning
echo ""
kubectl get svc  -n elearning