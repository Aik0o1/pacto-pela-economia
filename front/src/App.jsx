import './App.css';
import './Mapa.css';
import Abas from './components/main/Tabs';
import { useState, useEffect, useReducer } from 'react';
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

  const apiUrl = import.meta.env.VITE_URL_API;
  const apiToken = import.meta.env.VITE_API_TOKEN

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${apiUrl}/data_recente`, {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        });

        const data = await response.json(); // Recebe o JSON no formato { "mes": "MM", "ano": "AAAA" }

        const meses = [
          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];

        const mesRecente = meses[parseInt(data.mes, 10) - 1]; // Converte número do mês para nome
        const anoRecente = data.ano;

        setMes(mesRecente);
        setAno(anoRecente);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar dados do servidor:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // If we switch to the ranking tab and a region is currently selected, clear it
    if (activeTab === "ranking" && String(cidade?.id || "").startsWith("territorio:")) {
      setCidade({ nome: 'Selecione uma localidade', id: '' });
    }
  }, [activeTab, cidade]);

  if (loading) {
    return <div>Carregando...</div>; // Exibe uma mensagem de carregamento enquanto os dados não chegam
  }

  const handleCidade = (cidade) => {
    setCidade(cidade);
  };

  const handleMes = (mes) => {
    setMes(mes);
  };

  const handleAnoSelecionado = (ano) => {
    setAno(ano);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">

      <Header />
      <Filtros
        onCidadeSelecionada={handleCidade}
        onMesSelecionado={handleMes}
        onAnoSelecionado={handleAnoSelecionado}
        selectedMonth={mes}
        selectedYear={ano}
        cidadeSelecionada={cidade}
        activeTab={activeTab}
      />
      <div className="conteudo flex-1">
        <PiauiMapa
          onCidadeSelecionada={handleCidade}
          cidadeSelecionada={cidade}
        />

        <Abas
          cidadeSelecionada={cidade}
          mes={mes}
          ano={ano}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

      </div>


      <Footer />
    </div>
  );
}

export default MainContent;
