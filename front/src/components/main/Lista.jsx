import { useState, useEffect } from "react";
import { useMemo } from "react";
import { MapPin, Building2, Clock, FileChartPie } from "lucide-react";
import ChartCard from "../graphs/PieCharts";
import TabelaSetorizadaAtividades from "../tables/SetoresAtividades";
import RankingMunicipios from "./../tables/RankingMunicipios";
import {
  AccordionItem,
  Accordion,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";
import HierarchicalTreeMap from "../graphs/treeMap";
export default function Lista({ onCidadeSelecionada, mes, ano }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_URL_API;
  const apiToken = import.meta.env.VITE_API_TOKEN;

  const [ranking, setRanking] = useState([]);

  const [selectedCity, setSelectedCity] = useState("");
  const meses = {
    Janeiro: "01",
    Fevereiro: "02",
    Março: "03",
    Abril: "04",
    Maio: "05",
    Junho: "06",
    Julho: "07",
    Agosto: "08",
    Setembro: "09",
    Outubro: "10",
    Novembro: "11",
    Dezembro: "12",
  };

  useEffect(() => {
    const btnAno = document.getElementsByClassName("anoEscolha")[0];
    const btnMes = document.getElementsByClassName("mesEscolha")[0];
    const btnLimparFiltros =
      document.getElementsByClassName("limpar-filtros")[0];
    const legendaPeriodo = document.getElementsByClassName("legendaPeriodo")[0];

    legendaPeriodo.style.display = "";

    btnAno.style.display = "";
    btnMes.style.display = "";
    btnLimparFiltros.style.display = "";
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
      try {
        const id = onCidadeSelecionada?.id || "22";
        const numero_mes = meses[mes];

        // Se for Piauí ou Território, precisamos da classificação estadual para o ranking
        const isPiaui = id === "22" || id === "";
        const isTerritorio = String(id).startsWith("territorio:");

        // encodeURIComponent é necessário pois o id pode conter ':' (ex: territorio:Cocais)
        const idEncoded = encodeURIComponent(id);
        const urlAbertas = `${apiUrl}/estatistica/aberturas/${idEncoded}?mes=${numero_mes}&ano=${ano}`;
        
        // Sempre busca a classificação do estado se for Piauí ou um Território
        const urlRanking = (isPiaui || isTerritorio)
          ? `${apiUrl}/classificacao/municipios/aberturas?mes=${numero_mes}&ano=${ano}`
          : null;

        const promises = [
          fetch(urlAbertas, { headers: { Authorization: `Bearer ${apiToken}` }, signal })
        ];
        
        if (urlRanking) {
          promises.push(fetch(urlRanking, { headers: { Authorization: `Bearer ${apiToken}` }, signal }));
        }

        const responses = await Promise.all(promises);
        
        if (!active) return;

        const dataAbertas = await responses[0].json();
        
        let dataRanking = null;
        if (urlRanking) {
          dataRanking = await responses[1].json();
        }

        if (!active) return;

        if (responses[0].ok && dataAbertas.metricas) {
          const m = dataAbertas.metricas;
          const transformed = {
            ...m,
            naturezas: m.naturezas ? Object.fromEntries(m.naturezas.map(i => [i.categoria, i.total])) : {},
            portes: m.portes ? Object.fromEntries(m.portes.map(i => [i.categoria, i.total])) : {},
            classificacoes: {},
            secoes_por_classificacao: {},
            total_abertas: m.total_ativas || m.total
          };

          if (m.setores_economicos) {
            m.setores_economicos.forEach(s => {
              // Normaliza o setor: 'Sem classificação' e '-' são o mesmo bucket
              const rawCat = s.setor || s.categoria;
              const cat = (rawCat === "Sem classificação" || rawCat === "-") ? "-" : rawCat;
              transformed.classificacoes[cat] = (transformed.classificacoes[cat] || 0) + s.total;
              const secoes = Object.fromEntries(
                s.atividades.map(a => [a.descricao || a.categoria || a.setor || "-", a.total])
              );
              // Merge atividades para o mesmo bucket
              if (!transformed.secoes_por_classificacao[cat]) {
                transformed.secoes_por_classificacao[cat] = secoes;
              } else {
                Object.entries(secoes).forEach(([k, v]) => {
                  transformed.secoes_por_classificacao[cat][k] = (transformed.secoes_por_classificacao[cat][k] || 0) + v;
                });
              }
            });
          }
          setDados(transformed);
        } else {
          setDados(null);
        }
        
        // Lógica de Ranking
        if (urlRanking && dataRanking && dataRanking.itens) {
          if (isTerritorio && onCidadeSelecionada.cidadesIds) {
            // Filtrar apenas municípios do território
            const filtrados = dataRanking.itens.filter(item => 
              onCidadeSelecionada.cidadesIds.includes(Number(item.codigo_ibge))
            );
            // Recalcular posições no contexto do território? 
            // O usuário pediu "ranking", geralmente espera-se a posição relativa ao território ou manter a do estado.
            // Vamos manter a posição do estado para ser fiel ao nome "Ranking" ou recalcular se for uma lista simples.
            // Recalculando para parecer um ranking do território:
            const recalibrados = filtrados.map((item, idx) => ({
              ...item,
              posicao: idx + 1
            }));
            setRanking(recalibrados);
          } else {
            setRanking(dataRanking.itens);
          }
        } else {
          setRanking([]);
        }
      } catch (error) {
        if (error.name !== "AbortError" && active) {
          console.error("Erro ao buscar dados:", error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      active = false;
      controller.abort();
    };
  }, [onCidadeSelecionada, mes, ano]);
  const municipio =
    onCidadeSelecionada.nome == "Selecione uma localidade" || onCidadeSelecionada.nome == "Piauí"
      ? "Municípios Pacto pela Economia"
      : onCidadeSelecionada.nome;

  const labels = {
    tempo_medio_registro: "Média de Tempo para Registro na Junta Comercial",
    tempo_medio_cp_end:
      "Média de Tempo para Consulta Prévia de Endereço junto à Localidade",
    tempo_medio_total: "Média de Tempo Total para Abertura de Empresas",
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return null;

    // Aceita 2 ou mais dígitos para horas
    if (/^\d{2,}:\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    // Tentar extrair tempo de strings complexas
    const timeMatch = timeStr.match(/(\d+):(\d{2}):(\d{2})/);
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, "0");
      return `${hours}:${timeMatch[2]}:${timeMatch[3]}`;
    }

    return null;
  };

  const naturezasData = useMemo(() => {
    if (!dados?.naturezas) return [];
    return Object.entries(dados.naturezas)
      .filter(([, value]) => value != null && value > 0)
      .map(([key, value]) => ({
        label: key.replace(/^\d{3}-\d\s+-\s+/, ""), // Limpa o label
        value: value,
      }));
  }, [dados]);

  const portesData = useMemo(() => {
    if (!dados?.portes) return [];
    return Object.entries(dados.portes)
      .filter(([, value]) => value != null && value > 0)
      .map(([key, value]) => ({
        label: key,
        value: value,
      }));
  }, [dados]);

  const setoresData = useMemo(() => {
    if (!dados?.classificacoes) return [];
    return Object.entries(dados.classificacoes)
      .filter(([, value]) => value != null && value > 0)
      .map(([key, value]) => ({
        label: key,
        value: value,
      }));
  }, [dados]);

  const secoesClassificacaoData = useMemo(() => {
    if (!dados?.secoes_por_classificacao) {
      return {
        comercio: [],
        industria: [],
        servico: [],
        "-": [],
      };
    }

    const formatarSecoes = (classificacao) => {
      if (!dados.secoes_por_classificacao[classificacao]) return [];

      return Object.entries(dados.secoes_por_classificacao[classificacao])
        .filter(([, value]) => value != null && value > 0)
        .map(([key, value]) => ({
          label: key,
          value: value,
        }));
    };

    return {
      comercio: formatarSecoes("Comércio"),
      industria: formatarSecoes("Indústria"),
      servico: formatarSecoes("Serviço"),
      "-": formatarSecoes("-"),
    };
  }, [dados]);

  const calcularTotalAbertas = () => {
    if (!dados) return "-";

    let total = 0;
    const { naturezas, portes, secoes_atividades } = dados;

    // Soma valores de naturezas (evita dupla contagem usando apenas uma categoria)
    if (naturezas && Object.keys(naturezas).length > 0) {
      Object.values(naturezas).forEach((valor) => {
        if (valor !== null && typeof valor === "number") {
          total += valor;
        }
      });
    } else if (portes && Object.keys(portes).length > 0) {
      // Se não tem naturezas, usa portes
      Object.values(portes).forEach((valor) => {
        if (valor !== null && typeof valor === "number") {
          total += valor;
        }
      });
    } else if (secoes_atividades && Object.keys(secoes_atividades).length > 0) {
      // Se não tem nem naturezas nem portes, usa seções
      Object.values(secoes_atividades).forEach((valor) => {
        if (valor !== null && typeof valor === "number") {
          total += valor;
        }
      });
    }

    return total > 0 ? total.toLocaleString("pt-BR") : "-";
  };

  const qtd_abertas = calcularTotalAbertas();

  // const qtd_abertas = totalAbertas ? totalAbertas : "-";

  return (
    <div className="informacoes-municipais p-6 bg-white rounded-lg shadow-md relative min-h-[300px]">
      {loading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center z-50 rounded-lg transition-all duration-300">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-[#034ea2] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-[#034ea2] animate-pulse">Carregando dados de empresas Abertas em {municipio}...</p>
          </div>
        </div>
      )}
      <ul className="space-y-4">
        <li>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <MapPin className="text-[#034ea2]" />
              <p className="font-medium text-[#231f20]">Localidade</p>
            </div>
            <p className="text-[#034ea2] font-semibold">{municipio}</p>
          </div>
        </li>

        <li>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <Building2 className="text-[#034ea2]" />
              <p className="font-medium text-[#231f20]">
                Total de Abertura de Empresas (no mês)
              </p>
            </div>
            <p className="text-[#034ea2] font-semibold">{qtd_abertas}</p>
          </div>
        </li>
      </ul>

      <div className="mt-4 space-y-4">
        {/* Ranking de Aberturas por Município */}
        <RankingMunicipios
          municipio={municipio}
          ranking={ranking}
          tipo="abertas"
          isTerritorio={String(onCidadeSelecionada.id || "").startsWith("territorio:")}
        />

        {!String(onCidadeSelecionada.id || "").startsWith("territorio:") && (
          <Accordion type="single" collapsible className="border rounded-lg">
            <AccordionItem value="tempos" className="border-none">
              <AccordionTrigger className="text-decorflex w-full items-center gap-3 p-4 text-left hover:bg-gray-50 text-[#231f20]">
                <Clock className="h-5 w-5 shrink-0 text-[#034ea2]" />
                <div className="w-full flex flex-col justify-between">
                  <span className="font-medium">Tempos de Análise (no mês)</span>
                  <p className="text-sm font-normal text-gray-500">
                    Correspondente apenas aos processos de abertura
                  </p>
                </div>
              </AccordionTrigger>

              <AccordionContent className="p-4 pt-0">
                {dados?.tempos ? (
                  <ul className="space-y-2">
                    {Object.entries(dados.tempos)
                      .filter(([key]) => key in labels)
                      .sort(([, tempoA], [, tempoB]) => {
                        const toSeconds = (t) => {
                          if (!t) return Infinity;
                          const [h, m, s] = t.split(":").map(Number);
                          return (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0);
                        };
                        return toSeconds(tempoA) - toSeconds(tempoB);
                      })
                      .map(([doc, tempo]) => (
                        <li
                          key={doc}
                          className="flex justify-between py-2 border-b last:border-b-0"
                        >
                          <span className="font-medium">{labels[doc]}</span>
                          <span className="text-[#034ea2] font-mono">
                            {tempo ? formatTime(tempo) : "-"}
                          </span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Sem dados</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <Accordion type="single" collapsible className="border rounded-lg">
          <AccordionItem value="piecharts" className="border-none">
            <AccordionTrigger className="flex items-center gap-3 p-4 hover:bg-gray-50 text-[#231f20]">
              <FileChartPie className="h-5 w-5 text-[#034ea2]" />
              <span className="font-medium">
                Abertura de Empresas por Portes e Naturezas Jurídicas (no mês)
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              {!dados ? (
                <p className="text-gray-500">Sem dados</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ChartCard title="Portes das Empresas" data={portesData} />
                  <ChartCard title="Naturezas Jurídicas" data={naturezasData} />
                  {/* <ChartCard title="Setores Econômicos" data={setoresData} /> */}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="single" collapsible className="border rounded-lg">
          <AccordionItem value="piecharts" className="border-none">
            <AccordionTrigger className="flex items-center gap-3 p-4 hover:bg-gray-50 text-[#231f20]">
              <FileChartPie className="h-5 w-5 text-[#034ea2]" />
              <span className="font-medium">
                Abertura de Empresas por Setor Econômico (no mês)
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">

              <div className="space-y-4">
                <HierarchicalTreeMap
                  secoesData={secoesClassificacaoData}
                  title="EMPRESAS ATIVAS POR ATIVIDADE E POR SETOR"
                />

              </div>

              {!dados ? (
                <p className="text-gray-500 text-center py-4">Sem dados</p>
              ) : (
                <TabelaSetorizadaAtividades
                  secoesData={secoesClassificacaoData}
                  localidade={municipio}
                  totalOverride={dados?.total_abertas || dados?.total}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* <Accordion type="single" collapsible className="border rounded-lg">
          <AccordionItem value="piecharts" className="border-none">
            <AccordionTrigger className="flex items-center gap-3 p-4 hover:bg-gray-50 text-[#231f20]">
              <FileChartPie className="h-5 w-5 text-[#034ea2]" />
              <span className="font-medium">
                Detalhes dos Setores Econômicos (no mês)
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              {!dados ? (
                <p className="text-gray-500">Sem dados</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <ChartCard
                    title="Comércio"
                    data={secoesClassificacaoData.comercio}
                  />
                  <ChartCard
                    title="Indústria"
                    data={secoesClassificacaoData.industria}
                  />
                  <ChartCard
                    title="Serviços"
                    data={secoesClassificacaoData.servico}
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion> */}
      </div>
    </div>
  );
}
