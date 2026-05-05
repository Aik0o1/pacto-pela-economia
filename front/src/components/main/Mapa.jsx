import React, { useState, useEffect } from "react";
import MapLeaflet from "./MapLeaflet";

function PiauiMapa({ onCidadeSelecionada, cidadeSelecionada }) {
  const [cidades, setAllCidades] = useState([]);
  const apiUrl = import.meta.env.VITE_URL_API;
  const apiToken = import.meta.env.VITE_API_TOKEN;

  // Buscar dados das cidades
  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `${apiUrl}/id_nome_cidades`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        });
        const data = await response.json();
        // Mantendo a compatibilidade de formato, embora o MapLeaflet trate o prefixo
        const normalizedCidades = data.map((cidade) => ({
          ...cidade,
          id: `cidade-${cidade.id}`,
        }));
        setAllCidades(normalizedCidades);
      } catch (error) {
        console.error("Erro ao buscar dados do CouchDB:", error);
      }
    };

    fetchData();
  }, [apiUrl, apiToken]);

  return (
    <div id="cidade-map-container" className="w-full h-auto p-4 bg-white rounded-lg shadow-sm">
      <MapLeaflet
        onCidadeSelecionada={onCidadeSelecionada}
        cidades={cidades}
        cidadeSelecionada={cidadeSelecionada}
      />
    </div>
  );
}

export default PiauiMapa;
