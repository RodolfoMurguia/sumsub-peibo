# Sumsub Onboarding Service

Servicio de reinterpretación de onboarding con arquitectura MVC usando Node.js 24.

## Características

- Node.js 24
- Arquitectura MVC (Model-View-Controller)
- Health endpoint para monitoreo
- Docker y Docker Compose
- Express.js framework
- Documentación de API con Swagger UI

## Estructura del Proyecto

```
sumsub-peibo/
├── src/
│   ├── config/
│   │   └── swagger.js
│   ├── controllers/
│   │   ├── healthController.js
│   │   ├── webhookController.js
│   │   └── documentsController.js
│   ├── routes/
│   │   ├── healthRoutes.js
│   │   ├── webhookRoutes.js
│   │   └── documentsRoutes.js
│   ├── middleware/
│   ├── app.js
│   └── server.js
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## Requisitos

- Node.js 24 o superior (para desarrollo local)
- Docker y Docker Compose (para contenedores)

## Instalación y Uso

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en modo producción
npm start
```

### Docker

```bash
# Construir y ejecutar con Docker Compose
npm run docker:up

# O usando comandos de Docker Compose directamente
docker-compose up --build

# Detener los contenedores
npm run docker:down
# o
docker-compose down
```

## Documentación de la API

Una vez que el servidor esté corriendo, accede a la documentación interactiva de Swagger:

```
http://localhost:3000/api-docs
```

Desde Swagger UI puedes:
- Ver todos los endpoints disponibles
- Probar los endpoints directamente desde el navegador
- Ver los esquemas de datos de entrada y salida
- Ver ejemplos de respuestas

## Endpoints

### API Documentation (Swagger UI)
- **GET** `/api-docs`
  - Descripción: Documentación interactiva de la API con Swagger UI
  - Permite probar todos los endpoints directamente desde el navegador
  - Incluye esquemas de datos y ejemplos de respuestas

### Root
- **GET** `/`
  - Descripción: Información básica del servicio
  - Respuesta: JSON con información del servicio y endpoints disponibles

### Health Check
- **GET** `/health`
  - Descripción: Verifica el estado de salud del servicio
  - Respuesta de ejemplo:
    ```json
    {
      "status": "OK",
      "timestamp": "2025-11-18T03:45:00.000Z",
      "uptime": 123.456,
      "service": "sumsub-onboarding-service",
      "version": "1.0.0",
      "environment": "development"
    }
    ```

### Webhook - Results
- **POST** `/results`
  - Descripción: Endpoint webhook para recibir resultados del sistema de onboarding
  - Tipo: Webhook
  - Respuesta de ejemplo:
    ```json
    {
      "success": true,
      "message": "Webhook received successfully",
      "timestamp": "2025-11-18T03:45:00.000Z"
    }
    ```

### Documents
- **GET** `/documents`
  - Descripción: Obtiene información de muestra sobre documentos procesados
  - Respuesta de ejemplo:
    ```json
    {
      "success": true,
      "data": {
        "documentId": "doc_12345abcde",
        "type": "passport",
        "status": "verified",
        "uploadedAt": "2025-11-18T03:45:00.000Z",
        "metadata": {
          "country": "US",
          "expiryDate": "2030-12-31"
        }
      },
      "timestamp": "2025-11-18T03:45:00.000Z"
    }
    ```

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor | `3000` |
| `HOST` | Host del servidor | `0.0.0.0` |
| `NODE_ENV` | Entorno de ejecución | `development` |

## Health Check

El servicio incluye un health check automático en Docker que verifica cada 30 segundos que el servicio esté respondiendo correctamente.

## Próximos Pasos

Este es el boilerplate inicial. Puedes extenderlo agregando:

- Modelos de datos
- Más controladores y rutas
- Integración con bases de datos
- Autenticación y autorización
- Validación de datos
- Tests unitarios e integración
- Logging avanzado
- Métricas y monitoreo

## Licencia

ISC
