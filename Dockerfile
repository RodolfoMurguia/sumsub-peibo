# Usa Node.js 24 como imagen base
FROM node:24-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install --only=production

# Copia el código fuente
COPY src/ ./src/

# Expone el puerto
EXPOSE 3000

# Crea un usuario no-root para ejecutar la aplicación
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambia al usuario no-root
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Comando para iniciar la aplicación
CMD ["npm", "start"]
