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

# Determinar nombre de red: preferir COMPOSE_PROJECT_NAME si está definido, sino inspeccionar el contenedor frontend
NETWORK=""
if [ -n "${COMPOSE_PROJECT_NAME:-}" ]; then
  NETWORK="${COMPOSE_PROJECT_NAME}_default"
  echo "Usando red a partir de COMPOSE_PROJECT_NAME: ${NETWORK}"
fi

if [ -z "$NETWORK" ]; then
  if docker inspect inventario_frontend > /dev/null 2>&1; then
    NETWORK=$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' inventario_frontend || true)
    echo "Red determinada inspeccionando inventario_frontend: ${NETWORK}"
  fi
fi

if [ -z "$NETWORK" ]; then
  echo "No pude determinar la red Docker del proyecto. Asegúrate de ejecutar este script en la misma máquina donde corren los contenedores o define FRONTEND_URL/BACKEND_HEALTH para apuntar a las URL correctas."
  exit 2
fi

echo "Usando imagen de prueba de curl para acceder a la red '${NETWORK}'"

# comprobar frontend por nombre de servicio
if ! docker run --rm --network "$NETWORK" curlimages/curl:8.1.2 -sSf -o /dev/null http://inventario_frontend:80; then
  echo "ERROR: No se pudo conectar al frontend desde la red Docker (${NETWORK}) usando inventario_frontend:80"
  exit 3
fi

# comprobar backend por nombre de servicio
if ! docker run --rm --network "$NETWORK" curlimages/curl:8.1.2 -sSf -o /dev/null http://inventario_backend:3000/_health; then
  echo "ERROR: No se pudo conectar al backend desde la red Docker (${NETWORK}) usando inventario_backend:3000/_health"
  exit 4
fi

echo "Smoke tests OK (acceso desde red Docker interna)"
