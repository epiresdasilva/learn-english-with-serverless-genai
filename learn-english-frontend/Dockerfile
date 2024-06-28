# Estágio 1: Construir o aplicativo Angular
FROM node:18-alpine as build-stage

WORKDIR /app

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli

# Copiar os arquivos de configuração
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante dos arquivos do projeto
COPY . .

# # Construir o aplicativo Angular
RUN ng build

# Estágio 2: Servir o aplicativo construído
FROM nginx:alpine as production-stage

COPY --from=build-stage /app/dist/learn-english-frontend-app/* /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
