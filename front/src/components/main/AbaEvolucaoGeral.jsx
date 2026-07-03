import { useState, useEffect, useMemo } from "react";
import GraficoComparativoPontuacao from "../graphs/GraficoComparativoPontuacao";
import GraficoComparativoPosicao from "../graphs/GraficoComparativoPosicao";
import { Button } from "@/components/ui/button";

const MUNICIPIO_CORES = [
  "#034ea2", "#e74c3c", "#2ecc71", "#f39c12",
  "#9b59b6", "#1abc9c", "#e91e63", "#00bcd4",
  "#8bc34a", "#ff5722", "#607d8b", "#795548",
];

const periodoToNum = (mesAno) => {
  if (!mesAno) return 0;
  const [mes, ano] = mesAno.split("-");
  return parseInt(ano) * 100 + parseInt(mes);
};

const MESES_ABREV = { Jan: 1, Fev: 2, Mar: 3, Abr: 4, Mai: 5, Jun: 6, Jul: 7, Ago: 8, Set: 9, Out: 10, Nov: 11, Dez: 12 };

function parseLabelToNum(l) {
  if (!l) return 0;
  const [m, y] = l.split("/");
  return parseInt(y) * 100 + (MESES_ABREV[m] || 0);
}

function labelToPeriodo(label) {
  const mesMap = { Jan: "01", Fev: "02", Mar: "03", Abr: "04", Mai: "05", Jun: "06", Jul: "07", Ago: "08", Set: "09", Out: "10", Nov: "11", Dez: "12" };
  const [m, y] = label.split("/");
  return `${mesMap[m] || "01"}-${y}`;
}

const formatarPeriodo = (mesAno) => {
  if (!mesAno) return "";
  const [mes, ano] = mesAno.split("-");
  const mesesExt = {
    "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai", "06": "Jun",
    "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez"
  };
  return `${mesesExt[mes] || mes}/${ano}`;
};

