#!/usr/bin/env bash
set -euo pipefail

FRONTEND_URL=${FRONTEND_URL:-http://localhost:8080}
BACKEND_HEALTH=${BACKEND_HEALTH:-http://localhost:3000/_health}
COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-aplicacionweb_inventario}
RETRIES=10
SLEEP=3

echo "Esperando servicios (retries: $RETRIES, sleep: $SLEEPs)..."

# espera por frontend host (si está publicado)
for i in $(seq 1 $RETRIES); do
  if curl -sSf -o /dev/null "$FRONTEND_URL"; then
    echo "Frontend accesible en $FRONTEND_URL"
    break
  fi
  echo "Intento $i/$RETRIES - frontend no disponible aún"
  sleep $SLEEP
  if [ "$i" -eq "$RETRIES" ]; then
    echo "Frontend no accesible por host; seguiremos intentando desde la red docker interna"
  fi
done

# Determinar red de compose
NETWORK="${COMPOSE_PROJECT_NAME}_default"
echo "Usando red: $NETWORK"

# Test desde contenedor curl en la red interna, con reintentos
for i in $(seq 1 $RETRIES); do
  if docker run --rm --network "$NETWORK" curlimages/curl:8.1.2 -sSf -o /dev/null "http://inventario_frontend:80"; then
    echo "Frontend OK en red interna"
    break
  fi
  echo "Intento $i/$RETRIES - frontend en red interna no responde"
  sleep $SLEEP
  if [ "$i" -eq "$RETRIES" ]; then
    echo "ERROR: frontend inaccesible en red Docker ($NETWORK)"
    exit 3
  fi
done

for i in $(seq 1 $RETRIES); do
  if docker run --rm --network "$NETWORK" curlimages/curl:8.1.2 -sSf -o /dev/null "http://inventario_backend:3000/_health"; then
    echo "Backend OK en red interna"
    break
  fi
  echo "Intento $i/$RETRIES - backend en red interna no responde"
  sleep $SLEEP
  if [ "$i" -eq "$RETRIES" ]; then
    echo "ERROR: backend inaccesible en red Docker ($NETWORK)"
    exit 4
  fi
done

echo "Smoke tests OK"
exit 0
