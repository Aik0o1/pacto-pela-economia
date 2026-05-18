# Usando uma imagem leve e estável do Python
FROM python:3.9-slim

# Definindo o diretório de trabalho
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates bash \
    && curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash \
    && apt-get install -y infisical \
    && rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 5051

# Comando para produção usando Gunicorn com worker Uvicorn (Obrigatório para FastAPI)
CMD ["sh", "-c", "\
  export INFISICAL_TOKEN=$(infisical login \
    --method=universal-auth \
    --client-id=\"$INFISICAL_CLIENT_ID\" \
    --client-secret=\"$INFISICAL_CLIENT_SECRET\" \
    --plain --silent \
    --domain=\"$INFISICAL_HOST\") && \
  exec infisical run \
    --token \"$INFISICAL_TOKEN\" \
    --projectId \"$INFISICAL_PROJECT_ID\" \
    --env=prod \
    --domain=\"$INFISICAL_HOST\" \
    -- gunicorn --bind 0.0.0.0:5051 main:app"]