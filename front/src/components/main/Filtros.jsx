import { useEffect, useState } from "react";
import * as d3 from "d3";
import { ComboboxCidades } from "../ui/combobox";
import { ComboboxRegiao } from "../ui/combobox_regiao";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";

export default function Filtros(props) {
  const apiUrl = import.meta.env.VITE_URL_API;
  const apiToken = import.meta.env.VITE_API_TOKEN;

  const [meses] = useState([
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ]);

  const mesesDict = {
    "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
    "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
    "09": "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro",
  };

  const [selectedMes, setSelectedMes] = useState(props.selectedMonth);
  const [selectedAno, setSelectedAno] = useState(props.selectedYear);
  const [dataRecente, setDataRecente] = useState(null);

  const isEvolucao = props.activeTab === "evolucao";
  const isEvolucaoGeral = props.activeTab === "evolucao_geral";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `${apiUrl}/data_recente`;
        const response = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${apiToken}` },
        });
        const data = await response.json();
        setDataRecente(data);
      } catch (error) {
        console.error("Erro ao buscar dados do servidor:", error);
      }
    };
    fetchData();
  }, [apiUrl, apiToken]);

  const handleMesSelect = (mes) => {
    setSelectedMes(mes);
    props.onMesSelecionado(mes);
  };

  const handleAnoSelect = (ano) => {
    setSelectedAno(ano);
    props.onAnoSelecionado(ano);
  };

  const highlightCityOnMap = () => {
    d3.select("#map")
      .selectAll(".city")
      .classed("selected", false)
      .classed("no-selected", false);
  };

  const limparFiltros = () => {
    props.onCidadeSelecionada({ nome: "Selecione uma localidade", id: "" });
    highlightCityOnMap();

    if (isEvolucao) {
      const lista = props.periodos || [];
      const ultimo = lista.length > 0 ? lista[lista.length - 1].value : "";
      const idx = Math.max(0, lista.length - 6);
      props.onPeriodoInicioChange(lista.length > 0 ? lista[idx].value : "");
      props.onPeriodoFimChange(ultimo);
    } else if (isEvolucaoGeral) {
      const lista = props.periodosGeral || [];
      const ultimo = lista.length > 0 ? lista[lista.length - 1].value : "";
      const idx = Math.max(0, lista.length - 6);
      props.onPeriodoInicioGeralChange(lista.length > 0 ? lista[idx].value : "");
      props.onPeriodoFimGeralChange(ultimo);
      if (props.onResetCidadesGeral) props.onResetCidadesGeral();
    } else if (dataRecente) {
      const mesRecente = mesesDict[dataRecente.mes];
      setSelectedMes(mesRecente);
      setSelectedAno(dataRecente.ano);
      props.onMesSelecionado(mesRecente);
      props.onAnoSelecionado(dataRecente.ano);
    }
  };

  return (
    <div className="filtros text-[#034ea2] p-4 relative z-[1000]">
      <div className="flex flex-col xl:flex-row items-center gap-4 justify-center w-full">

        {/* ── Localidade + Território + (Intervalo se evolucao) ── */}
        <div className="flex w-full flex-col xl:flex-row items-center gap-3 xl:gap-4">
          {/* Localidade */}
          <div className="flex w-full xl:w-auto items-center gap-2 justify-center">
            <p className="whitespace-nowrap text-sm font-medium lg:text-base">
              Selecione uma localidade
            </p>
            <ComboboxCidades
              onCidadeSelect={(cidade) => {
                if (cidade.nome === "Piauí") {
                  props.onCidadeSelecionada({ ...cidade, id: "" });
                } else {
                  props.onCidadeSelecionada(cidade);
                }
              }}
              cidadeSelecionada={props.cidadeSelecionada}
            />
          </div>

          {/* Território (oculto nas abas ranking, evolucao e evolucao_geral) */}
          {props.activeTab !== "ranking" && !isEvolucao && !isEvolucaoGeral && (
            <div className="flex w-full xl:w-auto items-center gap-2 justify-center">
              <p className="whitespace-nowrap text-sm font-medium lg:text-base xl:ml-4">
                Selecione um território
              </p>
              <ComboboxRegiao
                onRegiaoSelect={(r) => props.onCidadeSelecionada(r)}
                regiaoSelecionada={props.cidadeSelecionada}
              />
            </div>
          )}

          {/* Filtro de intervalo — aba Evolução */}
          {isEvolucao && (
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <p className="whitespace-nowrap text-sm font-medium lg:text-base">
                Intervalo:
              </p>
              <Select
                value={props.periodoInicio}
                onValueChange={props.onPeriodoInicioChange}
                disabled={!props.periodos?.length}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="De" />
                </SelectTrigger>
                <SelectContent>
                  {(props.periodos || []).map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">até</span>
              <Select
                value={props.periodoFim}
                onValueChange={props.onPeriodoFimChange}
                disabled={!props.periodos?.length}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Até" />
                </SelectTrigger>
                <SelectContent>
                  {(props.periodos || []).map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="text-xs lg:text-sm limpar-filtros" variant="outline" onClick={limparFiltros}>
                Limpar Filtros
              </Button>
            </div>
          )}

          {/* Filtro de intervalo — aba Evolução Geral */}
          {isEvolucaoGeral && (
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <p className="whitespace-nowrap text-sm font-medium lg:text-base">
                Intervalo:
              </p>
              <Select
                value={props.periodoInicioGeral}
                onValueChange={props.onPeriodoInicioGeralChange}
                disabled={!props.periodosGeral?.length}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="De" />
                </SelectTrigger>
                <SelectContent>
                  {(props.periodosGeral || []).map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">até</span>
              <Select
                value={props.periodoFimGeral}
                onValueChange={props.onPeriodoFimGeralChange}
                disabled={!props.periodosGeral?.length}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Até" />
                </SelectTrigger>
                <SelectContent>
                  {(props.periodosGeral || []).map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="text-xs lg:text-sm limpar-filtros" variant="outline" onClick={limparFiltros}>
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>

        {/* ── Período (ano + mês) — oculto nas abas Evolução e Evolução Geral ── */}
        {!isEvolucao && !isEvolucaoGeral && (
          <div className="flex w-full flex-col items-center xl:w-auto xl:flex-row xl:items-center xl:gap-3 gap-3">
            <p className="whitespace-nowrap text-sm font-medium lg:text-base legendaPeriodo">
              Selecione o período
            </p>

            <div className="flex w-full gap-2 xl:w-auto justify-center">
              <Select className="anoEscolha" onValueChange={handleAnoSelect} value={selectedAno}>
                <SelectTrigger className="flex-1 xl:w-[140px] anoEscolha">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 8 }, (_, i) => {
                    const ano = 2019 + i;
                    return (
                      <SelectItem key={ano} value={ano.toString()}>
                        {ano}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select onValueChange={handleMesSelect} value={selectedMes}>
                <SelectTrigger className="mesEscolha flex-1 md:w-[140px] lg:w-[160px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes, index) => (
                    <SelectItem key={index} value={mes}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full md:w-[120px] lg:w-[140px] text-xs lg:text-sm limpar-filtros"
              variant="outline"
              onClick={limparFiltros}
            >
              Limpar Filtros
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
