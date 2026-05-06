import httpx
import os
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

# Configurações do CouchDB (Podem ser movidas para variáveis de ambiente)
COUCHDB_URL = os.getenv("COUCHDB_URL", "http://admin:password@localhost:5984")
DB_NAME = os.getenv("DB_NAME", "painel_empresarial")
AUTH = ("admin", os.getenv("SENHA", "password"))

async def setup_indexes():
    """Cria índices para permitir buscas por data e código IBGE."""
    url = f"{COUCHDB_URL}/{DB_NAME}/_index"
    async with httpx.AsyncClient(auth=AUTH) as client:
        try:
            # Índice para buscas por município/estado
            await client.post(url, json={
                "index": {"fields": ["tipo", "codigo_ibge", "ano", "mes"]},
                "name": "idx_busca_estatistica",
                "type": "json"
            })
            # Índice para busca da data mais recente (Filtrado por tipo)
            await client.post(url, json={
                "index": {"fields": ["tipo", "ano", "mes"]},
                "name": "idx_data_recente",
                "type": "json"
            })
        except Exception as e:
            print(f"Erro ao criar índice: {e}")

async def get_db_client():
    async with httpx.AsyncClient(
        auth=AUTH, 
        base_url=f"{COUCHDB_URL}/{DB_NAME}",
        timeout=10.0
    ) as client:
        yield client