from fastapi import FastAPI, HTTPException, Depends, Query, Path, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from typing import Optional, List
import httpx
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from database import get_db_client, setup_indexes
from schemas import EstatisticaBase, RespostaClassificacao, CidadeInfo
from dotenv import load_dotenv

ALLOWED_CITIES = [
    "Betânia do Piauí",
    "Buriti dos Montes",
    "Campo Largo do Piauí",
    "Cocal dos Alves",
    "Coronel José Dias",
    "Cristino Castro",
    "Ipiranga do Piauí",
    "Jerumenha",
    "Monsenhor Gil",
    "São José do Peixe",
    "São José do Piauí",
    "Tanque do Piauí"
]

ALLOWED_CITIES_UPPER = [c.upper() for c in ALLOWED_CITIES]

load_dotenv()

# Configuração de Segurança
API_TOKEN = os.getenv("API_TOKEN", "seu_token_aqui")
security_bearer = HTTPBearer(auto_error=False)

async def verify_token(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
):
    valid_token = None
    if auth:
        valid_token = auth.credentials
        
    if not valid_token or valid_token != API_TOKEN:
        raise HTTPException(status_code=401, detail="Token inválido ou ausente")
    return valid_token

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lógica executada ao iniciar a API
    await setup_indexes()
    yield

