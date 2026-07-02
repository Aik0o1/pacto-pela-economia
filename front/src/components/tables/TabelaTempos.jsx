const COLUNAS = [
  { key: "automatizados", label: "Auto" },
  { key: "0_24h",         label: "0-24h" },
  { key: "24_48h",        label: "24-48h" },
  { key: "48h_1sem",      label: "2-7 dias" },
  { key: "1sem_1mes",     label: "8-30 dias" },
  { key: "mais_1mes",     label: "+30 dias" },
  { key: "total",         label: "Total", destaque: true },
];

const CATEGORIAS = {
  cp: "Consulta Prévia",
  im: "Inscrição Municipal",
  al: "Alvará de Localização",
  as: "Alvará Sanitário",
};

export default function TabelaTempos({ faixasTempos, quantidadeAnalise, hasOuterBox = true }) {
  if (!faixasTempos || Object.keys(faixasTempos).length === 0) {
    return (
      <p className="text-center text-gray-400 text-sm py-4">
        Sem dados de distribuição de tempos.
      </p>
    );
  }

  const rows = Object.entries(CATEGORIAS).map(([cat, label]) => {
    const faixas = faixasTempos[cat] || {};
    const total = COLUNAS.filter(c => !c.destaque).reduce(
      (s, c) => s + (faixas[c.key] || 0),
      0
    );
    return { cat, label, faixas, total };
  });

  return (
    <div className={hasOuterBox ? "border rounded-lg p-4 bg-white shadow-sm" : ""}>
      {hasOuterBox && (
        <p className="text-sm font-medium text-[#231f20] mb-4">
          Distribuição dos Tempos de Análise por Categoria
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[10px] text-gray-400 uppercase border-b">
              <th className="py-2 px-2 font-semibold tracking-wider">
                Categoria
              </th>
              {COLUNAS.map((c) => (
                <th
                  key={c.key}
                  className={`text-center py-2 px-2 font-semibold tracking-wider ${
                    c.destaque ? "text-[#034ea2]" : ""
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map(({ cat, label, faixas, total }, i) => (
              <tr
                key={cat}
                className={`border-b last:border-0 hover:bg-blue-50/20 transition-colors ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                }`}
              >
                <td className="py-2.5 px-2 font-medium text-gray-700 leading-tight">
                  {label}
                </td>

                {COLUNAS.map((c) => (
                  <td
                    key={c.key}
                    className={`text-center py-2.5 px-2 ${
                      c.destaque ? "font-bold text-[#034ea2]" : "text-gray-600"
                    }`}
                  >
                    {c.destaque ? total : (faixas[c.key] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
