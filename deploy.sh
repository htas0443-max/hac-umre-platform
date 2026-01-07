#!/bin/bash
# Hajj & Umrah Platform - Kubernetes Deployment Script
# Usage: ./deploy.sh [apply|delete]

set -e

NAMESPACE="hajj-umrah"
ACTION=${1:-apply}

echo "========================================"
echo "Hajj & Umrah Platform - K8s Deployment"
echo "Action: $ACTION"
echo "========================================"

# Create namespace first
echo "1. Deploying namespace..."
kubectl $ACTION -f k8s/namespace.yaml

# Deploy secrets (must be created manually with actual values first)
echo "2. Checking secrets..."
if [ "$ACTION" = "apply" ]; then
    if ! kubectl get secret hajj-secrets -n $NAMESPACE > /dev/null 2>&1; then
        echo "WARNING: Secrets not found. Please create them first:"
        echo "kubectl create secret generic hajj-secrets -n $NAMESPACE \\"
        echo "  --from-literal=supabase-url=YOUR_URL \\"
        echo "  --from-literal=supabase-anon-key=YOUR_KEY \\"
        echo "  --from-literal=supabase-service-role-key=YOUR_KEY \\"
        echo "  --from-literal=emergent-llm-key=YOUR_KEY \\"
        echo "  --from-literal=redis-url=redis://redis-service:6379 \\"
        echo "  --from-literal=grafana-password=YOUR_PASSWORD"
        exit 1
    fi
fi

# Deploy Redis
echo "3. Deploying Redis..."
kubectl $ACTION -f k8s/redis.yaml

# Deploy Backend
echo "4. Deploying Backend..."
kubectl $ACTION -f k8s/backend-deployment.yaml

# Deploy Frontend
echo "5. Deploying Frontend..."
kubectl $ACTION -f k8s/frontend-deployment.yaml

# Deploy Ingress
echo "6. Deploying Ingress..."
kubectl $ACTION -f k8s/ingress.yaml

# Deploy Prometheus
echo "7. Deploying Prometheus..."
kubectl $ACTION -f k8s/prometheus.yaml

# Deploy Grafana
echo "8. Deploying Grafana..."
kubectl $ACTION -f k8s/grafana.yaml

echo "========================================"
echo "Deployment complete!"
echo ""
echo "To check status:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl get hpa -n $NAMESPACE"
echo ""
echo "To access Grafana:"
echo "  kubectl port-forward svc/grafana-service 3000:3000 -n $NAMESPACE"
echo "========================================"
