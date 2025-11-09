# Aplicacion web de Inventario
 
|                      Titulo                     |                                                             Contenido                                                                                  |
|-------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Aplicación Web de Inventario Contenerizada**  | Descripción concisa del propósito del proyecto (Ej: Un sistema modular para la gestión de inventario, implementado con arquitectura de microservicios).|
| **Tecnologías Clave**                           | Listado de las herramientas principales: Node.js, Nginx, Docker, Docker Compose.                                                                       |


# Arquitectura del proyecto

|   Servicio   |          Rol        | Puerto interno | Puerto host  |                         Descripción                          |
|--------------|---------------------|----------------|--------------|--------------------------------------------------------------|
| **backend**  | API Node.js/Express |     3000       |      —       | Gestiona los datos y operaciones CRUD sobre el inventario    |
| **frontend** | Servidor Nginx      |      80        |     8080     | Muestra la interfaz web y comunica las peticiones al backend |

# Estructura del proyecto
Aplicación web-inventario/
├── backend/: ├── Dockerfile ├── package.json ├── server.js├── data.json
├── frontend/: ├── Dockerfile ├── nginx.conf ├── index.html ├── styles.css ├── app.js
└── docker-compose.yml

#Configuración (Prerrequisitos)
## ⚙️ Configuración y Prerrequisitos
Para ejecutar este proyecto, necesitas tener instalados los siguientes programas en tu sistema:
* **[Git](https://git-scm.com/):** Para clonar el repositorio.
* **[Docker](https://www.docker.com/get-started):** Versión 20.10 o superior.
* **[Docker Compose](https://docs.docker.com/compose/install/):** Versión 1.29 o superior.
* **[WSL 2 habilitado] (si estás en Windows 10/11)
* **[Conexión a internet] (solo la primera vez que descargue las imágenes)

Sigue estos pasos para poner en marcha la aplicación:
1.  **Clonar el Repositorio:**
    ```bash
    git clone [https://github.com/AndreyFCB1001/AplicacionwebInventarioDoker.git](https://github.com/AndreyFCB1001/AplicacionwebInventarioDoker.git)
    cd AplicacionwebInventarioDoker
    ```

2.  **Construir y Ejecutar Contenedores:**
    Utiliza Docker Compose para construir las imágenes (`backend` y `frontend`) y levantar los servicios.

    ```bash
    docker-compose up --build -d
    # --build: asegura que las imágenes Docker se reconstruyan con el código más reciente.
    # -d: ejecuta los contenedores en modo 'detached' (segundo plano).
    ```

3.  **Acceder a la Aplicación:**
    Una vez que los contenedores estén activos (puede tomar unos segundos):
    * **Frontend (UI):** Abre tu navegador y navega a `http://localhost:[PUERTO_FRONTEND]`.
    * **Backend (API):** La API estará accesible internamente en `http://backend:[PUERTO_BACKEND]`.
    > **NOTA:** Reemplaza `[PUERTO_FRONTEND]` y `[PUERTO_BACKEND]` con los puertos definidos en tu `docker-compose.yml`.
    > En nuestro caso accedemos a "http://localhost:8080" para visualizar la api.

4. Estructura de Servicios (Detalle Técnico)
	## 🗺️ Estructura del Proyecto
El proyecto está dividido en dos servicios principales gestionados por Docker Compose:
* **`backend/` (Servicio API):**
    * **Tecnología:** Node.js (Express).
    * **Propósito:** Lógica de negocio, gestión de la persistencia de datos y exposición de la API REST.
* **`frontend/` (Servicio UI):**
    * **Tecnología:** HTML, CSS, JavaScript (servido por Nginx).
    * **Propósito:** Interfaz de usuario, consume los endpoints del servicio `backend`.
 
5. Contribuciones y Contacto
## 🤝 Contribuciones
Las contribuciones son bienvenidas. Por favor, abre un 'issue' o envía un 'pull request' para sugerir mejoras o reportar errores.
## ✉️ Contacto
* **Autores:** [Julian David Romero Hernandez / Jhoan Prieto Sanchez / Jeisson Camilo Lopez Bello / Miguel Ángel Roa Pinzón / Andrey Suarez Suarez]
* **Email:** [Janprietos@poligran.edu.co / mangroa@poligran.edu.co / jdavidromero@poligran.edu.co / jcamilolopez3@poligran.edu.co /  astsuarez@poligran.edu.co]
* **Subgrupo:**[6].


## Integración con Jenkins (CI/CD)

Se incluye un `Jenkinsfile` en la raíz del repositorio para ejecutar una pipeline básica que construye las imágenes Docker, levanta los servicios con `docker-compose`, ejecuta pruebas de verificación (smoke tests) y limpia los recursos.

Requisitos del executor/agent de Jenkins:
- Un agente Jenkins con Docker y Docker Compose instalados y acceso al daemon Docker (usualmente un agente Linux).
- Permisos para ejecutar `docker` y `docker-compose`.

Resumen de la pipeline (`Jenkinsfile`):
- checkout
- build: `docker-compose build`
- deploy: `docker-compose up -d`
- smoke-test: ejecuta `scripts/jenkins_smoke_test.sh` (hace curl a frontend y backend)
- cleanup: `docker-compose down -v`

Notas importantes:
- El `Jenkinsfile` asume que Jenkins ejecuta los pasos en un agente Linux con Docker. Si tu servidor Jenkins corre en Windows, debes usar un agent que soporte Docker (por ejemplo WSL2) o adaptar los pasos usando `bat` en lugar de `sh`.
- La pipeline devolverá error si el smoke-test falla (código de salida distinto de 0).

Cómo usar:
1. Asegúrate de que tu agente Jenkins tenga Docker y Docker Compose instalados y que el usuario de Jenkins pueda ejecutar comandos Docker.
2. Crea un nuevo Job de tipo Pipeline o Multibranch Pipeline y configura el repositorio para que lea el `Jenkinsfile` en la raíz.
3. Ejecuta el job. Jenkins construirá y desplegará los contenedores en el agente y ejecutará las comprobaciones.

Archivo de prueba de smoke-tests: `scripts/jenkins_smoke_test.sh` (incluido) — revisa y adapta URLs/puertos si los cambias en `docker-compose.yml`.

Si quieres que amplíe la pipeline (p.ej. publicar imágenes en un registry, ejecutar tests unitarios, o desplegar en un entorno remoto), dime qué sistemas usas (Docker Hub, GitHub Packages, Kubernetes, etc.) y lo incorporo.







