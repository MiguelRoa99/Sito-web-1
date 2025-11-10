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
        sh 'docker-compose -f $COMPOSE_FILE build'
      }
    }

    stage('Deploy') {
      steps {
        echo "Levantando servicios (docker-compose up -d)..."
        sh '''
# Eliminar cualquier contenedor con nombre fijo que cause conflicto antes de levantar los servicios
if docker ps -a --filter "name=^/inventario_backend$" --format "{{.ID}}" | grep -q . ; then
  echo "Contenedor 'inventario_backend' existe — eliminando..."
  docker rm -f inventario_backend || true
fi

# Levantar servicios y eliminar contenedores huérfanos si los hay
docker-compose -f $COMPOSE_FILE up -d --remove-orphans
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
      sh 'docker-compose -f $COMPOSE_FILE down -v || true'
    }
    success {
      echo 'Pipeline completada con éxito.'
    }
    failure {
      echo 'Pipeline falló.'
    }
  }
}
