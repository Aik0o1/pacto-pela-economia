import React, { useMemo } from "react";

export default function TabelaSetorizadaAtividades({ secoesData }) {
  // 1. Prepara os dados agrupados e calcula totais por setor com ordenação decrescente
  const { grupos, totalGeral } = useMemo(() => {
    if (!secoesData) return { grupos: [], totalGeral: 0 };
    // Função para garantir que a lista seja um array e ordenar do maior para o menor
    const prepararSetor = (lista) => 
      (Array.isArray(lista) ? [...lista] : []).sort((a, b) => b.value - a.value);

    const setoresRaw = [
      { nome: "Serviços", dados: prepararSetor(secoesData.servico), cor: "bg-blue-600", textoCor: "text-blue-700" },
      { nome: "Comércio", dados: prepararSetor(secoesData.comercio), cor: "bg-green-600", textoCor: "text-green-700" },
      { nome: "Indústria", dados: prepararSetor(secoesData.industria), cor: "bg-orange-600", textoCor: "text-orange-700" },
      { nome: "-", dados: prepararSetor(secoesData["-"]), cor: "bg-gray-600", textoCor: "text-gray-700" },
    ];

    // Calcula o total geral somando todos os setores
    const total = setoresRaw.reduce((acc, grupo) => 
      acc + grupo.dados.reduce((sum, item) => sum + (Number(item.value) || 0), 0), 0
    );

    // Mapeia os totais específicos e percentuais de cada seção
    const gruposProcessados = setoresRaw.map(grupo => ({
      ...grupo,
      totalSetor: grupo.dados.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
    }));

    return { grupos: gruposProcessados, totalGeral: total };
  }, [secoesData]);

  if (totalGeral === 0) {
    return <p className="text-center text-gray-500 py-10">Sem dados para exibir.</p>;
  }

  return (
    <div className="border rounded-lg shadow-sm bg-white overflow-hidden flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="sticky top-0 bg-gray-50 text-[10px] text-gray-400 uppercase border-b z-20 shadow-sm">
            <tr>
              <th className="px-4 py-3">Setor / Atividades Econômicas no Setor</th>
              <th className="px-4 py-3 text-right">Qtd. Aberturas</th>
              <th className="px-4 py-3 text-right">% Aberturas em Relação ao Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {grupos.map((grupo) => {
              if (grupo.dados.length === 0) return null;

              const percentSetor = totalGeral > 0 ? ((grupo.totalSetor / totalGeral) * 100).toFixed(1) : "0";

              return (
                <React.Fragment key={grupo.nome}>
                  {/* Cabeçalho do Setor com Totalizador e Percentual */}
                  <tr className="bg-gray-100/95 sticky top-[41px] z-10 border-y border-gray-200">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${grupo.cor}`}></div>
                        <span className="font-extrabold text-gray-800 uppercase text-[11px] tracking-wider">
                          {grupo.nome}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-extrabold text-gray-900">
                      {grupo.totalSetor.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${grupo.cor.replace('bg-', 'bg-opacity-10 ')} ${grupo.textoCor}`}>
                        {percentSetor}% do total
                      </span>
                    </td>
                  </tr>
                  
                  {/* Atividades ordenadas de forma decrescente */}
                  {grupo.dados.map((item, index) => {
                    const percentTotal = totalGeral > 0 ? ((item.value / totalGeral) * 100).toFixed(1) : "0";
                    return (
                      <tr key={`${grupo.nome}-${index}`} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-10 py-2.5 leading-tight text-gray-700">
                          {item.label}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-[#034ea2]">
                          {Number(item.value).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-400 text-xs font-mono">
                          {percentTotal}%
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-gray-100 border-t flex justify-between items-center">
        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
            Total Consolidado (Estado)
        </span>
        <span className="font-extrabold text-[#034ea2] text-xl">
          {totalGeral.toLocaleString("pt-BR")}
        </span>
      </div>
    </div>
  );
}