// Jenkinsfile (mejorado: detección de docker-compose / docker compose, checks, timeout)
pipeline {
  agent any
  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
  }

  environment {
    COMPOSE_FILE = 'docker-compose.yml'
    COMPOSE_PROJECT_NAME = 'aplicacionweb_inventario'
    // DC (docker compose command) se establecerá en tiempo de ejecución
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Verify Docker available') {
      steps {
        sh label: 'Check docker', script: '''
          set -euo pipefail
          echo "Comprobando docker..."
          if ! command -v docker >/dev/null 2>&1; then
            echo "ERROR: docker no está instalado o no está en PATH"
            exit 2
          fi
          echo "Docker version:"
          docker --version || true
          echo "Comprobando acceso al daemon Docker (docker info)..."
          if docker info >/dev/null 2>&1; then
            echo "Docker daemon accesible"
          else
            echo "ADVERTENCIA: docker daemon no accesible (verifica permisos / socket)"
          fi
        '''
      }
    }

    stage('Detect compose CLI') {
      steps {
        script {
          // Detectar docker-compose (v1) o 'docker compose' (v2)
          def hasDockerCompose = sh(returnStatus: true, script: 'command -v docker-compose >/dev/null 2>&1') == 0
          def hasDockerSpaceCompose = sh(returnStatus: true, script: 'docker compose version >/dev/null 2>&1') == 0
          if (hasDockerCompose) {
            env.DC = 'docker-compose'
          } else if (hasDockerSpaceCompose) {
            env.DC = 'docker compose'
          } else {
            error("Ni 'docker-compose' ni 'docker compose' están disponibles en el agente. Instala uno de ellos.")
          }
          echo "Usando comando de compose: ${env.DC}"
        }
      }
    }

    stage('Build images') {
      steps {
        sh label: 'docker-compose build', script: """
          set -euo pipefail
          echo "Construyendo imágenes con: ${env.DC}"
          ${env.DC} -f ${env.COMPOSE_FILE} --project-name ${env.COMPOSE_PROJECT_NAME} build --no-cache
        """
      }
    }

    stage('Deploy') {
      steps {
        sh label: 'docker-compose up', script: """
          set -euo pipefail
          echo "Levantando servicios: ${env.DC} up -d"
          ${env.DC} -f ${env.COMPOSE_FILE} --project-name ${env.COMPOSE_PROJECT_NAME} up -d --remove-orphans
        """
      }
    }

    stage('Smoke tests') {
      steps {
        // Hacer ejecutable el script y ejecutarlo
        sh 'chmod +x scripts/jenkins_smoke_test.sh || true'
        sh './scripts/jenkins_smoke_test.sh'
      }
    }
  }

  post {
    always {
      echo 'Post: limpieza de recursos (docker-compose down -v)'
      // intentar bajar el stack limpiando volúmenes; no falle el post si algo va mal
      sh label: 'docker-compose down', script: """
        set +e
        if [ -n "${DC:-}" ]; then
          ${DC} -f ${COMPOSE_FILE} --project-name ${COMPOSE_PROJECT_NAME} down -v --remove-orphans || true
        else
          # si por alguna razón DC no está definido (muy raro) intentamos con docker-compose y docker compose para limpiar
          command -v docker-compose >/dev/null 2>&1 && docker-compose -f ${COMPOSE_FILE} --project-name ${COMPOSE_PROJECT_NAME} down -v --remove-orphans || true
          docker compose -f ${COMPOSE_FILE} --project-name ${COMPOSE_PROJECT_NAME} down -v --remove-orphans || true
        fi
      """
    }
    success {
      echo 'Pipeline completada con éxito.'
    }
    failure {
      echo 'Pipeline falló.'
    }
  }
}