export default function AbaEvolucaoGeral({ periodoInicio, periodoFim, onPeriodosChange, cidadesSelecionadas, onCidadesSelecionadasChange, onMunicipiosCarregados }) {
  const apiUrl = import.meta.env.VITE_URL_API;
  const apiToken = import.meta.env.VITE_API_TOKEN;

  const [municipios, setMunicipios] = useState([]);
  const [dadosPorCidade, setDadosPorCidade] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortFieldPos, setSortFieldPos] = useState("varPos");
  const [sortDirPos, setSortDirPos] = useState("desc");
  const [sortFieldPont, setSortFieldPont] = useState("varPont");
  const [sortDirPont, setSortDirPont] = useState("desc");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/id_nome_cidades`, {
          headers: { Authorization: `Bearer ${apiToken}` },
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const cidades = data.filter(c => c.id !== 22 && !String(c.id).startsWith("territorio:"));
        setMunicipios(cidades);
        if (onMunicipiosCarregados) onMunicipiosCarregados(cidades);
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (municipios.length === 0) return;

    const controller = new AbortController();
    const headers = { Authorization: `Bearer ${apiToken}` };

    (async () => {
      setLoading(true);
      try {
        const promises = municipios.map(c =>
          fetch(`${apiUrl}/ranking/historico/${c.id}`, { headers, signal: controller.signal })
            .then(r => r.ok ? r.json() : [])
            .then(data => ({ nome: c.nome, data: Array.isArray(data) ? data : [] }))
        );

        const results = await Promise.all(promises);
        const newDados = {};
        results.forEach(({ nome, data }) => { newDados[nome] = data; });
        setDadosPorCidade(newDados);

        const todosLabels = Object.values(newDados).flatMap(arr => arr.map(d => d.label));
        const unique = [...new Set(todosLabels)].sort((a, b) => parseLabelToNum(a) - parseLabelToNum(b));

        if (unique.length > 0) {
          const periodos = unique.map(label => ({
            label,
            value: labelToPeriodo(label),
          }));
          onPeriodosChange(periodos);
        }
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [municipios]);

  const cores = useMemo(() => {
    const map = {};
    municipios.forEach((c, i) => { map[c.nome] = MUNICIPIO_CORES[i % MUNICIPIO_CORES.length]; });
    return map;
  }, [municipios]);

  const dadosFiltrados = useMemo(() => {
    if (Object.keys(dadosPorCidade).length === 0) return {};
    const inicio = periodoToNum(periodoInicio);
    const fim = periodoToNum(periodoFim);
    const filtered = {};
    Object.entries(dadosPorCidade).forEach(([nome, arr]) => {
      filtered[nome] = arr.filter(d => {
        const num = periodoToNum(`${d.mes}-${d.ano}`);
        return (!inicio || num >= inicio) && (!fim || num <= fim);
      });
    });
    return filtered;
  }, [dadosPorCidade, periodoInicio, periodoFim]);

  const tabelaEvolucoes = useMemo(() => {
    if (!cidadesSelecionadas.length) return [];
    
    return cidadesSelecionadas.map(nome => {
      const pontos = dadosFiltrados[nome] || [];
      if (pontos.length === 0) {
        return {
          nome,
          pIni: null,
          pFin: null,
          varPont: 0,
          posIni: null,
          posFin: null,
          varPos: 0,
        };
      }
      
      const ordenados = [...pontos].sort((a, b) => parseLabelToNum(a.label) - parseLabelToNum(b.label));
      const first = ordenados[0];
      const last = ordenados[ordenados.length - 1];
      
      const pIni = Math.round(first.pontuacao_total ?? 0);
      const pFin = Math.round(last.pontuacao_total ?? 0);
      const varPont = pFin - pIni;
      
      const posIni = first.posicao ?? null;
      const posFin = last.posicao ?? null;
      
      let varPos = 0;
      if (posIni !== null && posFin !== null) {
        varPos = posIni - posFin; // Ex: 50 -> 10 => 50 - 10 = +40 (subiu)
      }
      
      return {
        nome,
        pIni,
        pFin,
        varPont,
        posIni,
        posFin,
        varPos,
      };
    });
  }, [dadosFiltrados, cidadesSelecionadas]);

  const handleSortPos = (field) => {
    if (sortFieldPos === field) {
      setSortDirPos(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortFieldPos(field);
      setSortDirPos("desc");
    }
  };

  const handleSortPont = (field) => {
    if (sortFieldPont === field) {
      setSortDirPont(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortFieldPont(field);
      setSortDirPont("desc");
    }
  };

  const tabelaPosicaoOrdenada = useMemo(() => {
    const items = [...tabelaEvolucoes];
    items.sort((a, b) => {
      let valA = a[sortFieldPos];
      let valB = b[sortFieldPos];
      
      if (sortFieldPos === "nome") {
        return sortDirPos === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      if (valA === null) valA = sortDirPos === "asc" ? Infinity : -Infinity;
      if (valB === null) valB = sortDirPos === "asc" ? Infinity : -Infinity;
      
      return sortDirPos === "asc" ? valA - valB : valB - valA;
    });
    return items;
  }, [tabelaEvolucoes, sortFieldPos, sortDirPos]);

  const tabelaPontuacaoOrdenada = useMemo(() => {
    const items = [...tabelaEvolucoes];
    items.sort((a, b) => {
      let valA = a[sortFieldPont];
      let valB = b[sortFieldPont];
      
      if (sortFieldPont === "nome") {
        return sortDirPont === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      if (valA === null) valA = sortDirPont === "asc" ? Infinity : -Infinity;
      if (valB === null) valB = sortDirPont === "asc" ? Infinity : -Infinity;
      
      return sortDirPont === "asc" ? valA - valB : valB - valA;
    });
    return items;
  }, [tabelaEvolucoes, sortFieldPont, sortDirPont]);

  const toggleCidade = (nome) => {
    onCidadesSelecionadasChange(prev =>
      prev.includes(nome) ? prev.filter(c => c !== nome) : [...prev, nome]
    );
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white rounded-lg shadow-sm border p-6">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#034ea2] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Seletor de municípios */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">
            Municípios{" "}
            <span className="text-xs font-normal text-gray-400">
              ({cidadesSelecionadas.length} selecionados)
            </span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onCidadesSelecionadasChange(municipios.map(c => c.nome))}
              className="text-xs text-[#034ea2] h-7 px-3"
            >
              Todos
            </Button>
            <Button
              variant="outline"
              onClick={() => onCidadesSelecionadasChange([])}
              className="text-xs text-[#034ea2] h-7 px-3"
            >
              Nenhum
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {municipios.map(c => {
            const selecionado = cidadesSelecionadas.includes(c.nome);
            const cor = cores[c.nome];
            return (
              <label key={c.id} className="flex items-center gap-2 cursor-pointer select-none group">
                <div
                  className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={selecionado
                    ? { backgroundColor: cor, borderColor: cor }
                    : { backgroundColor: "white", borderColor: "#d1d5db" }
                  }
                  onClick={() => toggleCidade(c.nome)}
                >
                  {selecionado && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cor }}
                />
                <span className="text-xs text-gray-700 group-hover:text-gray-900 leading-tight">
                  {c.nome}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Gráficos e Tabelas */}
      {cidadesSelecionadas.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">
          Selecione ao menos um município para visualizar os gráficos e as tabelas de evolução.
        </p>
      ) : (
        <>
          <GraficoComparativoPosicao
            dadosPorCidade={dadosFiltrados}
            cidadesSelecionadas={cidadesSelecionadas}
            cores={cores}
          />
          <GraficoComparativoPontuacao
            dadosPorCidade={dadosFiltrados}
            cidadesSelecionadas={cidadesSelecionadas}
            cores={cores}
          />

          {/* Duas Tabelas de Maiores Evoluções */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Tabela de Evolução da Posição */}
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="mb-3 border-b pb-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  Evolução da Posição ({formatarPeriodo(periodoInicio)} a {formatarPeriodo(periodoFim)})
                </h3>
                <p className="text-xs text-gray-500">
                  Melhor colocação (1º em diante). Clique nas colunas para ordenar.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-gray-700">
                  <thead className="text-xs uppercase bg-gray-50 text-gray-600 border-b">
                    <tr>
                      <th className="py-2 px-3 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSortPos("nome")}>
                        Município {sortFieldPos === "nome" ? (sortDirPos === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="py-2 px-3 text-center">Pos. Inicial</th>
                      <th className="py-2 px-3 text-center">Pos. Final</th>
                      <th className="py-2 px-3 text-center cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSortPos("varPos")}>
                        Variação {sortFieldPos === "varPos" ? (sortDirPos === "asc" ? "▲" : "▼") : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tabelaPosicaoOrdenada.map(item => {
                      const cor = cores[item.nome];
                      
                      let posText = "-";
                      let posColor = "text-gray-500";
                      if (item.varPos > 0) {
                        posText = `▲ +${item.varPos} pos.`;
                        posColor = "text-green-600 font-semibold";
                      } else if (item.varPos < 0) {
                        posText = `▼ ${item.varPos} pos.`;
                        posColor = "text-red-600 font-semibold";
                      } else if (item.posIni !== null) {
                        posText = "=";
                        posColor = "text-gray-500";
                      }

                      return (
                        <tr key={item.nome} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-3 font-medium flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                            {item.nome}
                          </td>
                          <td className="py-2 px-3 text-center">{item.posIni ? `${item.posIni}º` : "-"}</td>
                          <td className="py-2 px-3 text-center">{item.posFin ? `${item.posFin}º` : "-"}</td>
                          <td className={`py-2 px-3 text-center ${posColor}`}>{posText}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela de Evolução da Pontuação */}
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="mb-3 border-b pb-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  Evolução da Pontuação ({formatarPeriodo(periodoInicio)} a {formatarPeriodo(periodoFim)})
                </h3>
                <p className="text-xs text-gray-500">
                  Total de pontos ganhos ou perdidos. Clique nas colunas para ordenar.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-gray-700">
                  <thead className="text-xs uppercase bg-gray-50 text-gray-600 border-b">
                    <tr>
                      <th className="py-2 px-3 cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSortPont("nome")}>
                        Município {sortFieldPont === "nome" ? (sortDirPont === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="py-2 px-3 text-center">Pontos Inicial</th>
                      <th className="py-2 px-3 text-center">Pontos Final</th>
                      <th className="py-2 px-3 text-center cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSortPont("varPont")}>
                        Variação {sortFieldPont === "varPont" ? (sortDirPont === "asc" ? "▲" : "▼") : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tabelaPontuacaoOrdenada.map(item => {
                      const cor = cores[item.nome];
                      
                      let pontText = "-";
                      let pontColor = "text-gray-500";
                      if (item.varPont > 0) {
                        pontText = `▲ +${item.varPont}`;
                        pontColor = "text-green-600 font-semibold";
                      } else if (item.varPont < 0) {
                        pontText = `▼ ${item.varPont}`;
                        pontColor = "text-red-600 font-semibold";
                      } else if (item.pIni !== null) {
                        pontText = "0";
                        pontColor = "text-gray-500";
                      }

                      return (
                        <tr key={item.nome} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-3 font-medium flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cor }} />
                            {item.nome}
                          </td>
                          <td className="py-2 px-3 text-center">{item.pIni !== null ? item.pIni : "-"}</td>
                          <td className="py-2 px-3 text-center">{item.pFin !== null ? item.pFin : "-"}</td>
                          <td className={`py-2 px-3 text-center ${pontColor}`}>{pontText}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
