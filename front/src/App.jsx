import './App.css';
import './Mapa.css';
import Abas from './components/main/Tabs';
import { useState, useEffect, useCallback } from 'react';
import Header from './components/main/Header';
import Footer from './components/main/Footer';
import PiauiMapa from './components/main/Mapa';
import Filtros from './components/main/Filtros';
import LoginPage from './components/main/LoginPage';

function MainContent() {
  const [cidade, setCidade] = useState({ nome: 'Selecione uma localidade', id: '' });
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ativas");

  // Estado do filtro de intervalo (aba Evolução)
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [periodos, setPeriodos] = useState([]);

  // Estado do filtro de intervalo (aba Evolução Geral)
  const [periodoInicioGeral, setPeriodoInicioGeral] = useState("");
  const [periodoFimGeral, setPeriodoFimGeral] = useState("");
  const [periodosGeral, setPeriodosGeral] = useState([]);

  // Municípios selecionados na aba Evolução Geral (compartilhado com o mapa)
  const [cidadesSelecionadasGeral, setCidadesSelecionadasGeral] = useState([]);
  const [municipiosGeral, setMunicipiosGeral] = useState([]);

  const toggleCidadeGeral = useCallback((nome) => {
    setCidadesSelecionadasGeral(prev =>
      prev.includes(nome) ? prev.filter(c => c !== nome) : [...prev, nome]
    );
  }, []);

  const handleMunicipiosGeralCarregados = useCallback((municipios) => {
    setMunicipiosGeral(municipios);
    setCidadesSelecionadasGeral(prev =>
      prev.length === 0 ? municipios.slice(0, 2).map(c => c.nome) : prev
    );
  }, []);

  const resetCidadesGeral = useCallback(() => {
    setCidadesSelecionadasGeral(municipiosGeral.slice(0, 2).map(c => c.nome));
  }, [municipiosGeral]);

  const handleCidadeSelecionada = useCallback((novaCidade) => {
    setCidade(prev => {
      const parseId = (item) => {
        if (!item?.id) return "";
        const str = String(item.id);
        return str.startsWith("cidade-") ? str.replace("cidade-", "") : str;
      };

      const novoId = parseId(novaCidade);
      const novoNome = novaCidade?.nome || "";
      const prevId = parseId(prev);
      const prevNome = prev?.nome || "";

      if (novoId === prevId && novoNome === prevNome) {
        return prev;
      }
      return novaCidade;
    });
  }, []);

  const apiUrl = import.meta.env.VITE_URL_API;
  const apiToken = import.meta.env.VITE_API_TOKEN;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${apiUrl}/data_recente`, {
          method: "GET",
          headers: { 'Authorization': `Bearer ${apiToken}` }
        });
        const data = await response.json();

        const meses = [
          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        setMes(meses[parseInt(data.mes, 10) - 1]);
        setAno(data.ano);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar dados do servidor:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "ranking" && String(cidade?.id || "").startsWith("territorio:")) {
      setCidade({ nome: 'Selecione uma localidade', id: '' });
    }
  }, [activeTab, cidade]);

  const handlePeriodosChange = (lista) => {
    setPeriodos(lista);
    if (lista.length === 0) return;
    setPeriodoFim(prev => prev || lista[lista.length - 1].value);
    setPeriodoInicio(prev => {
      if (prev) return prev;
      const idx = Math.max(0, lista.length - 6);
      return lista[idx].value;
    });
  };

  const handlePeriodosGeralChange = (lista) => {
    setPeriodosGeral(lista);
    if (lista.length === 0) return;
    setPeriodoFimGeral(prev => prev || lista[lista.length - 1].value);
    setPeriodoInicioGeral(prev => {
      if (prev) return prev;
      const idx = Math.max(0, lista.length - 6);
      return lista[idx].value;
    });
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header />
      <Filtros
        onCidadeSelecionada={handleCidadeSelecionada}
        onMesSelecionado={setMes}
        onAnoSelecionado={setAno}
        selectedMonth={mes}
        selectedYear={ano}
        cidadeSelecionada={cidade}
        activeTab={activeTab}
        periodos={periodos}
        periodoInicio={periodoInicio}
        periodoFim={periodoFim}
        onPeriodoInicioChange={setPeriodoInicio}
        onPeriodoFimChange={setPeriodoFim}
        periodosGeral={periodosGeral}
        periodoInicioGeral={periodoInicioGeral}
        periodoFimGeral={periodoFimGeral}
        onPeriodoInicioGeralChange={setPeriodoInicioGeral}
        onPeriodoFimGeralChange={setPeriodoFimGeral}
        onResetCidadesGeral={resetCidadesGeral}
      />
      <div className="conteudo flex-1">
        <PiauiMapa
          onCidadeSelecionada={handleCidadeSelecionada}
          cidadeSelecionada={cidade}
          activeTab={activeTab}
          cidadesSelecionadasGeral={cidadesSelecionadasGeral}
          onToggleCidadeGeral={toggleCidadeGeral}
        />
        <Abas
          cidadeSelecionada={cidade}
          mes={mes}
          ano={ano}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          periodoInicio={periodoInicio}
          periodoFim={periodoFim}
          onPeriodosChange={handlePeriodosChange}
          periodoInicioGeral={periodoInicioGeral}
          periodoFimGeral={periodoFimGeral}
          onPeriodosGeralChange={handlePeriodosGeralChange}
          cidadesSelecionadasGeral={cidadesSelecionadasGeral}
          onCidadesSelecionadasGeralChange={setCidadesSelecionadasGeral}
          onMunicipiosGeralCarregados={handleMunicipiosGeralCarregados}
        />
      </div>
      <Footer />
    </div>
  );
}

function App() {
  const [autenticado, setAutenticado] = useState(
    () => sessionStorage.getItem("autenticado") === "1"
  );

  if (!autenticado) {
    return <LoginPage onLogin={() => setAutenticado(true)} />;
  }

  return <MainContent />;
}

export default App;
