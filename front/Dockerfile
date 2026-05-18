# Etapa 1: Construção da aplicação
FROM node:18-alpine AS builder
WORKDIR /home/app

RUN apk add --no-cache bash wget && \
    wget -qO- 'https://artifacts-cli.infisical.com/setup.apk.sh' | sh && \
    apk update && apk add infisical

COPY package.json package-lock.json ./
RUN npm install
COPY . .

ARG INFISICAL_CLIENT_ID
ARG INFISICAL_CLIENT_SECRET
ARG INFISICAL_PROJECT_ID
ARG INFISICAL_HOST

RUN export INFISICAL_TOKEN=$(infisical login \
      --method=universal-auth \
      --client-id="$INFISICAL_CLIENT_ID" \
      --client-secret="$INFISICAL_CLIENT_SECRET" \
      --plain --silent \
      --domain="$INFISICAL_HOST") && \
    infisical run \
      --token "$INFISICAL_TOKEN" \
      --projectId "$INFISICAL_PROJECT_ID" \
      --env=prod \
      --domain="$INFISICAL_HOST" \
      -- npm run build

# Etapa 2: Servindo a aplicação com Nginx
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf 
COPY --from=builder /home/app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
