import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Lista from "./Lista";
import ListaAtivas from "./ListaAtivas";
import ListaRanking from "./ListaRanking";
import AbaEvolucao from "./AbaEvolucao";
import AbaEvolucaoGeral from "./AbaEvolucaoGeral";

export default function Abas({
  cidadeSelecionada,
  mes,
  ano,
  activeTab,
  setActiveTab,
  periodoInicio,
  periodoFim,
  onPeriodosChange,
  periodoInicioGeral,
  periodoFimGeral,
  onPeriodosGeralChange,
  cidadesSelecionadasGeral,
  onCidadesSelecionadasGeralChange,
  onMunicipiosGeralCarregados,
}) {
  return (
    <Tabs className="w-full px-2 lg:px-0 lg:pr-6" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="
        w-full
        place-items-center
        text-center
        grid
        grid-cols-3
        sm:grid-cols-5
        h-auto
        p-1
        gap-2
      ">
        <TabsTrigger value="ativas" className="text-xs w-full sm:text-sm py-2 sm:py-3">
          <span className="hidden sm:inline">Empresas Ativas</span>
          <span className="sm:hidden">Ativas</span>
        </TabsTrigger>
        <TabsTrigger value="abertas" className="text-xs sm:text-sm w-full py-2 sm:py-3">
          <span className="hidden sm:inline">Abertura de Empresas</span>
          <span className="sm:hidden">Abertas</span>
        </TabsTrigger>
        <TabsTrigger value="ranking" className="text-xs sm:text-sm py-2 w-full sm:py-3">
          Ranking
        </TabsTrigger>
        <TabsTrigger value="evolucao" className="text-xs sm:text-sm py-2 w-full sm:py-3">
          Evolução
        </TabsTrigger>
        <TabsTrigger value="evolucao_geral" className="text-xs sm:text-sm py-2 w-full sm:py-3">
          <span className="hidden sm:inline">Evolução Geral</span>
          <span className="sm:hidden">Ev. Geral</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ativas" className="mt-4">
        <ListaAtivas onCidadeSelecionada={cidadeSelecionada} />
      </TabsContent>

      <TabsContent value="abertas" className="mt-4">
        <Lista onCidadeSelecionada={cidadeSelecionada} mes={mes} ano={ano} />
      </TabsContent>

      <TabsContent value="ranking" className="mt-4">
        <ListaRanking
          onCidadeSelecionada={cidadeSelecionada}
          mes={mes}
          ano={ano}
        />
      </TabsContent>

      <TabsContent value="evolucao" className="mt-4">
        <AbaEvolucao
          cidadeSelecionada={cidadeSelecionada}
          periodoInicio={periodoInicio}
          periodoFim={periodoFim}
          onPeriodosChange={onPeriodosChange}
        />
      </TabsContent>

      <TabsContent value="evolucao_geral" className="mt-4">
        <AbaEvolucaoGeral
          periodoInicio={periodoInicioGeral}
          periodoFim={periodoFimGeral}
          onPeriodosChange={onPeriodosGeralChange}
          cidadesSelecionadas={cidadesSelecionadasGeral}
          onCidadesSelecionadasChange={onCidadesSelecionadasGeralChange}
          onMunicipiosCarregados={onMunicipiosGeralCarregados}
        />
      </TabsContent>
    </Tabs>
  );
}
