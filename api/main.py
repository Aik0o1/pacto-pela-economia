from functools import wraps
import os
import json
import couchdb
import datetime
from flask_cors import CORS
from dotenv import load_dotenv
from urllib.parse import quote
from flask import Flask, jsonify, Response, request
import unicodedata

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

load_dotenv()  # take environment variables

# Database connection setup
password = os.getenv("SENHA")
encoded_password = quote(password)
couch = couchdb.Server(f'http://admin:{encoded_password}@{os.getenv("IP")}')

abertas_db_name = "dados_empresariais"
ativas_db_name = "dados_ativas"

# Check if database exists
if abertas_db_name in couch and ativas_db_name in couch:
    db = couch[abertas_db_name]
    db_ativas = couch[ativas_db_name]
    # print(db_ativas)

else:
    print(f"O banco de dados '{abertas_db_name}' não existe.")
    exit()

# Mapeamento de seções de atividades para classificações
MAPEAMENTO_SECOES = {
    "-": "-",
    "COMÉRCIO": "Comércio",
    "ÁGUA, ESGOTO, ATIVIDADES DE GESTÃO DE RESÍDUOS E DESCONTAMINAÇÃO": "Indústria",
    "CONSTRUÇÃO": "Indústria",
    "ELETRICIDADE E GÁS": "Indústria",
    "INDÚSTRIAS DE TRANSFORMAÇÃO": "Indústria",
    "INDÚSTRIAS EXTRATIVAS": "Indústria",
    "ADMINISTRAÇÃO PÚBLICA, DEFESA E SEGURIDADE SOCIAL": "Serviço",
    "AGRICULTURA, PECUÁRIA, PRODUÇÃO FLORESTAL, PESCA E AQÜICULTURA": "Serviço",
    "ALOJAMENTO E ALIMENTAÇÃO": "Serviço",
    "ARTES, CULTURA, ESPORTE E RECREAÇÃO": "Serviço",
    "ATIVIDADES ADMINISTRATIVAS E SERVIÇOS COMPLEMENTARES": "Serviço",
    "ATIVIDADES FINANCEIRAS, DE SEGUROS E SERVIÇOS RELACIONADOS": "Serviço",
    "ATIVIDADES IMOBILIÁRIAS": "Serviço",
    "ATIVIDADES PROFISSIONAIS, CIENTÍFICAS E TÉCNICAS": "Serviço",
    "EDUCAÇÃO": "Serviço",
    "INFORMAÇÃO E COMUNICAÇÃO": "Serviço",
    "OUTRAS ATIVIDADES DE SERVIÇOS": "Serviço",
    "SAÚDE HUMANA E SERVIÇOS SOCIAIS": "Serviço",
    "SERVIÇOS DOMÉSTICOS": "Serviço",
    "TRANSPORTE, ARMAZENAGEM E CORREIO": "Serviço"
}

def mapear_secoes_para_classificacoes(secoes_atividades):
    """
    Agrupa as seções de atividades por suas respectivas classificações.
    Retorna um dicionário onde cada classificação contém suas seções com quantidades.
    """
    if not secoes_atividades or not isinstance(secoes_atividades, dict):
        return {}
    
    classificacoes_agrupadas = {}
    
    for secao, quantidade in secoes_atividades.items():
        classificacao = MAPEAMENTO_SECOES.get(secao, "-")
        
        # Inicializa a classificação se não existir
        if classificacao not in classificacoes_agrupadas:
            classificacoes_agrupadas[classificacao] = {}
        
        # Adiciona a seção dentro da classificação
        classificacoes_agrupadas[classificacao][secao] = quantidade
    
    return classificacoes_agrupadas

