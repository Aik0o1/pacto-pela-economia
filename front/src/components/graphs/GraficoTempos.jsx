import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const DOC_LABELS = {
  al: "Alvará de Localização",
  as: "Alvará Sanitário",
  cp: "Consulta Prévia",
  im: "Inscrição Municipal",
};

const DOC_COLORS = {
  al: "#034ea2",
  as: "#e63946",
  cp: "#2a9d8f",
  im: "#f4a261",
};

function toHoras(str) {
  if (!str) return null;
  const m = str.match(/^(\d+):(\d{2}):(\d{2})/);
  if (!m) return null;
  const total = parseInt(m[1]) + parseInt(m[2]) / 60 + parseInt(m[3]) / 3600;
  return total > 0 ? total : null;
}

function formatLabel(h) {
  if (h === null) return "-";
  const hours = Math.floor(h);
  const min = Math.round((h - hours) * 60);
  if (hours === 0) return `${min}min`;
  if (min === 0) return `${hours}h`;
  return `${hours}h${min}min`;
}

export default function GraficoTempos({ dados }) {
  const svgRef = useRef();
  const containerRef = useRef();
  const tooltipRef = useRef();

  const categoriasAtivas = Object.keys(DOC_LABELS).filter((cat) =>
    dados.some((d) => toHoras(d.tempos_detalhes?.[cat]) !== null)
  );

  const desenhar = useCallback(() => {
    if (!dados || dados.length === 0 || !containerRef.current) return;
    if (categoriasAtivas.length === 0) return;

    const totalWidth = containerRef.current.clientWidth;
    const isMobile = totalWidth < 400;
    const legendHeight = Math.ceil(categoriasAtivas.length / 2) * 22;
    const height = 250 + legendHeight;
    const margin = {
      top: 28,
      right: 20,
      bottom: (isMobile ? 60 : 44) + legendHeight,
      left: 56,
    };
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

    const allValues = dados.flatMap((d) =>
      categoriasAtivas.map((cat) => toHoras(d.tempos_detalhes?.[cat])).filter((v) => v !== null)
    );
    const maxVal = d3.max(allValues) || 1;

    const y = d3.scaleLinear()
      .domain([0, maxVal * 1.15])
      .range([H, 0]);

    // Grade horizontal
    g.selectAll(".grid-line")
      .data(y.ticks(5))
      .enter()
      .append("line")
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

    // Eixo Y
    g.append("g")
      .call(
        d3.axisLeft(y)
          .ticks(5)
          .tickSize(0)
          .tickFormat((d) => `${d.toFixed(0)}h`)
      )
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#6b7280");

    const tooltip = d3.select(tooltipRef.current);

    // Uma linha por categoria — filtra só os pontos com dado para não quebrar o traçado
    categoriasAtivas.forEach((cat) => {
      const color = DOC_COLORS[cat];
      // Linha percorre todos os meses; meses sem dado ficam em zero
      const line = d3.line()
        .x((d) => x(d.label))
        .y((d) => y(toHoras(d.tempos_detalhes?.[cat]) ?? 0))
        .curve(d3.curveLinear);

      g.append("path")
        .datum(dados)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("d", line);

      // Círculos apenas nos meses com dado real
      dados.forEach((d) => {
        const val = toHoras(d.tempos_detalhes?.[cat]);
        if (val === null) return;

        g.append("circle")
          .attr("cx", x(d.label))
          .attr("cy", y(val))
          .attr("r", 5)
          .attr("fill", color)
          .attr("stroke", "white")
          .attr("stroke-width", 1.5)
          .style("cursor", "pointer")
          .on("mouseover", function (event) {
            d3.select(this).attr("r", 7);
            const [mx, my] = d3.pointer(event, containerRef.current);
            tooltip
              .style("display", "block")
              .style("left", `${mx + 14}px`)
              .style("top", `${my - 36}px`)
              .html(
                `<div style="font-weight:600;margin-bottom:3px;color:#374151">${d.label}</div>` +
                `<div style="color:${color}">${DOC_LABELS[cat]}: <strong>${formatLabel(val)}</strong></div>`
              );
          })
          .on("mouseout", function () {
            d3.select(this).attr("r", 5);
            tooltip.style("display", "none");
          });
      });
    });

    // Legenda
    const legendY = H + (isMobile ? 62 : 48);
    const colW = W / 2;
    categoriasAtivas.forEach((cat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const lx = col * colW;
      const ly = legendY + row * 22;

      g.append("line")
        .attr("x1", lx).attr("x2", lx + 16)
        .attr("y1", ly + 1).attr("y2", ly + 1)
        .attr("stroke", DOC_COLORS[cat])
        .attr("stroke-width", 2.5);

      g.append("circle")
        .attr("cx", lx + 8).attr("cy", ly + 1)
        .attr("r", 4)
        .attr("fill", DOC_COLORS[cat]);

      g.append("text")
        .attr("x", lx + 22)
        .attr("y", ly + 5)
        .style("font-size", "10px")
        .style("fill", "#374151")
        .text(DOC_LABELS[cat]);
    });
  }, [dados, categoriasAtivas]);

  useEffect(() => {
    desenhar();
    const observer = new ResizeObserver(() => desenhar());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [desenhar]);

  if (!dados || dados.length === 0 || categoriasAtivas.length === 0) return null;

  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm font-medium text-[#231f20] mb-3">
        Evolução dos Tempos de Análise
      </p>
      <div ref={containerRef} className="w-full overflow-hidden relative">
        <svg ref={svgRef} className="w-full" />
        <div
          ref={tooltipRef}
          style={{
            display: "none",
            position: "absolute",
            pointerEvents: "none",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            zIndex: 10,
            whiteSpace: "nowrap",
          }}
        />
      </div>
    </div>
  );
}
