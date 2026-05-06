import { Trophy } from "lucide-react";
import {
  AccordionItem,
  Accordion,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";

/**
 * Componente de Ranking de Municípios
 * 
 * @param {Object} props
 * @param {string} props.municipio - Nome do município selecionado
 * @param {Array} props.ranking - Array com dados do ranking [{posicao, codigo, municipio, quantidade}]
 * @param {string} props.tipo - Tipo do ranking: "abertas" ou "ativas"
 */
export default function RankingMunicipios({ municipio, ranking, tipo = "abertas", isTerritorio }) {
  // Define os textos baseados no tipo
  const textos = {
    abertas: {
      titulo: "Abertura de Empresas por Município (mês)",
      coluna: "Qtd. Aberturas",
      percentual: "% Aberturas em Relação ao Total",
    },
    ativas: {
      titulo: "Empresas Ativas por Município (mês)",
      coluna: "Qtd. Ativas",
      percentual: "% Ativas em Relação ao Total",
    },
  };

  const { titulo, coluna, percentual } = textos[tipo] || textos.abertas;

  // Se for um município específico (não Piauí e não Território), não exibe o ranking
  if (municipio !== "Piauí" && !isTerritorio) {
    return null;
  }

  // Renderiza o ranking para o estado (Piauí) ou Território - Lista de municípios
  const renderRankingLista = () => (
    <div className="overflow-y-auto max-h-96 border rounded-md shadow-sm bg-white">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="sticky top-0 z-20 text-xs text-gray-700 uppercase bg-gray-100 shadow-sm">
          <tr>
            <th className="px-4 py-3 text-center">Posição</th>
            <th className="px-4 py-3">Município</th>
            <th className="px-4 py-3 text-right">{coluna}</th>
            <th className="px-4 py-3 text-right">{percentual}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {ranking.map((item, index) => (
            <tr
              key={item.codigo_ibge || index}
              className="bg-white hover:bg-blue-50/50 transition-colors"
            >
              <td className="px-4 py-3 text-center w-24">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs bg-gray-100 text-gray-600">
                  {item.posicao || index + 1}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900 uppercase tracking-tight">
                {item.localidade}
              </td>
              <td className="px-4 py-3 text-right font-bold text-[#034ea2]">
                {(item.total || 0).toLocaleString("pt-BR")}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-700">
                {item.percentual ? `${item.percentual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Accordion type="single" collapsible className="border rounded-lg">
      <AccordionItem value="ranking" className="border-none">
        <AccordionTrigger className="flex items-center gap-3 p-4 hover:bg-gray-50 text-[#231f20]">
          <Trophy className="h-5 w-5 text-[#034ea2]" />
          <span className="font-medium">{titulo}</span>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
          {!ranking || (Array.isArray(ranking) && ranking.length === 0) ? (
            <p className="text-gray-500 text-center py-4">Sem dados de ranking</p>
          ) : (
            renderRankingLista()
          )}
          {Array.isArray(ranking) && ranking.length > 5 && (
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-400 italic">Role para ver a lista completa</p>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}