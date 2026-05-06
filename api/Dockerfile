# Usando uma imagem leve e estável do Python
FROM python:3.9-slim

# Evita que o Python gere arquivos .pyc e permite logs em tempo real
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Definindo o diretório de trabalho
WORKDIR /app

# Copiando apenas o arquivo de dependências primeiro (otimiza cache do Docker)
COPY requirements.txt .

# Instalando as dependências do Python
# --no-cache-dir reduz drasticamente o tamanho da imagem final
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiando o restante do código da API (respeitando o .dockerignore)
COPY . .

# Porta que a API escuta
EXPOSE 5051

# Comando para produção usando Gunicorn com worker Uvicorn (Obrigatório para FastAPI)
CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:5051"]