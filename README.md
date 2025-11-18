# Sumsub Onboarding Service

Servicio de reinterpretación de onboarding con arquitectura MVC usando Node.js 24.

## Características

- Node.js 24
- Arquitectura MVC (Model-View-Controller)
- Health endpoint para monitoreo
- Docker y Docker Compose
- Express.js framework

## Estructura del Proyecto

```
sumsub-peibo/
├── src/
│   ├── controllers/
│   │   └── healthController.js
│   ├── routes/
│   │   └── healthRoutes.js
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

## Endpoints

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
