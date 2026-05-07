import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

export default function GraficoEvolucaoPosicao({ dados }) {
  const svgRef = useRef();
  const containerRef = useRef();

  const desenhar = useCallback(() => {
    if (!dados || dados.length === 0 || !containerRef.current) return;

    const totalWidth = containerRef.current.clientWidth;
    const isMobile = totalWidth < 400;
    const height = 230;
    const margin = { top: 28, right: 20, bottom: isMobile ? 60 : 44, left: 40 };
    const W = totalWidth - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", totalWidth).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const maxPos = Math.max(...dados.map((d) => d.posicao || 1));

    const x = d3.scalePoint()
      .domain(dados.map((d) => d.label))
      .range([0, W])
      .padding(0.5);

    // Y invertido: posição 1 fica no topo (melhor)
    const y = d3.scaleLinear()
      .domain([maxPos + 0.5, 0.5])
      .range([H, 0]);

    // Grade horizontal
    const ticks = d3.range(1, maxPos + 1);
    g.selectAll(".grid-line")
      .data(ticks)
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0).attr("x2", W)
      .attr("y1", (d) => y(d)).attr("y2", (d) => y(d))
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "3,3");

    // Eixo X
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

    // Linha de evolução
    if (dados.length > 1) {
      const line = d3.line()
        .x((d) => x(d.label))
        .y((d) => y(d.posicao))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(dados)
        .attr("fill", "none")
        .attr("stroke", "#034ea2")
        .attr("stroke-width", 2.5)
        .attr("d", line);
    }

    // Pontos
    g.selectAll(".dot")
      .data(dados)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.label))
      .attr("cy", (d) => y(d.posicao))
      .attr("r", 7)
      .attr("fill", "#034ea2")
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    // Rótulo da posição acima do ponto
    g.selectAll(".pos-label")
      .data(dados)
      .enter()
      .append("text")
      .attr("class", "pos-label")
      .attr("x", (d) => x(d.label))
      .attr("y", (d) => y(d.posicao) - 12)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "#034ea2")
      .text((d) => (d.posicao ? `${d.posicao}º` : ""));
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
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[#231f20]">Evolução da Posição</p>
      </div>
      <div ref={containerRef} className="w-full overflow-hidden">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  );
}