def processar_dados_cidade(dados_cidade):
    """
    Processa os dados de uma cidade, adicionando as seções agrupadas por classificação.
    Funciona tanto para 'ativas' quanto para 'abertas'.
    """
    dados_processados = dados_cidade.copy()
    
    # Caso 1: Estrutura com 'ativas' (empresas ativas)
    if 'ativas' in dados_processados and 'secoes_atividades' in dados_processados['ativas']:
        secoes = dados_processados['ativas']['secoes_atividades']
        secoes_agrupadas = mapear_secoes_para_classificacoes(secoes)
        dados_processados['ativas']['secoes_por_classificacao'] = secoes_agrupadas
    
    # Caso 2: Estrutura com 'abertas' (empresas abertas)
    if 'abertas' in dados_processados and 'secoes_atividades' in dados_processados['abertas']:
        secoes = dados_processados['abertas']['secoes_atividades']
        secoes_agrupadas = mapear_secoes_para_classificacoes(secoes)
        dados_processados['abertas']['secoes_por_classificacao'] = secoes_agrupadas
    
    # Caso 3: Para dados que vêm no formato direto
    elif 'secoes_atividades' in dados_processados:
        secoes = dados_processados['secoes_atividades']
        secoes_agrupadas = mapear_secoes_para_classificacoes(secoes)
        dados_processados['secoes_por_classificacao'] = secoes_agrupadas
        
    return dados_processados

def get_cidades_por_regiao(couch_instance, nome_regiao):

    clean_region = nome_regiao.replace("Território:", "").strip()
    print(f"DEBUG get_cidades_por_regiao: clean_region='{clean_region}'")
    
    try:
        # Load the mapping from the local JSON file
        with open('municipios_regioes.json', 'r', encoding='utf-8') as f:
            regioes_data = json.load(f)
            
        # Find all city names that belong to this region
        cidades_da_regiao = []
        for city_name, reg_name in regioes_data.items():
            if reg_name == clean_region:
                cidades_da_regiao.append(city_name)
                
        if not cidades_da_regiao:
            print(f"DEBUG get_cidades_por_regiao: No cities found for '{clean_region}' in JSON")
            return ""
            
        print(f"DEBUG get_cidades_por_regiao: Found {len(cidades_da_regiao)} cities: {cidades_da_regiao}")
        
        # Map city names to IBGE codes using CouchDB
        db_filtros = couch_instance['filtros']
        doc_cidades = db_filtros.get('cidades_piaui')
        
        if not doc_cidades or "cidades" not in doc_cidades:
            return ""
            
        # Build reverse lookup map: normalized_name -> ibge_id
        def normalize_str(text):
            return ''.join(c for c in unicodedata.normalize('NFD', text)
                           if unicodedata.category(c) != 'Mn').lower()
                           
        name_to_id = {}
        for cid_id, cid_data in doc_cidades["cidades"].items():
            name_to_id[normalize_str(cid_data["nome"])] = cid_id
            
        # Match cities and collect IDs
        matched_ids = []
        for city_name in cidades_da_regiao:
            norm_name = normalize_str(city_name)
            if norm_name in name_to_id:
                matched_ids.append(name_to_id[norm_name])
                
        print(f"DEBUG get_cidades_por_regiao: matched_ids list = {matched_ids}")
        return ",".join(matched_ids)
        
    except Exception as e:
        print(f"Erro processando região {nome_regiao}: {e}")
        return ""

def agregar_cidades(doc, cidades_str, tipo_dado):
    """
    Soma os dados de múltiplas cidades e retorna um único dicionário agregado.
    `cidades_str` é uma string com códigos separados por vírgula.
    `tipo_dado` é 'ativas' ou 'abertas'.
    """
    codigos = [c.strip() for c in cidades_str.split(',')]
    
    agregado = {
        "nome": "Território Agregado",
        tipo_dado: {
            "naturezas": {},
            "portes": {},
            "secoes_atividades": {}
        }
    }
    
    for cod in codigos:
        if cod in doc:
            dados = doc[cod]
            if tipo_dado in dados:
                alvo = dados[tipo_dado]
                # Somar naturezas
                if "naturezas" in alvo:
                    for nat, qtd in alvo["naturezas"].items():
                        if qtd:
                            agregado[tipo_dado]["naturezas"][nat] = agregado[tipo_dado]["naturezas"].get(nat, 0) + qtd
                # Somar portes
                if "portes" in alvo:
                    for porte, qtd in alvo["portes"].items():
                        if qtd:
                            agregado[tipo_dado]["portes"][porte] = agregado[tipo_dado]["portes"].get(porte, 0) + qtd
                # Somar seções
                if "secoes_atividades" in alvo:
                    for sec, qtd in alvo["secoes_atividades"].items():
                        if qtd:
                            agregado[tipo_dado]["secoes_atividades"][sec] = agregado[tipo_dado]["secoes_atividades"].get(sec, 0) + qtd
                            
    return agregado

