#!/usr/bin/env bash
set -euo pipefail

echo "Esperando 5 segundos para que los servicios arranquen..."
sleep 5

FRONTEND_URL=${FRONTEND_URL:-http://localhost:8080}
BACKEND_HEALTH=${BACKEND_HEALTH:-http://localhost:3000/_health}

echo "Comprobando frontend en ${FRONTEND_URL}..."
if curl -sSf -o /dev/null "${FRONTEND_URL}" && curl -sSf -o /dev/null "${BACKEND_HEALTH}"; then
  echo "Smoke tests OK (acceso por localhost)"
  exit 0
fi

echo "Acceso por localhost falló; intentaremos comprobar los contenedores desde la red Docker interna."

# Determinar nombre de red: si COMPOSE_PROJECT_NAME y BUILD_NUMBER están definidas,
# el prefijo del proyecto en Jenkinsfile es: ${COMPOSE_PROJECT_NAME}_${BUILD_NUMBER}
NETWORK=""
if [ -n "${COMPOSE_PROJECT_NAME:-}" ] && [ -n "${BUILD_NUMBER:-}" ]; then
  NETWORK="${COMPOSE_PROJECT_NAME}_${BUILD_NUMBER}_default"
  echo "Usando red a partir de COMPOSE_PROJECT_NAME y BUILD_NUMBER: ${NETWORK}"
else
  # Intentar detectar una red _default disponible y usar la primera que encontremos
  NETWORK=$(docker network ls --filter name=_default --format '{{.Name}}' | head -n 1 || true)
  if [ -n "$NETWORK" ]; then
    echo "Red detectada automáticamente: ${NETWORK}"
  fi
fi

if [ -z "$NETWORK" ]; then
  echo "No pude determinar la red Docker del proyecto. Define FRONTEND_URL/BACKEND_HEALTH o exporta COMPOSE_PROJECT_NAME y BUILD_NUMBER."
  exit 2
fi

echo "Usando imagen de prueba de curl para acceder a la red '${NETWORK}'"

# Dentro de la red Docker, los servicios se resuelven por su nombre de servicio: 'frontend' y 'backend'
if ! docker run --rm --network "$NETWORK" curlimages/curl:8.1.2 -sSf -o /dev/null http://frontend:80; then
  echo "ERROR: No se pudo conectar al frontend desde la red Docker (${NETWORK}) usando frontend:80"
  exit 3
fi

if ! docker run --rm --network "$NETWORK" curlimages/curl:8.1.2 -sSf -o /dev/null http://backend:3000/_health; then
  echo "ERROR: No se pudo conectar al backend desde la red Docker (${NETWORK}) usando backend:3000/_health"
  exit 4
fi

echo "Smoke tests OK (acceso desde red Docker interna)"
