from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Union, Any

class CidadeInfo(BaseModel):
    id: int
    nome: str

class ItemMetrica(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    categoria: str = Field(..., description="Nome da categoria (ex: Microempresa, Serviço)", examples=["Microempresa"])
    total: int = Field(..., description="Total acumulado para esta categoria", examples=[826])

class AtividadeSetor(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    codigo_secao: str = Field(..., description="Código da seção CNAE", examples=["G"])
    descricao: str = Field(..., description="Descrição da atividade econômica", examples=["COMÉRCIO; REPARAÇÃO DE VEÍCULOS"])
    total: int = Field(..., description="Total de empresas nesta atividade", examples=[1386])

class SetorEconomico(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    categoria: str = Field(..., alias="setor", description="Nome do setor econômico", examples=["Comércio"])
    total: int = Field(..., description="Total de empresas no setor", examples=[1386])
    atividades: List[Union[ItemMetrica, AtividadeSetor]] = Field(..., description="Lista de atividades detalhadas do setor")

class TemposProcesso(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    tempo_medio_cp_nome: Optional[str] = Field(None, description="Tempo médio para consulta de nome", examples=["00:00:00"])
    tempo_medio_cp_end: Optional[str] = Field(None, description="Tempo médio para consulta de endereço", examples=["08:55:28"])
    tempo_medio_cp_total: Optional[str] = Field(None, description="Tempo médio total de consulta prévia", examples=["08:55:28"])
    tempo_medio_validacao: Optional[str] = Field(None, description="Tempo médio de validação", examples=["00:04:55"])
    tempo_medio_registro: Optional[str] = Field(None, description="Tempo médio de registro", examples=["07:45:05"])
    tempo_medio_total: Optional[str] = Field(None, description="Tempo médio total do processo", examples=["16:45:29"])
    qtd_processos: Optional[int] = Field(None, description="Quantidade total de processos analisados", examples=[66])

class Metricas(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    total: Optional[int] = Field(None, alias="total_ativas", description="Total geral de empresas (ativas ou aberturas)", examples=[326257])
    portes: List[ItemMetrica] = Field(..., description="Distribuição por porte da empresa")
    naturezas: List[ItemMetrica] = Field(..., description="Distribuição por natureza jurídica")
    setores_economicos: List[SetorEconomico] = Field(..., description="Distribuição por setores econômicos e atividades")
    tempos: Optional[TemposProcesso] = Field(None, description="Métricas de tempo de processo (relevante para aberturas)")

class CriterioRankingDetalhado(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    im: Optional[int] = Field(None, description="Pontuação para Inscrição Municipal", examples=[10])
    al: Optional[int] = Field(None, description="Pontuação para Alvará de Localização", examples=[10])
    cp: Optional[int] = Field(None, description="Pontuação para Consulta Prévia", examples=[5])
    as_: Optional[int] = Field(None, alias="as", description="Pontuação para Alvará Sanitário", examples=[10])

class DetalhesAtendimento(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    qtd_solicitacoes: int = Field(..., description="Quantidade de solicitações recebidas", examples=[17])
    qtd_atendimentos: int = Field(..., description="Quantidade de atendimentos realizados", examples=[17])
    percentual_atendimento: float = Field(..., description="Percentual de solicitações atendidas", examples=[1.0])

class DetalhesTemposAnalise(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    al: Optional[str] = Field(None, description="Tempo de análise para Alvará de Localização", examples=["18:01:39"])
    cp: Optional[str] = Field(None, description="Tempo de análise para Consulta Prévia", examples=["05:21:12"])
    im: Optional[str] = Field(None, description="Tempo de análise para Inscrição Municipal", examples=[None])
    as_: Optional[str] = Field(None, alias="as", description="Tempo de análise para Alvará Sanitário", examples=[None])

class CriterioRanking(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    categoria: str = Field(..., description="Nome da categoria do critério", examples=["documentos_habilitados"])
    pontuacao: int = Field(..., description="Pontuação obtida neste critério", examples=[35])
    detalhes: Union[CriterioRankingDetalhado, DetalhesAtendimento, DetalhesTemposAnalise] = Field(..., description="Detalhes específicos da pontuação")

class MetricasRanking(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    posicao: int = Field(..., description="Posição no ranking", examples=[25])
    pontuacao_total: int = Field(..., description="Soma total das pontuações dos critérios", examples=[66])
    criterios: List[CriterioRanking] = Field(..., description="Lista de critérios avaliados")

class ItemClassificacao(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    posicao: int
    localidade: str
    codigo_ibge: str
    valor: int = Field(..., alias="total")
    percentual: float

class RespostaClassificacao(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    tipo: str
    ano: str
    mes: str
    total_estado: int
    itens: List[ItemClassificacao]

class EstatisticaBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id", description="Identificador único do documento no CouchDB", examples=["ativas:22:03-2026"])
    tipo: str = Field(..., description="Tipo do registro (aberturas, ativas ou ranking)", examples=["ativas"])
    nivel: str = Field(..., description="Nível geográfico (estado ou municipio)", examples=["estado"])
    codigo_ibge: str = Field(..., description="Código IBGE da localidade", examples=["22"])
    localidade: str = Field(..., description="Nome da localidade (ex: Piauí, Acauã)", examples=["Piauí"])
    mes: Optional[str] = Field(None, description="Mês de referência", examples=["03"])
    ano: Optional[str] = Field(None, description="Ano de referência", examples=["2026"])
    territorio: Optional[str] = Field(None, description="Nome do território de desenvolvimento", examples=["Piauí"])
    atualizado_em: Optional[str] = Field(None, description="Timestamp da última atualização", examples=["2026-03-03T12:57:00"])
    metricas: Union[Metricas, MetricasRanking] = Field(..., description="Conjunto de métricas detalhadas")