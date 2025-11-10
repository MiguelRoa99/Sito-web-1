pipeline {
  agent any
  environment {
    COMPOSE_FILE = 'docker-compose.yml'
    // Proyecto compose sin espacios para nombres de red deterministas
    COMPOSE_PROJECT_NAME = 'aplicacionweb_inventario'
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build images') {
      steps {
        echo "Construyendo imágenes con docker-compose..."
        // Asegurar que no queden contenedores/volúmenes de ejecuciones previas que causen conflictos
  // Usar override específico para CI que elimina el mapeo al host (evita conflictos de puertos)
  sh 'docker-compose -f $COMPOSE_FILE -f docker-compose.ci.yml -p ${COMPOSE_PROJECT_NAME}_${BUILD_NUMBER} down -v || true'
  sh 'docker-compose -f $COMPOSE_FILE -f docker-compose.ci.yml -p ${COMPOSE_PROJECT_NAME}_${BUILD_NUMBER} build'
      }
    }

    stage('Deploy') {
      steps {
        echo "Levantando servicios (docker-compose up -d)..."
        // Usar nombre de proyecto único por build y forzar recreado/remoción de orígenes huérfanos
        // Antes de levantar, intentar liberar el puerto 8080 si está ocupado por contenedores relacionados
        sh '''
          echo "Verificando si hay contenedores publicando el puerto 8080..."
          docker ps --format '{{.ID}} {{.Names}} {{.Ports}}' | grep -E '0.0.0.0:8080' || true
          TO_REMOVE=$(docker ps --filter publish=8080 --format '{{.ID}} {{.Names}}' | awk '$2 ~ /inventario/ {print $1}' || true)
          if [ -n "$TO_REMOVE" ]; then
            echo "Contenedores que ocupan 8080 y contienen 'inventario':"
            docker ps --filter publish=8080 --format '{{.ID}} {{.Names}} {{.Ports}}' | awk '$2 ~ /inventario/ {print $0}'
            echo "$TO_REMOVE" | xargs -r docker rm -f
          else
            echo "No se encontraron contenedores 'inventario' ocupando 8080."
          fi

          docker-compose -f $COMPOSE_FILE -f docker-compose.ci.yml -p ${COMPOSE_PROJECT_NAME}_${BUILD_NUMBER} up -d --force-recreate --remove-orphans
        '''
      }
    }

    stage('Smoke tests') {
      steps {
        echo "Ejecutando smoke tests..."
        sh 'chmod +x scripts/jenkins_smoke_test.sh || true'
        sh './scripts/jenkins_smoke_test.sh'
      }
    }
  }

  post {
    always {
      echo 'Limpiando contenedores (docker-compose down -v)'
      // Limpiar usando el mismo nombre de proyecto único
  sh 'docker-compose -f $COMPOSE_FILE -f docker-compose.ci.yml -p ${COMPOSE_PROJECT_NAME}_${BUILD_NUMBER} down -v || true'
    }
    success {
      echo 'Pipeline completada con éxito.'
    }
    failure {
      echo 'Pipeline falló.'
    }
  }
}
