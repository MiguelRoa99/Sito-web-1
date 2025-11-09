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
        sh 'docker-compose -f $COMPOSE_FILE up -d'
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