app = Flask(__name__)
CORS(app)

API_TOKEN = os.getenv("API_TOKEN")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Token pode ser passado de 3 formas:
        # 1. Header Authorization: "Bearer <token>"
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Remove "Bearer " do início
            except IndexError:
                token = auth_header  # Caso seja enviado só o token sem "Bearer"
        
        # 2. Header X-API-Token
        elif 'X-API-Token' in request.headers:
            token = request.headers['X-API-Token']
        
        # 3. Query parameter ?token=
        elif 'token' in request.args:
            token = request.args.get('token')
        
        if not token:
            return jsonify({'message': 'Token é obrigatório!'}), 401
        
        # Verifica se o token é válido
        if token != API_TOKEN:
            return jsonify({'message': 'Token inválido!'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

@app.route("/empresas_abertas", methods=["GET"])
@token_required
def buscar_municipios():
    try:
        # Obtém parâmetros da URL
        cidade = request.args.get("cidade")  # Ex: "2211001"
        mes = request.args.get("mes")  # Ex: "12"
        ano = request.args.get("ano")  # Ex: "2024"

        # Validação básica
        if not all([cidade, mes, ano]):
            return (
                jsonify(
                    {"error": "Parâmetros 'cidade', 'mes' e 'ano' são obrigatórios"}
                ),
                400,
            )

        # Acessa o banco de dados
        db_name = "dados_empresariais"
        if db_name not in couch:
            return jsonify({"error": f"Banco de dados '{db_name}' não existe"}), 404

        db = couch[db_name]
        doc_id = f"{mes.zfill(2)}-{ano}"  # Formato "12-2024"

        # Verifica se o documento existe
        if doc_id not in db:
            return jsonify({"error": f"Documento {doc_id} não encontrado"}), 404

        doc = db[doc_id]

        # Converte nome de região para string de IDs separados por vírgula
        if cidade.startswith("Território:"):
            cidades_str = get_cidades_por_regiao(couch, cidade)
            if not cidades_str:
                return jsonify({"error": f"Nenhum município encontrado para {cidade}"}), 404
            cidade = cidades_str

        # Verifica se a cidade existe no documento ou se é uma agregação
        if ',' in cidade:
            dados_cidade = agregar_cidades(doc, cidade, 'abertas')
            dados_processados = processar_dados_cidade(dados_cidade)
        else:
            if cidade not in doc:
                return (
                    jsonify({"error": f"Cidade {cidade} não encontrada no documento"}),
                    404,
                )
            dados_cidade = doc[cidade]
            dados_processados = processar_dados_cidade(dados_cidade)

        # Resposta de sucesso - trata tanto códigos IBGE quanto "total"
        return jsonify({
            "id": doc_id, 
            "municipio": cidade,
            "tipo": "municipio", 
            **dados_processados
        })
    except couchdb.http.Unauthorized:
        return jsonify({"error": "Acesso não autorizado ao CouchDB"}), 401
    except Exception as e:
        # Log do erro real (aparece no terminal onde o Flask está rodando)
        app.logger.error(f"Erro interno: {str(e)}", exc_info=True)
        return jsonify({"error": "Erro interno no servidor"}), 500
    

@app.route("/data_atualizacao", methods=["GET"])
@token_required
def buscar_data_atualizacao():
    try:
        mes = request.args.get("mes")  # Ex: "12"
        ano = request.args.get("ano")  # Ex: "2025"

        if not all([mes, ano]):
            return jsonify({
                "error": "Parâmetros 'mes' e 'ano' são obrigatórios"
            }), 400

        db_name = "dados_ativas"
        if db_name not in couch:
            return jsonify({
                "error": f"Banco de dados '{db_name}' não existe"
            }), 404

        db = couch[db_name]
        doc_id = f"{mes.zfill(2)}-{ano}"

        if doc_id not in db:
            return jsonify({
                "error": f"Documento {doc_id} não encontrado"
            }), 404

        doc = db[doc_id]

        if "dataAtualizacao" not in doc:
            return jsonify({
                "error": "Campo 'dataAtualizacao' não encontrado no documento"
            }), 404

        return jsonify({
            "id": doc_id,
            "dataAtualizacao": doc["dataAtualizacao"]
        })

    except couchdb.http.Unauthorized:
        return jsonify({"error": "Acesso não autorizado ao CouchDB"}), 401
    except Exception as e:
        app.logger.error(f"Erro interno: {str(e)}", exc_info=True)
        return jsonify({"error": "Erro interno no servidor"}), 500
    

@app.route("/empresas_ativas", methods=["GET"])
@token_required
def buscar_empresas_abertas():
    try:
        # Obtém parâmetros da URL
        cidade = request.args.get("cidade")  # Ex: "2211001" ou "total"
        mes = request.args.get("mes")  # Ex: "12"
        ano = request.args.get("ano")  # Ex: "2024"
        
        # Validação básica
        if not all([cidade, mes, ano]):
            return (
                jsonify(
                    {"error": "Parâmetros 'cidade', 'mes' e 'ano' são obrigatórios"}
                ),
                400,
            )
        
        # Acessa o banco de dados
        db_name = "dados_ativas"
        if db_name not in couch:
            return jsonify({"error": f"Banco de dados '{db_name}' não existe"}), 404
        
        db = couch[db_name]
        doc_id = f"{mes.zfill(2)}-{ano}"  # Formato "12-2024"
        
        # Verifica se o documento existe
        if doc_id not in db:
            return jsonify({"error": f"Documento {doc_id} não encontrado"}), 404
        
        doc = db[doc_id]
        
        # Converte nome de região para string de IDs separados por vírgula
        if cidade.startswith("Território:"):
            cidades_str = get_cidades_por_regiao(couch, cidade)
            if not cidades_str:
                return jsonify({"error": f"Nenhum município encontrado para {cidade}"}), 404
            cidade = cidades_str
        
        # Verifica se a cidade existe no documento ou se é uma agregação
        if ',' in cidade:
            dados_cidade = agregar_cidades(doc, cidade, 'ativas')
            dados_processados = processar_dados_cidade(dados_cidade)
        else:
            if cidade not in doc:
                return (
                    jsonify({"error": f"Cidade {cidade} não encontrada no documento"}),
                    404,
                )
            dados_cidade = doc[cidade]
            dados_processados = processar_dados_cidade(dados_cidade)
        
        return jsonify({
            "id": doc_id, 
            "municipio": cidade,
            "tipo": "municipio", 
            **dados_processados
        })
            
    except couchdb.http.Unauthorized:
        return jsonify({"error": "Acesso não autorizado ao CouchDB"}), 401
    except Exception as e:
        # Log do erro real (aparece no terminal onde o Flask está rodando)
        app.logger.error(f"Erro interno: {str(e)}", exc_info=True)
        return jsonify({"error": "Erro interno no servidor"}), 500


@app.route("/id_nome_cidades", methods=["GET"])
@token_required
def get_id_nome_cidades():
    DB_NAME = 'filtros'
    db = couch[DB_NAME]
    DOC_ID = 'cidades_piaui'

    try:
        # Buscar o documento pelo ID
        doc = db.get(DOC_ID)
        
        if not doc:
            return jsonify({"error": "Documento não encontrado"}), 404
        
        # Formatar os dados no formato desejado
        cidades = []
        for cidade_id, cidade_data in doc["cidades"].items():
            if cidade_data["nome"] in ALLOWED_CITIES:
                cidades.append({
                    "id": int(cidade_id),
                    "nome": cidade_data["nome"]
                })
        
        # Retornar como JSON com encoding UTF-8
        return Response(
            json.dumps(cidades, ensure_ascii=False),
            mimetype='application/json; charset=utf-8'
        )
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/data_recente')
@token_required
def rtorna_data_mais_recente():
    try:
        db_name = "dados_empresariais"

        if db_name not in couch:
            return jsonify({"error": f"Banco de dados '{db_name}' não existe"}), 404

        db = couch[db_name]

        # Obtém todos os documentos (apenas os IDs)
        all_docs = db.view('_all_docs', include_docs=False)

        if not all_docs.rows:
            return jsonify({"error": "Nenhum documento encontrado"}), 404

        # Transforma IDs em datas e ordena corretamente
        def id_para_data(doc_id):
            try:
                mes, ano = map(int, doc_id.split('-'))
                return datetime.date(ano, mes, 1)
            except ValueError:
                return None

        datas_validas = [
            (doc_id, id_para_data(doc_id))
            for doc_id in [row.id for row in all_docs.rows]
        ]

        # Filtra somente datas válidas
        datas_validas = [(doc_id, data) for doc_id, data in datas_validas if data]

        # Ordena por data
        datas_ordenadas = sorted(datas_validas, key=lambda x: x[1])

        if not datas_ordenadas:
            return jsonify({"error": "Nenhuma data válida encontrada nos IDs"}), 404

        # Último ID pela data mais recente
        ultimo_id = datas_ordenadas[-1][0]
        mes, ano = ultimo_id.split('-')

        return jsonify({"mes": mes.zfill(2), "ano": ano})

    except Exception as e:
        app.logger.error(f"Erro interno: {str(e)}", exc_info=True)
        return jsonify({"error": "Erro interno no servidor"}), 500

@app.route("/primeiro_ranking", methods=["GET"])
@token_required
def buscar_primeiro_ranking():
    try:
        # Obtém parâmetros da URL
        mes = request.args.get("mes")  # Ex: "12"
        ano = request.args.get("ano")  # Ex: "2024"

        # Validação básica
        if not all([mes, ano]):
            return (
                jsonify(
                    {"error": "Parâmetros 'mes' e 'ano' são obrigatórios"}
                ),
                400,
            )

        # Acessa o banco de dados
        db_name = "dados_empresariais"
        if db_name not in couch:
            return jsonify({"error": f"Banco de dados '{db_name}' não existe"}), 404

        db = couch[db_name]
        doc_id = f"{mes.zfill(2)}-{ano}"  # Formato "12-2024"

        # Verifica se o documento existe
        if doc_id not in db:
            return jsonify({"error": f"Documento {doc_id} não encontrado"}), 404

        doc = db[doc_id]

        # Procura pelo município em primeira posição
        melhor_posicao = float('inf')
        primeiro_municipio = None
        codigo_primeiro = None

        for codigo_municipio, dados_municipio in doc.items():
            # Ignora campos que não são municípios (como "total" ou outros metadados)
            if isinstance(dados_municipio, dict) and "ranking" in dados_municipio and dados_municipio.get("nome") in ALLOWED_CITIES:
                ranking = dados_municipio.get("ranking", {})
                posicao = ranking.get("posicao")
                
                if posicao and posicao < melhor_posicao:
                    melhor_posicao = posicao
                    primeiro_municipio = dados_municipio
                    codigo_primeiro = codigo_municipio

        # Verifica se encontrou o primeiro colocado
        if primeiro_municipio is None:
            return jsonify({
                "error": f"Nenhum município encontrado em primeiro lugar no ranking para {mes}/{ano}"
            }), 404

        # Resposta de sucesso
        return jsonify({
            "id": doc_id,
            "municipio": primeiro_municipio["nome"],
            "tipo": "municipio", 
            **doc[codigo_primeiro]
        })



    except couchdb.http.Unauthorized:
        return jsonify({"error": "Acesso não autorizado ao CouchDB"}), 401
    except Exception as e:
        # Log do erro real (aparece no terminal onde o Flask está rodando)
        app.logger.error(f"Erro interno: {str(e)}", exc_info=True)
        return jsonify({"error": "Erro interno no servidor"}), 500
    

@app.route("/ranking_aberturas", methods=["GET"])
@token_required
def buscar_ranking_completo():
    """
        "portes": {
        "Microempreendedor Individual": 3507,
        "Microempresa": 817,
        "Empresa de pequeno porte": 156,
        "Demais": 46
      },
    """
    mes = request.args.get("mes")
    ano = request.args.get("ano")
    
    db = couch["dados_empresariais"]
    doc_id = f"{mes.zfill(2)}-{ano}"
    doc = db.get(doc_id)

    if not doc:
        return jsonify({"error": "Dados não encontrados"}), 404

    ranking = []
    quantidade_total_piaui = 0

    for chave, valor in doc.items():
        if isinstance(valor, dict) and "nome" in valor and valor["nome"].lower() == "piauí":
            quantidade_total_piaui = sum(valor.get("abertas", {}).get("portes", {}).values())
            continue  

        # Verifica se é um objeto de município válido e se está na lista permitida
        if isinstance(valor, dict) and "nome" in valor and valor["nome"].lower() != "piauí" and valor["nome"] in ALLOWED_CITIES:
            # Soma as aberturas por porte
            quantidade = sum(valor.get("abertas", {}).get("portes", {}).values())
            ranking.append({
                "municipio": valor.get("nome"),
                "codigo": chave,
                "quantidade": quantidade,
                "percentual": round((quantidade / quantidade_total_piaui) * 100, 2) if quantidade_total_piaui > 0 else 0
            })

    # Ordena pela quantidade de aberturas
    ranking_ordenado = sorted(ranking, key=lambda x: x['quantidade'], reverse=True)

    # Adiciona a posição no ranking
    ranking_ordenado = [
        {**item, "posicao": idx + 1} for idx, item in enumerate(ranking_ordenado)
    ]
    
    return jsonify(ranking_ordenado)    

    
@app.route("/ranking_ativas", methods=["GET"])
@token_required
def buscar_ranking_ativas():
    mes = request.args.get("mes")
    ano = request.args.get("ano")
    
    db = couch["dados_ativas"]
    doc_id = f"{mes.zfill(2)}-{ano}"
    doc = db.get(doc_id)

    if not doc:
        return jsonify({"error": "Dados não encontrados"}), 404

    ranking = []
    quantidade_total_piaui = 0

    for chave, valor in doc.items():
        if isinstance(valor, dict) and "nome" in valor and valor["nome"].lower() == "piauí":
            quantidade_total_piaui = sum(valor.get("ativas", {}).get("portes", {}).values())
            continue  

        # Verifica se é um objeto de município válido e está na lista permitida
        if isinstance(valor, dict) and "nome" in valor and valor["nome"].lower() != "piauí" and valor["nome"] in ALLOWED_CITIES:
            # Soma o estoque de ATIVAS
            quantidade = sum(valor.get("ativas", {}).get("portes", {}).values())
            
            ranking.append({
                "municipio": valor.get("nome"),
                "codigo": chave,
                "quantidade": quantidade, 
                "percentual": round((quantidade / quantidade_total_piaui) * 100, 2) if quantidade_total_piaui > 0 else 0
            })

    # Ordena pelo estoque (maior para menor)
    ranking_ordenado = sorted(ranking, key=lambda x: x['quantidade'], reverse=True)
    
    # Adiciona a posição 1º, 2º...
    ranking_final = [{**item, "posicao": idx + 1} for idx, item in enumerate(ranking_ordenado)]
    
    return jsonify(ranking_final)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
