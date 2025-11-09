# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY server.js ./
# Mantener data.json fuera del contenedor con volumen en docker-compose
EXPOSE 3000
CMD ["node", "server.js"]
