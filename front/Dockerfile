# Etapa 1: Construção da aplicação
FROM node:18-alpine AS builder

# Definindo o diretório de trabalho no contêiner
WORKDIR /home/app

# Copiando apenas os arquivos necessários
COPY package.json package-lock.json ./

# Instalando dependências
RUN npm install

# Copiando os arquivos restantes
COPY . .

# Construindo a aplicação
RUN npm run build

# Etapa 2: Servindo a aplicação com Nginx
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf 


# Copiando os arquivos de build para o Nginx
COPY --from=builder /home/app/dist /usr/share/nginx/html

# Expondo a porta do servidor
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
