import './App.css';
import './Mapa.css';
import Abas from './components/main/Tabs';
import { useState, useEffect } from 'react';
import Header from './components/main/Header';
import Footer from './components/main/Footer';
import PiauiMapa from './components/main/Mapa';
import Filtros from './components/main/Filtros';

function MainContent() {
  const [cidade, setCidade] = useState({ nome: 'Selecione uma localidade', id: '' });
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ativas");

  // Estado do filtro de intervalo (aba Evolução)
  const [periodoInicio, setPeriodoInicio] = useState("12-2025");
  const [periodoFim, setPeriodoFim] = useState("");
  const [periodos, setPeriodos] = useState([]); // lista populada pelo AbaEvolucao

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

  // Quando os períodos disponíveis chegam (via AbaEvolucao), inicializa periodoFim
  const handlePeriodosChange = (lista) => {
    setPeriodos(lista);
    if (lista.length > 0 && !periodoFim) {
      setPeriodoFim(lista[lista.length - 1].value);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header />
      <Filtros
        onCidadeSelecionada={setCidade}
        onMesSelecionado={setMes}
        onAnoSelecionado={setAno}
        selectedMonth={mes}
        selectedYear={ano}
        cidadeSelecionada={cidade}
        activeTab={activeTab}
        // Intervalo (Evolução)
        periodos={periodos}
        periodoInicio={periodoInicio}
        periodoFim={periodoFim}
        onPeriodoInicioChange={setPeriodoInicio}
        onPeriodoFimChange={setPeriodoFim}
      />
      <div className="conteudo flex-1">
        <PiauiMapa onCidadeSelecionada={setCidade} cidadeSelecionada={cidade} />
        <Abas
          cidadeSelecionada={cidade}
          mes={mes}
          ano={ano}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          periodoInicio={periodoInicio}
          periodoFim={periodoFim}
          onPeriodosChange={handlePeriodosChange}
        />
      </div>
      <Footer />
    </div>
  );
}

export default MainContent;
