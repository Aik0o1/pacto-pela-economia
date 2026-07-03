import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

export default function GraficoEvolucao({ dados }) {
  const svgRef = useRef();
  const containerRef = useRef();

  const desenhar = useCallback(() => {
    if (!dados || dados.length === 0 || !containerRef.current) return;

    const totalWidth = containerRef.current.clientWidth;
    const isMobile = totalWidth < 400;
    const height = 230;
    const margin = { top: 28, right: 20, bottom: isMobile ? 60 : 44, left: 44 };
    const W = totalWidth - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", totalWidth).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint()
      .domain(dados.map((d) => d.label))
      .range([0, W])
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([H, 0]);

    // Linhas de grade horizontais
    g.selectAll(".grid-line")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0).attr("x2", W)
      .attr("y1", (d) => y(d)).attr("y2", (d) => y(d))
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "3,3");

    // Eixo X — labels rotacionadas em mobile para evitar sobreposição
    const xAxis = g.append("g")
      .attr("transform", `translate(0,${H})`)
      .call(d3.axisBottom(x).tickSize(0));

    xAxis.select(".domain").attr("stroke", "#d1d5db");

    xAxis.selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#6b7280")
      .attr("dy", isMobile ? "0.5em" : "1.2em")
      .attr("dx", isMobile ? "-0.8em" : "0")
      .attr("transform", isMobile ? "rotate(-40)" : null)
      .style("text-anchor", isMobile ? "end" : "middle");

    // Eixo Y
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickSize(0))
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#6b7280");

    // Cor dos pontos conforme a faixa de pontuação
    const corPonto = (p) => {
      if (p > 75) return "#008000";
      if (p > 50) return "#FFFF00";
      if (p > 25) return "#FF991C";
      return "#FF0000";
    };

    // Linha de evolução
    if (dados.length > 1) {
      const line = d3
        .line()
        .x((d) => x(d.label))
        .y((d) => y(d.pontuacao_total))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(dados)
        .attr("fill", "none")
        .attr("stroke", "#034ea2")
        .attr("stroke-width", 2.5)
        .attr("d", line);
    }

    // Pontos coloridos
    g.selectAll(".dot")
      .data(dados)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.label))
      .attr("cy", (d) => y(d.pontuacao_total))
      .attr("r", 7)
      .attr("fill", (d) => corPonto(d.pontuacao_total))
      .attr("stroke", "#034ea2")
      .attr("stroke-width", 2);

    // Rótulo da pontuação acima de cada ponto
    g.selectAll(".score-label")
      .data(dados)
      .enter()
      .append("text")
      .attr("class", "score-label")
      .attr("x", (d) => x(d.label))
      .attr("y", (d) => y(d.pontuacao_total) - 14)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#034ea2")
      .text((d) => (d.pontuacao_total > 0 ? d.pontuacao_total : ""));

    // Indicadores de variação de pontuação entre os meses
    for (let i = 1; i < dados.length; i++) {
      const pPrev = dados[i - 1].pontuacao_total;
      const pCurr = dados[i].pontuacao_total;
      if (pPrev === null || pPrev === undefined || pCurr === null || pCurr === undefined) continue;

      const delta = pCurr - pPrev; // Atual menos anterior
      const x1 = x(dados[i - 1].label);
      const x2 = x(dados[i].label);
      const y1 = y(pPrev);
      const y2 = y(pCurr);

      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;

      let text = "";
      let bgColor = "";
      let textColor = "";

      if (delta > 0) {
        text = `▲${delta}`;
        bgColor = "#def7ec";
        textColor = "#03543f";
      } else if (delta < 0) {
        text = `▼${Math.abs(delta)}`;
        bgColor = "#fde8e8";
        textColor = "#9b1c1c";
      } else {
        text = "=";
        bgColor = "#f3f4f6";
        textColor = "#4b5563";
      }

      const textLength = text.length;
      const rectW = textLength === 1 ? 16 : textLength === 2 ? 28 : textLength === 3 ? 34 : 40;
      const rectH = 16;

      const badge = g.append("g")
        .attr("transform", `translate(${cx},${cy - 12})`);

      badge.append("rect")
        .attr("x", -rectW / 2)
        .attr("y", -rectH / 2)
        .attr("width", rectW)
        .attr("height", rectH)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", bgColor)
        .attr("stroke", "white")
        .attr("stroke-width", 1);

      badge.append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("y", 0.5)
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", textColor)
        .text(text);
    }
  }, [dados]);

  useEffect(() => {
    desenhar();

    const observer = new ResizeObserver(() => desenhar());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [desenhar]);

  if (!dados || dados.length === 0) return null;

  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm font-medium text-[#231f20] mb-3">
        Evolução da Pontuação
      </p>
      <div ref={containerRef} className="w-full relative">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  );
}