app = FastAPI(
    title="API Painel Empresarial v3",
    description="""
    API para consulta de métricas e rankings de empresas (aberturas, ativas e ranking).
    Integrada com CouchDB.
    """,
    version="3.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

from fastapi.middleware.cors import CORSMiddleware

# Configuração de CORS - Deve vir antes de qualquer rota para tratar OPTIONS corretamente
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Removido para evitar conflito com allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import APIRouter

# Criamos um roteador para todos os endpoints protegidos
router = APIRouter(dependencies=[Depends(verify_token)])

@router.get("/id_nome_cidades", response_model=List[CidadeInfo], summary="Listar IDs e Nomes dos Municípios")
async def listar_municipios(client: httpx.AsyncClient = Depends(get_db_client)):
    # Buscamos do banco 'filtros' (mais rápido e organizado)
    async with httpx.AsyncClient(auth=client.auth) as c:
        # Pega a URL do servidor CouchDB (procura até a penúltima barra)
        base_url_str = str(client.base_url).rstrip('/')
        server_url = "/".join(base_url_str.split('/')[:-1])
        url_filtros = f"{server_url}/filtros"
        
        # Query para pegar o estado e todos os municípios
        query = {
            "selector": {
                "type": {"$in": ["estado", "municipio"]}
            },
            "fields": ["cod_ibge", "nome", "type"],
            "limit": 1000
        }
        
        res = await c.post(f"{url_filtros}/_find", json=query)
        if res.status_code != 200:
            raise HTTPException(status_code=404, detail="Erro ao buscar lista de localidades no banco 'filtros'")
        
        docs = res.json().get("docs", [])
        cidades = []
        for doc in docs:
            try:
                nome = doc["nome"]
                cod_ibge = int(doc["cod_ibge"])
                
                # Filtra apenas cidades permitidas ou o estado
                if nome.upper() in ALLOWED_CITIES_UPPER or cod_ibge == 22:
                    cidades.append({
                        "id": cod_ibge, 
                        "nome": nome
                    })
            except (KeyError, ValueError, TypeError):
                continue
        
        # Ordenar: Estado primeiro, depois municípios por nome
        cidades.sort(key=lambda x: (x["id"] != 22, x["nome"]))
        
        return cidades

@router.get("/data_recente", summary="Obter período mais recente disponível")
async def obter_data_recente(client: httpx.AsyncClient = Depends(get_db_client)):
    # Busca o registro mais recente geral (o maior ano/mês entre todos os tipos)
    tipos = ["aberturas", "ativas", "ranking"]
    docs_recentes = []
    
    for t in tipos:
        try:
            doc = await obter_data_recente_por_tipo(t, client)
            docs_recentes.append(doc)
        except HTTPException:
            continue
            
    if not docs_recentes:
        raise HTTPException(status_code=404, detail="Nenhum dado encontrado para determinar a data recente.")
    
    # Ordena pelo maior ano e depois pelo maior mês
    docs_recentes.sort(key=lambda x: (int(x["ano"]), int(x["mes"])), reverse=True)
    
    return docs_recentes[0]

async def obter_data_recente_por_tipo(tipo: Optional[str], client: httpx.AsyncClient):
    # Se um tipo específico foi solicitado, busca apenas para ele
    tipos_para_tentar = [tipo] if tipo else ["aberturas", "ativas", "ranking"]
    
    for t in tipos_para_tentar:
        query = {
            "selector": {
                "tipo": t,
                "ano": {"$gt": None},
                "mes": {"$gt": None}
            },
            "sort": [{"ano": "desc"}, {"mes": "desc"}],
            "limit": 1,
            "fields": ["ano", "mes", "atualizado_em"]
        }
        res = await client.post("/_find", json=query)
        docs = res.json().get("docs", [])
        if docs:
            return docs[0]
            
    raise HTTPException(status_code=404, detail="Nenhum dado encontrado para determinar a data recente.")

@router.get("/ranking/primeiro", summary="Obter o primeiro lugar do ranking")
async def obter_primeiro_ranking(
    ano: Optional[int] = Query(None),
    mes: Optional[int] = Query(None),
    client: httpx.AsyncClient = Depends(get_db_client)
):
    if not ano or not mes:
        recente = await obter_data_recente_por_tipo("ranking", client)
        ano = int(recente["ano"])
        mes = int(recente["mes"])

    mes_str = f"{mes:02d}"
    ano_str = str(ano)

    query = {
        "selector": {
            "tipo": "ranking",
            "ano": ano_str,
            "mes": mes_str,
            "localidade": {"$in": ALLOWED_CITIES},
            "metricas.posicao": {"$gt": 0}
        },
        "sort": [{"metricas.posicao": "asc"}],
        "limit": 1
    }
    res = await client.post("/_find", json=query)
    docs = res.json().get("docs", [])
    
    if not docs:
        raise HTTPException(status_code=404, detail="Nenhum dado de ranking encontrado para este período.")
    
    return docs[0]

@router.get(
    "/classificacao/municipios/{tipo}",
    response_model=RespostaClassificacao,
    summary="Classificação de municípios por participação",
    description="Retorna o ranking de municípios baseado na participação (aberturas ou ativas) em relação ao total do estado, incluindo municípios sem dados (com valor 0)."
)
async def obter_classificacao_municipios(
    tipo: str = Path(..., description="Tipo: 'aberturas' ou 'ativas'", examples=["ativas"]),
    ano: Optional[int] = Query(None, description="Ano (ex: 2026)", examples=[2026]),
    mes: Optional[int] = Query(None, description="Mês (1-12)", examples=[1]),
    client: httpx.AsyncClient = Depends(get_db_client)
):
    # Se ano ou mês não forem fornecidos, busca o mais recente do tipo solicitado
    if not ano or not mes:
        recente = await obter_data_recente_por_tipo(tipo, client)
        ano = int(recente["ano"])
        mes = int(recente["mes"])

    mes_str = f"{mes:02d}"
    ano_str = str(ano)

    # 1. Buscar total do estado (Soma das 12 cidades permitidas)
    query_est = {
        "selector": {
            "tipo": tipo,
            "localidade": {"$in": ALLOWED_CITIES},
            "ano": ano_str,
            "mes": mes_str
        },
        "fields": ["metricas"],
        "limit": 500
    }
    res_est_bulk = await client.post("/_find", json=query_est)
    docs_est = res_est_bulk.json().get("docs", [])
    
    total_estado = 0
    for d in docs_est:
        m = d.get("metricas", {})
        total_estado += m.get("total") or m.get("total_ativas") or 0
    
    if total_estado == 0:
        pass

    # 2. Buscar TODOS os municípios (Lista Mestra) a partir do banco 'filtros' (mais confiável)
    base_url_str = str(client.base_url).rstrip('/')
    server_url = "/".join(base_url_str.split('/')[:-1])
    url_filtros = f"{server_url}/filtros"

    async with httpx.AsyncClient(auth=client.auth) as c:
        query_master = {
            "selector": {"type": "municipio"},
            "fields": ["cod_ibge", "nome"],
            "limit": 1000
        }
        res_master = await c.post(f"{url_filtros}/_find", json=query_master)
        
    municipios_master = {}
    if res_master.status_code == 200:
        for d in res_master.json().get("docs", []):
            # Normaliza o código para string para bater com o banco principal
            municipios_master[str(d["cod_ibge"])] = d["nome"]

    # 3. Buscar dados de municípios para o período específico
    query_periodo = {
        "selector": {
            "tipo": tipo,
            "nivel": "municipio",
            "ano": ano_str,
            "mes": mes_str
        },
        "fields": ["codigo_ibge", "localidade", "metricas"],
        "limit": 500
    }
    res_periodo = await client.post("/_find", json=query_periodo)
    docs_periodo = {d["codigo_ibge"]: d for d in res_periodo.json().get("docs", [])}

    # 4. Mesclar e processar
    itens = []
    for cod_ibge, nome in municipios_master.items():
        if nome.upper() not in ALLOWED_CITIES_UPPER:
            continue
            
        doc = docs_periodo.get(cod_ibge)
        m_total = 0
        if doc:
            m_total = doc.get("metricas", {}).get("total") or doc.get("metricas", {}).get("total_ativas") or 0
        
        percentual = (m_total / total_estado * 100) if total_estado > 0 else 0
        
        itens.append({
            "localidade": nome,
            "codigo_ibge": cod_ibge,
            "total": m_total,
            "percentual": round(percentual, 2)
        })

    # Ordenar por valor decrescente e nome crescente em caso de empate
    itens.sort(key=lambda x: (-x["total"], x["localidade"]))
    
    # Adicionar posição
    for i, item in enumerate(itens):
        item["posicao"] = i + 1

    return {
        "tipo": tipo,
        "ano": ano_str,
        "mes": mes_str,
        "total_estado": total_estado,
        "itens": itens
    }

@router.get(
    "/estatistica/{tipo}/{codigo_ibge}", 
    summary="Obter estatística por localidade",
    description="""
    Busca métricas de empresas para uma localidade específica (Município ou outro Estado).
    - Se `ano` e `mes` não forem fornecidos, retorna o dado mais recente.
    - Se apenas `ano` for fornecido, busca registros daquele ano.
    - Se ambos forem fornecidos, tenta uma busca direta por ID.
    """
)
async def obter_estatistica_localidade(
    tipo: str = Path(..., description="Tipo do dado: 'aberturas', 'ativas' ou 'ranking'", examples=["ativas"]), 
    codigo_ibge: str = Path(..., description="Código IBGE (2 dígitos p/ estado, 7 p/ município)", examples=["2200053"]),
    ano: Optional[int] = Query(None, description="Ano de referência (ex: 2026)", examples=[2026]),
    mes: Optional[int] = Query(None, description="Mês de referência (1-12)", examples=[1]),
    client: httpx.AsyncClient = Depends(get_db_client)
):
    return await buscar_dados_estatistica(tipo, codigo_ibge, ano, mes, client)

from collections import defaultdict

def sumar_metricas(docs):
    if not docs:
        return None
    
    res = {
        "total": 0,
        "portes": defaultdict(int),
        "naturezas": defaultdict(int),
        "setores_economicos": {} 
    }
    
    for doc in docs:
        m = doc.get("metricas")
        if not m or not isinstance(m, dict):
            continue
            
        # Soma total
        res["total"] += m.get("total") or m.get("total_ativas") or 0
        
        for p in (m.get("portes") or []):
            cat = p.get("categoria")
            if cat:
                res["portes"][cat] += p.get("total", 0)
            
        for n in (m.get("naturezas") or []):
            cat = n.get("categoria")
            if cat:
                res["naturezas"][cat] += n.get("total", 0)
            
        for s in (m.get("setores_economicos") or []):
            cat = s.get("categoria") or s.get("setor")
            if not cat: continue
            
            if cat not in res["setores_economicos"]:
                res["setores_economicos"][cat] = {"total": 0, "atividades": defaultdict(int)}
            
            res["setores_economicos"][cat]["total"] += s.get("total", 0)
            for a in (s.get("atividades") or []):
                key = a.get("descricao") or a.get("categoria") or a.get("setor")
                if key:
                    res["setores_economicos"][cat]["atividades"][key] += a.get("total", 0)
    
    # Formatação de tempos (média)
    tempos_medios = {}
    sum_seconds = defaultdict(int)
    counts = defaultdict(int)
    for doc in docs:
        m = doc.get("metricas")
        if not m: continue
        tempos = m.get("tempos")
        if not tempos or not isinstance(tempos, dict): continue
        for k, v in tempos.items():
            if v and ":" in str(v):
                try:
                    parts = str(v).split(":")
                    if len(parts) == 3:
                        h, m, s = map(int, parts)
                        sum_seconds[k] += h * 3600 + m * 60 + s
                        counts[k] += 1
                except: continue
                
    for k, total_sec in sum_seconds.items():
        if counts[k] > 0:
            avg = total_sec // counts[k]
            tempos_medios[k] = f"{avg//3600:02d}:{(avg%3600)//60:02d}:{avg%60:02d}"

    # Transformar de volta para listas
    final_metricas = {
        "total": res["total"],
        "portes": [{"categoria": k, "total": v} for k, v in res["portes"].items()],
        "naturezas": [{"categoria": k, "total": v} for k, v in res["naturezas"].items()],
        "setores_economicos": []
    }
    
    if tempos_medios:
        final_metricas["tempos"] = tempos_medios
    
    for cat, data in res["setores_economicos"].items():
        setor = {
            "categoria": cat,
            "total": data["total"],
            "atividades": [{"categoria": k, "total": v} for k, v in data["atividades"].items()]
        }
        final_metricas["setores_economicos"].append(setor)
        
    return final_metricas

async def buscar_dados_estatistica(tipo, codigo_ibge, ano, mes, client):
    # Se ano ou mês não forem fornecidos, busca o mais recente
    if not ano or not mes:
        recente = await obter_data_recente_por_tipo(tipo, client)
        ano = int(recente["ano"])
        mes = int(recente["mes"])

    # Caso especial: Piauí (Agregação das 12 cidades permitidas)
    if str(codigo_ibge) == "22":
        query = {
            "selector": {
                "tipo": tipo,
                "localidade": {"$in": ALLOWED_CITIES},
                "ano": str(ano),
                "mes": f"{mes:02d}"
            },
            "limit": 500
        }
        res = await client.post("/_find", json=query)
        docs = res.json().get("docs", [])
        
        if not docs:
            raise HTTPException(
                status_code=404, 
                detail=f"Nenhum dado encontrado para as cidades do Pacto em {mes}/{ano}."
            )
            
        metricas_agregadas = sumar_metricas(docs)
        
        return {
            "_id": f"{tipo}:22:{mes:02d}-{ano}",
            "tipo": tipo,
            "nivel": "estado",
            "codigo_ibge": "22",
            "localidade": "Piauí (Pacto)",
            "ano": str(ano),
            "mes": f"{mes:02d}",
            "metricas": {
                **metricas_agregadas,
                "total_ativas": metricas_agregadas["total"]
            },
            "atualizado_em": docs[0].get("atualizado_em")
        }

    # Trata Território (Agregação On-the-fly)
    if str(codigo_ibge).startswith("territorio:"):
        territorio_nome = str(codigo_ibge).replace("territorio:", "").strip()
        
        # Busca todos os municípios do território para o período
        query = {
            "selector": {
                "tipo": tipo,
                "territorio": territorio_nome,
                "localidade": {"$in": ALLOWED_CITIES},
                "ano": str(ano),
                "mes": f"{mes:02d}"
            },
            "limit": 500
        }
        res = await client.post("/_find", json=query)
        docs = res.json().get("docs", [])
        
        if not docs:
            raise HTTPException(
                status_code=404, 
                detail=f"Nenhum dado encontrado para o território '{territorio_nome}' em {mes}/{ano}."
            )
            
        # Agrega as métricas
        metricas_agregadas = sumar_metricas(docs)
        
        return {
            "_id": f"{tipo}:{codigo_ibge}:{mes:02d}-{ano}",
            "tipo": tipo,
            "nivel": "territorio",
            "codigo_ibge": codigo_ibge,
            "localidade": territorio_nome,
            "ano": str(ano),
            "mes": f"{mes:02d}",
            "metricas": {
                **metricas_agregadas,
                "total_ativas": metricas_agregadas["total"] # Aliasing for schema
            },
            "atualizado_em": docs[0].get("atualizado_em")
        }

    # 1. Busca direta por ID se ano e mês forem passados
    # Formato no banco: tipo:codigo_ibge:MM-YYYY (ex: aberturas:2200053:01-2026)
    if ano and mes:
        periodo_id = f"{mes:02d}-{ano}"
        doc_id = f"{tipo}:{codigo_ibge}:{periodo_id}"
        
        response = await client.get(f"/{doc_id}")
        if response.status_code == 200:
            return response.json()

    # 2. Busca via Mango Query (para o mais recente ou filtros parciais)
    selector = {
        "tipo": tipo,
        "codigo_ibge": str(codigo_ibge)
    }
    
    if ano:
        selector["ano"] = str(ano)
    if mes:
        selector["mes"] = f"{mes:02d}"
    
    query = {
        "selector": selector,
        "sort": [{"ano": "desc"}, {"mes": "desc"}],
        "limit": 1
    }
    
    res = await client.post("/_find", json=query)
    docs = res.json().get("docs", [])
    
    if not docs:
        raise HTTPException(
            status_code=404, 
            detail=f"Nenhum dado de '{tipo}' encontrado para {codigo_ibge} no período solicitado."
        )
        
    return docs[0]

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5051)