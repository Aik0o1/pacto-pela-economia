const COLUNAS = [
  { key: "automatizados", label: "Automático" },
  { key: "0_24h",         label: "0 a 24h" },
  { key: "24_48h",        label: "24h a 48h" },
  { key: "48h_1sem",      label: "48h a 1 semana" },
  { key: "1sem_1mes",     label: "1 semana a 1 mês" },
  { key: "mais_1mes",     label: "Mais de 1 mês" },
  { key: "total",         label: "Total", destaque: true },
];

const CATEGORIAS = {
  cp: "Consulta Prévia",
  im: "Inscrição Municipal",
  al: "Alvará de Localização",
  as: "Alvará Sanitário",
};

export default function TabelaTempos({ faixasTempos, quantidadeAnalise }) {
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
    <div className="border rounded-lg p-4">
      <p className="text-sm font-medium text-[#231f20] mb-4">
        Distribuição dos Tempos de Análise por Categoria
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">
                Categoria
              </th>
              {COLUNAS.map((c) => (
                <th
                  key={c.key}
                  className={`text-center py-3 px-3 font-semibold whitespace-nowrap ${
                    c.destaque ? "text-[#034ea2]" : "text-gray-700"
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
                className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <td className="py-3 px-3 font-medium text-[#034ea2] whitespace-nowrap">
                  {label}
                </td>

                {COLUNAS.map((c) => (
                  <td
                    key={c.key}
                    className={`text-center py-3 px-3 ${
                      c.destaque ? "font-bold text-[#034ea2]" : "text-gray-700"
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
