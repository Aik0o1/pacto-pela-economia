import { useState, useMemo, useEffect } from "react";
import { MapPin, Building2, FileChartPie } from "lucide-react";
import ChartCard from "../graphs/PieCharts";
import TabelaSetorizadaAtividades from "../tables/SetoresAtividades";
import RankingMunicipios from "./../tables/RankingMunicipios";
import {
  AccordionItem,
  Accordion,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";
import SunburstCard from "../graphs/SunburstChart";
import HierarchicalTreeMap from "../graphs/treeMap";

export default function ListaAtivas({ onCidadeSelecionada }) {
  const [dados, setDados] = useState(null);

  const apiUrl = import.meta.env.VITE_URL_API;
  const apiToken = import.meta.env.VITE_API_TOKEN;

  const [ranking, setRanking] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    const btnAno = document.getElementsByClassName("anoEscolha")[0];
    const btnMes = document.getElementsByClassName("mesEscolha")[0];
    const btnLimparFiltros =
      document.getElementsByClassName("limpar-filtros")[0];
    const legendaPeriodo = document.getElementsByClassName("legendaPeriodo")[0];

    legendaPeriodo.style.display = "none";
    if (btnAno) btnAno.style.display = "none";
    if (btnMes) btnMes.style.display = "none";
    if (btnLimparFiltros) btnLimparFiltros.style.display = "none";
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const strId = String(onCidadeSelecionada.id || "");
        const id = strId.includes("-")
          ? strId.split("-")[1]
          : strId;

        // setLoading(true);
        // setError(null);
        const { ano, mes } = await (
          await fetch(`${apiUrl}/data_recente`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${apiToken}`,
              "Content-Type": "application/json", // opcional, mas comum
            },
          })
        ).json();

        // console.log(dataData)

        // const numero_mes = meses[mes];
        // console.log("Mês:", numero_mes, "Ano:", ano, "Cidade:", id);

        // Corrigindo a URL - removendo o "?" extra
        const url_ativas = onCidadeSelecionada?.id
          ? `${apiUrl}/empresas_ativas?cidade=${id}&mes=${mes}&ano=${ano}`
          : `${apiUrl}/empresas_ativas?cidade=22&mes=${mes}&ano=${ano}`;

        // URL para o ranking de ativas
        const urlRanking = `${apiUrl}/ranking_ativas?mes=${mes}&ano=${ano}`;

        // console.log("URL:", url_ativas);

        const [response, resRanking] = await Promise.all([
          fetch(url_ativas, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${apiToken}`,
            },
          }),
          fetch(urlRanking, {
            headers: { Authorization: `Bearer ${apiToken}` },
          }),
        ]);

        const data = await response.json();
        const dataRanking = await resRanking.json();

        // console.log(data);

        if (!response.ok || !data.ativas) {
          setDados(null);
        } else {
          // console.log(data);

          setDados(data.ativas);
        }

        setRanking(resRanking.ok ? dataRanking : []);

        if (onCidadeSelecionada?.id) {
          setSelectedCity(onCidadeSelecionada.id);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do servidor:", error);
      }
    };

    fetchData();
  }, [onCidadeSelecionada]);

  // if (loading) {
  //   return (
  //     <div className="informacoes-municipais p-6 bg-white rounded-lg shadow-md">
  //       <p className="text-center text-gray-500">Carregando...</p>
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <div className="informacoes-municipais p-6 bg-white rounded-lg shadow-md">
  //       <p className="text-center text-red-500">Erro: {error}</p>
  //     </div>
  //   );
  // }

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


  // Determina o nome do município baseado no tipo de dados
  const municipio =
    onCidadeSelecionada.nome === "Selecione uma localidade"
      ? "Piauí"
      : onCidadeSelecionada.nome;

  // Calcula o total de empresas ativas somando todas as categorias
  const calcularTotalAtivas = () => {
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

  const qtd_ativas_no_mes = calcularTotalAtivas();

  // Verifica se há dados válidos para exibir gráficos

  return (
    <div className="informacoes-municipais p-6 bg-white rounded-lg shadow-md">
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
                Total de Empresas Ativas
              </p>
            </div>
            <p className="text-[#034ea2] font-semibold">{qtd_ativas_no_mes}</p>
          </div>
        </li>
      </ul>

      <div className="mt-4 space-y-4">
        {/* Ranking de Empresas Ativas por Município */}
        <RankingMunicipios
          municipio={municipio}
          ranking={ranking}
          tipo="ativas"
        />

        <Accordion type="single" collapsible className="border rounded-lg">
          <AccordionItem value="piecharts" className="border-none">
            <AccordionTrigger className="flex items-center gap-3 p-4 hover:bg-gray-50 text-[#231f20]">
              <FileChartPie className="h-5 w-5 text-[#034ea2]" />
              <span className="font-medium">
                Empresas Ativas por Portes e Naturezas Jurídicas
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
                Empresas Ativas por Setor Econômico (no mês)
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-1 pt-0">
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
                />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
