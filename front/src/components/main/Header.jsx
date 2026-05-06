import React, { useState, useEffect } from "react";

export default function Header() {
  const apiUrl = import.meta.env.VITE_URL_API;
  const apiToken = import.meta.env.VITE_API_TOKEN;

  const [dataAtualizacao, setDataAtualizacao] = useState("Carregando...");

  useEffect(() => {
    const fetchDataAtualizacao = async () => {
      try {
        const responseRecente = await fetch(`${apiUrl}/data_recente`, {
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        });

        if (!responseRecente.ok) {
          throw new Error("Erro ao buscar data recente");
        }

        const { atualizado_em } = await responseRecente.json();

        if (atualizado_em) {
          const dataObj = new Date(atualizado_em);
          const formatada = dataObj.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
          setDataAtualizacao(formatada);
        } else {
          setDataAtualizacao("Não disponível");
        }
      } catch (error) {
        console.error("Erro ao buscar última atualização:", error);
        setDataAtualizacao("Não disponível");
      }
    };

    fetchDataAtualizacao();
  }, []);

  return (
    <header className="header bg-white shadow-md py-4 px-6 flex items-center justify-between md:flex-row flex-col">
      <div className="flex items-center justify-center gap-4">
        <img
          src="https://portal.pi.gov.br/jucepi/wp-content/uploads/sites/47/2023/03/jucepi_logo-768x177.jpg"
          alt="JUCEPI Logo"
          className="h-16 object-contain"
        />
        <h1 className="text-[#034ea2] text-2xl font-semibold">
          Dados Empresariais
        </h1>
      </div>

      <span className="text-[#034ea2] font-bold">
        Última Atualização: {dataAtualizacao}
      </span>
    </header>
  );
}
