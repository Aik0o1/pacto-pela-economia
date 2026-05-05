import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import React, { useState, useEffect } from "react";
import * as d3 from "d3";
import PieChart from "../graphs/PieChart"
import { ChartPie } from 'lucide-react';

export default function GraficoPorte() {
    const [dados, setDados] = useState(null);

    useEffect(() => {
        // Carrega o JSON usando D3 e salva no estado
        d3.json("../teresina.json").then((data) => {
            setDados(data); // Salva os dados no estado
        });
    }, []);

    if (!dados) {
        return <p>Carregando...</p>;
    }

    let portes = dados["Portes"].map((item, index) => (
        <li key={index}>
            <div className="indicador">
                <div className="label">
                    <p>{item.Tipo || "N/A"}</p>
                </div>
                <p className="valor">{item[1] || "N/A"}</p>
            </div>
        </li>
    ));

    return (
        <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
                <AccordionTrigger>
                    <ChartPie />
                    Empresas por Natureza Jurídica
                </AccordionTrigger>
                <AccordionContent>
                    <PieChart />
                    {/* <LinePlot data={[1, 5, 64848, 2563, 666]} /> */}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}
