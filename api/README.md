# API Painel Empresarial v3

API desenvolvida em FastAPI para consulta de estatísticas (aberturas, ativas) e rankings empresariais do estado do Piauí.

## 🚀 Como Rodar

### Modo Local (Desenvolvimento)

1. **Requisitos:** Python 3.9+
2. **Ambiente:**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. **Execução:**
   ```bash
   python main.py
   ```

A API estará em `http://localhost:8003`.

### Modo Docker (Produção/Staging)

A API é orquestrada via Docker Compose na raiz do projeto.

- **Porta Externa:** `5051`
- **Porta Interna:** `8003`

## 📚 Documentação (Swagger)

- **Endpoint:** `/docs`
- **URL Docker:** [http://localhost:5051/docs](http://localhost:5050/docs)

## ⚙️ Configuração (.env)

O arquivo `api/.env` deve conter:

- `SENHA`: Senha do CouchDB.
- `COUCHDB_URL`: URL completa (ex: `http://admin:senha@ip:5984`).
- `API_TOKEN`: Token para autenticação (Bearer) nos endpoints protegidos.

## 🛠 Estrutura

- `main.py`: Endpoints e lógica principal.
- `database.py`: Conexão com CouchDB e carregamento de variáveis (`python-dotenv`).
- `schemas.py`: Modelos Pydantic para validação.
