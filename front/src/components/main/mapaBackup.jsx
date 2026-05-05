import React, { useState, Fragment, useRef, useEffect } from 'react'
import * as d3 from "d3";
import readXlsxFile from 'read-excel-file';
import Papa from 'papaparse';
function PiauiMapa({ onCidadeSelecionada, onCsvData}) {
    const [csvData, setCsvData] = useState([]);
    const [cidadeSelecionada, setCidade] = useState(null)

    const svgRef = useRef(null);
    
    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid gray")
        .style("padding", "5px")
        .style("display", "none");

    useEffect(() => {
        fetch('https://raw.githubusercontent.com/Aik0o1/mapa-piaui-react/refs/heads/main/src/assets/docs/dados.csv')
            .then(response => response.text())
            .then(text => {
                Papa.parse(text, {
                    complete: (dados) => {
                        setCsvData(dados.data);
                    },
                    header: true, 
                });
            });
    }, []);

    useEffect(() => {
        if (cidadeSelecionada) {
            console.log(`Cidade selecionada no estado: ${cidadeSelecionada}`);
        }
    }, [cidadeSelecionada]);

    useEffect(() => {
        if (csvData.length === 0) return;
        onCsvData(csvData)

        const svg = d3.select(svgRef.current);

        csvData.forEach((city) => {
            svg.select(`#${city.ID}`)
                .attr("class", "city")
                .on("mouseover", function (event) {
                    d3.select(this).classed("highlight", true);
                    tooltip.style("display", "block")
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY + 10}px`)
                        .html(`
                            <strong>${city.ID.replace(/-/g, " ")}</strong><br>
                            População: ${city.Populacao.toLocaleString()}
                        `);
                })
                .on("mouseout", function () {
                    d3.select(this).classed("highlight", false);
                    tooltip.style("display", "none");
                })
                .on("click", function () {
                    svg.selectAll(".city").classed("selected", false);
                    d3.select(this).classed("selected", true);
                    console.log(`Cidade selecionada: ${city.ID.replace(/-/g, " ")}`);
                    setCidade(city)
                    onCidadeSelecionada(city)
                    window.location.hash = city.ID
                });
        });

        return () => {
            tooltip.remove();
        };
    }, [csvData, onCidadeSelecionada]);



    return (
        <Fragment >
            <div id="map-container" className="w-1/3  mx-auto">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 145500 194500"
                    className="w-full h-auto"
                    ref={svgRef}
                    id="map"
                >

                </svg>
            </div>
        </Fragment>
    )
}

export default PiauiMapa  