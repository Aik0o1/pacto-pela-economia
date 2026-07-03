import { useState, useEffect, useMemo } from "react";
import GraficoEvolucao from "../graphs/GraficoEvolucao";
import GraficoEvolucaoPosicao from "../graphs/GraficoEvolucaoPosicao";
import GraficoTempos from "../graphs/GraficoTempos";
import GraficoSolicitacoes from "../graphs/GraficoSolicitacoes";

const MUNICIPIOS_SITE = new Set([
  "Betânia do Piauí", "Buriti dos Montes", "Campo Largo do Piauí",
  "Cocal dos Alves", "Coronel José Dias", "Cristino Castro",
  "Ipiranga do Piauí", "Jerumenha", "Monsenhor Gil",
  "São José do Peixe", "São José do Piauí", "Tanque do Piauí",
]);

const toSlug = (nome) => nome.toLowerCase().replace(/\s+/g, "-");

const periodoToNum = (mesAno) => {
  if (!mesAno) return 0;
  const [mes, ano] = mesAno.split("-");
  return parseInt(ano) * 100 + parseInt(mes);
};

function corMedia(p) {
  if (p > 75) return "text-green-600";
  if (p > 50) return "text-yellow-500";
  if (p > 25) return "text-orange-500";
  return "text-red-600";
}

