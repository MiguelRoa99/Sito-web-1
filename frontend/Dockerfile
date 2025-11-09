# frontend/Dockerfile
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY app.js /usr/share/nginx/html/app.js
# si tienes más ficheros estáticos agrégalos aquí
EXPOSE 80
