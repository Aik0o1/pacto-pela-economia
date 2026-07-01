import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const MESES_ABREV = { Jan:1, Fev:2, Mar:3, Abr:4, Mai:5, Jun:6, Jul:7, Ago:8, Set:9, Out:10, Nov:11, Dez:12 };

function parseLabel(l) {
  if (!l) return 0;
  const [m, y] = l.split("/");
  return parseInt(y) * 100 + (MESES_ABREV[m] || 0);
}

export default function GraficoComparativoPontuacao({ dadosPorCidade, cidadesSelecionadas, cores }) {
  const svgRef = useRef();
  const containerRef = useRef();
  const tooltipRef = useRef();

  const desenhar = useCallback(() => {
    if (!dadosPorCidade || cidadesSelecionadas.length === 0 || !containerRef.current) return;

    const todosLabels = [...new Set(
      cidadesSelecionadas.flatMap(c => (dadosPorCidade[c] || []).map(d => d.label))
    )].sort((a, b) => parseLabel(a) - parseLabel(b));

    if (todosLabels.length === 0) return;

    const totalWidth = containerRef.current.clientWidth;
    const isMobile = totalWidth < 500;
    const height = 260;
    const margin = { top: 28, right: 20, bottom: isMobile ? 60 : 44, left: 44 };
    const W = totalWidth - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", totalWidth).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(todosLabels).range([0, W]).padding(0.5);
    const y = d3.scaleLinear().domain([0, 100]).range([H, 0]);

    g.selectAll(".grid-line")
      .data(y.ticks(5))
      .enter().append("line")
      .attr("class", "grid-line")
      .attr("x1", 0).attr("x2", W)
      .attr("y1", d => y(d)).attr("y2", d => y(d))
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "3,3");

    const xAxis = g.append("g")
      .attr("transform", `translate(0,${H})`)
      .call(d3.axisBottom(x).tickSize(0));
    xAxis.select(".domain").attr("stroke", "#d1d5db");
    xAxis.selectAll("text")
      .style("font-size", "10px").style("fill", "#6b7280")
      .attr("dy", isMobile ? "0.5em" : "1.2em")
      .attr("dx", isMobile ? "-0.8em" : "0")
      .attr("transform", isMobile ? "rotate(-40)" : null)
      .style("text-anchor", isMobile ? "end" : "middle");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickSize(0))
      .call(ax => ax.select(".domain").remove())
      .selectAll("text").style("font-size", "10px").style("fill", "#6b7280");

    const tooltip = d3.select(tooltipRef.current);

    const line = d3.line()
      .x(d => x(d.label))
      .y(d => y(d.pontuacao_total))
      .defined(d => d.pontuacao_total != null)
      .curve(d3.curveMonotoneX);

    cidadesSelecionadas.forEach(cidade => {
      const dados = (dadosPorCidade[cidade] || []).filter(d => todosLabels.includes(d.label));
      const cor = cores[cidade] || "#999";

      if (dados.length > 1) {
        g.append("path")
          .datum(dados)
          .attr("fill", "none")
          .attr("stroke", cor)
          .attr("stroke-width", 2)
          .attr("opacity", 0.85)
          .attr("d", line);
      }

      g.selectAll(null)
        .data(dados)
        .enter().append("circle")
        .attr("cx", d => x(d.label))
        .attr("cy", d => y(d.pontuacao_total))
        .attr("r", 5)
        .attr("fill", cor)
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
          d3.select(this).attr("r", 7);
          const [mx, my] = d3.pointer(event, containerRef.current);

          const linhas = cidadesSelecionadas
            .map(c => {
              const ponto = (dadosPorCidade[c] || []).find(x => x.label === d.label);
              if (!ponto) return null;
              return `<div style="display:flex;align-items:center;gap:6px;margin-top:3px">
                <span style="color:${cores[c] || '#999'};font-size:10px">●</span>
                <span style="color:#374151">${c}: <strong>${ponto.pontuacao_total}</strong></span>
              </div>`;
            })
            .filter(Boolean)
            .join("");

          tooltip
            .style("display", "block")
            .html(
              `<div style="font-weight:600;color:#4b5563;margin-bottom:4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">${d.label}</div>` +
              linhas
            );

          const tooltipWidth = tooltipRef.current ? tooltipRef.current.offsetWidth : 180;
          const leftPosition = mx + tooltipWidth + 20 > totalWidth ? mx - tooltipWidth - 14 : mx + 14;
          tooltip
            .style("left", `${leftPosition}px`)
            .style("top", `${my - 10}px`);
        })
        .on("mousemove", function(event) {
          const [mx, my] = d3.pointer(event, containerRef.current);
          const tooltipWidth = tooltipRef.current ? tooltipRef.current.offsetWidth : 180;
          const leftPosition = mx + tooltipWidth + 20 > totalWidth ? mx - tooltipWidth - 14 : mx + 14;
          tooltip.style("left", `${leftPosition}px`).style("top", `${my - 10}px`);
        })
        .on("mouseout", function() {
          d3.select(this).attr("r", 5);
          tooltip.style("display", "none");
        });
    });
  }, [dadosPorCidade, cidadesSelecionadas, cores]);

  useEffect(() => {
    desenhar();
    const observer = new ResizeObserver(() => desenhar());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [desenhar]);

  if (!dadosPorCidade || cidadesSelecionadas.length === 0) return null;

  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm font-medium text-[#231f20] mb-3">Evolução Comparativa da Pontuação</p>
      <div ref={containerRef} className="w-full overflow-hidden relative">
        <svg ref={svgRef} className="w-full" />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs z-50"
          style={{ display: "none", minWidth: "180px", maxWidth: "260px" }}
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {cidadesSelecionadas.map(cidade => (
          <div key={cidade} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cores[cidade] || "#999" }} />
            <span className="text-xs text-gray-600">{cidade}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