export default function AbaEvolucao({
  cidadeSelecionada,
  periodoInicio,
  periodoFim,
  onPeriodosChange,
}) {
  const apiUrl = import.meta.env.VITE_URL_API;
  const apiToken = import.meta.env.VITE_API_TOKEN;

  const [historico, setHistorico] = useState([]);
  const [historicoAberturas, setHistoricoAberturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cidadeEfetiva, setCidadeEfetiva] = useState(null);

  // Resolve cidade: selecionada pelo usuário ou 1º lugar do ranking
  useEffect(() => {
    const valida =
      cidadeSelecionada?.id &&
      cidadeSelecionada.nome !== "Selecione uma localidade" &&
      cidadeSelecionada.nome !== "Piauí";

    if (valida) {
      const strId = String(cidadeSelecionada.id || "");
      const id = strId.includes("-") ? strId.split("-")[1] : strId;
      setCidadeEfetiva({ id, nome: cidadeSelecionada.nome });
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/ranking/primeiro`, {
          headers: { Authorization: `Bearer ${apiToken}` },
          signal: controller.signal,
        });
        if (!res.ok) {
          setLoading(false);
          setCidadeEfetiva(null);
          return;
        }
        const data = await res.json();
        if (data.codigo_ibge && data.localidade) {
          setCidadeEfetiva({ id: data.codigo_ibge, nome: data.localidade });
        } else {
          setLoading(false);
          setCidadeEfetiva(null);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setCidadeEfetiva(null);
          setLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [cidadeSelecionada]);

  // Busca ranking + aberturas em paralelo quando a cidade mudar
  useEffect(() => {
    if (!cidadeEfetiva?.id) {
      setHistorico([]);
      setHistoricoAberturas([]);
      onPeriodosChange([]);
      return;
    }

    const controller = new AbortController();
    const headers = { Authorization: `Bearer ${apiToken}` };

    (async () => {
      setLoading(true);
      try {
        const [resRanking, resAberturas] = await Promise.all([
          fetch(`${apiUrl}/ranking/historico/${cidadeEfetiva.id}`, { headers, signal: controller.signal }),
          fetch(`${apiUrl}/historico/aberturas/${cidadeEfetiva.id}`, { headers, signal: controller.signal }),
        ]);

        const ranking = resRanking.ok ? await resRanking.json() : [];
        const aberturas = resAberturas.ok ? await resAberturas.json() : [];

        const listaRanking = Array.isArray(ranking) ? ranking : [];
        const listaAberturas = Array.isArray(aberturas) ? aberturas : [];

        setHistorico(listaRanking);
        setHistoricoAberturas(listaAberturas);

        const periodos = listaRanking.map((d) => ({
          value: `${d.mes}-${d.ano}`,
          label: d.label,
        }));
        onPeriodosChange(periodos);
      } catch (err) {
        if (err.name !== "AbortError") {
          setHistorico([]);
          setHistoricoAberturas([]);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [cidadeEfetiva]);

  // Dados de ranking filtrados pelo intervalo
  const dadosFiltrados = useMemo(() => {
    if (!historico.length) return [];
    const inicio = periodoToNum(periodoInicio);
    const fim = periodoToNum(periodoFim);
    if (!inicio && !fim) return historico;
    return historico.filter((d) => {
      const num = periodoToNum(`${d.mes}-${d.ano}`);
      return (!inicio || num >= inicio) && (!fim || num <= fim);
    });
  }, [historico, periodoInicio, periodoFim]);

  // Dados de aberturas filtrados pelo mesmo intervalo
  const aberturasFiltradas = useMemo(() => {
    if (!historicoAberturas.length) return [];
    const inicio = periodoToNum(periodoInicio);
    const fim = periodoToNum(periodoFim);
    if (!inicio && !fim) return historicoAberturas;
    return historicoAberturas.filter((d) => {
      const num = periodoToNum(`${d.mes}-${d.ano}`);
      return (!inicio || num >= inicio) && (!fim || num <= fim);
    });
  }, [historicoAberturas, periodoInicio, periodoFim]);

  const mediaPontos = useMemo(() => {
    if (!dadosFiltrados.length) return null;
    return dadosFiltrados.reduce((s, d) => s + (d.pontuacao_total || 0), 0) / dadosFiltrados.length;
  }, [dadosFiltrados]);

  const mediaAberturas = useMemo(() => {
    if (!aberturasFiltradas.length) return null;
    return aberturasFiltradas.reduce((s, d) => s + (d.total || 0), 0) / aberturasFiltradas.length;
  }, [aberturasFiltradas]);

  const totalAberturas = useMemo(() => {
    if (!aberturasFiltradas.length) return null;
    return aberturasFiltradas.reduce((s, d) => s + (d.total || 0), 0);
  }, [aberturasFiltradas]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white rounded-lg shadow-sm border p-6">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#034ea2] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!cidadeEfetiva) {
    return (
      <p className="text-center text-gray-400 text-sm py-10">
        Selecione um município para visualizar a evolução do ranking.
      </p>
    );
  }

  return (
    <div className="space-y-4">

      {/* Cidade exibida */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <p className="text-sm text-gray-500">Exibindo dados de:</p>
        <p className="text-sm font-semibold text-[#034ea2]">{cidadeEfetiva.nome}</p>
        {MUNICIPIOS_SITE.has(cidadeEfetiva.nome) && (
          <a
            href={`https://rankingmunicipal.jucepi.pi.gov.br/municipio/${toSlug(cidadeEfetiva.nome)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#034ea2] hover:bg-[#023a7a] px-3 py-1.5 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver dados 2025
          </a>
        )}
      </div>

      {dadosFiltrados.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-6">
          Sem dados para o período selecionado.
        </p>
      )}

      {dadosFiltrados.length > 0 && (
        <>
          {/* Cards de médias */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Média de pontos */}
            <div className="p-5 bg-white border rounded-lg shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-1">Média de Pontos no Período</p>
              <p className={`text-4xl font-bold ${corMedia(mediaPontos)}`}>
                {mediaPontos.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {dadosFiltrados.length}{" "}
                {dadosFiltrados.length === 1 ? "mês analisado" : "meses analisados"}
              </p>
            </div>

            {/* Média de empresas abertas */}
            <div className="p-5 bg-white border rounded-lg shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-1">Média de Empresas Abertas</p>
              <p className="text-4xl font-bold text-[#034ea2]">
                {mediaAberturas !== null ? mediaAberturas.toFixed(1) : "-"}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {aberturasFiltradas.length > 0
                  ? `${aberturasFiltradas.length} ${aberturasFiltradas.length === 1 ? "mês analisado" : "meses analisados"}`
                  : "sem dados"}
              </p>
            </div>

            {/* Total de empresas abertas */}
            <div className="p-5 bg-white border rounded-lg shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-1">Total de Empresas Abertas</p>
              <p className="text-4xl font-bold text-[#034ea2]">
                {totalAberturas !== null ? totalAberturas : "-"}
              </p>
              <p className="text-xs text-gray-400 mt-2">no período selecionado</p>
            </div>
          </div>

          <GraficoEvolucao dados={dadosFiltrados} />
          <GraficoEvolucaoPosicao dados={dadosFiltrados} />
          <GraficoSolicitacoes dados={dadosFiltrados} />
          <GraficoTempos dados={dadosFiltrados} />
        </>
      )}
    </div>
  );
}
