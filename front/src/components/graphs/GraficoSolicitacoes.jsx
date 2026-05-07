import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const CORES = {
  solicitacoes: "#034ea2",
  atendimentos: "#2a9d8f",
};

const LABELS = {
  solicitacoes: "Solicitações",
  atendimentos: "Atendimentos",
};

export default function GraficoSolicitacoes({ dados }) {
  const svgRef = useRef();
  const containerRef = useRef();
  const tooltipRef = useRef();

  const desenhar = useCallback(() => {
    if (!dados || dados.length === 0 || !containerRef.current) return;

    const dadosValidos = dados.filter(
      (d) => d.indice_atendimentos_detalhes?.qtd_solicitacoes != null
    );
    if (dadosValidos.length === 0) return;

    const totalWidth = containerRef.current.clientWidth;
    const isMobile = totalWidth < 400;
    const margin = { top: 28, right: 20, bottom: isMobile ? 68 : 52, left: 50 };
    const height = 250;
    const W = totalWidth - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", totalWidth).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand()
      .domain(dadosValidos.map((d) => d.label))
      .range([0, W])
      .paddingInner(0.3)
      .paddingOuter(0.1);

    const x1 = d3.scaleBand()
      .domain(["solicitacoes", "atendimentos"])
      .range([0, x0.bandwidth()])
      .padding(0.06);

    const maxVal =
      d3.max(dadosValidos, (d) =>
        Math.max(
          d.indice_atendimentos_detalhes?.qtd_solicitacoes || 0,
          d.indice_atendimentos_detalhes?.qtd_atendimentos || 0
        )
      ) || 1;

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
      .call(d3.axisBottom(x0).tickSize(0));
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
      .call(d3.axisLeft(y).ticks(5).tickSize(0).tickFormat((d) => Math.round(d)))
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#6b7280");

    const tooltip = d3.select(tooltipRef.current);

    const groups = g.selectAll(".group")
      .data(dadosValidos)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${x0(d.label)},0)`);

    ["solicitacoes", "atendimentos"].forEach((key) => {
      groups
        .append("rect")
        .attr("x", x1(key))
        .attr("width", x1.bandwidth())
        .attr("y", (d) => {
          const val = d.indice_atendimentos_detalhes?.[`qtd_${key}`] || 0;
          return y(val);
        })
        .attr("height", (d) => {
          const val = d.indice_atendimentos_detalhes?.[`qtd_${key}`] || 0;
          return H - y(val);
        })
        .attr("fill", CORES[key])
        .attr("rx", 2)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("opacity", 0.75);
          const val = d.indice_atendimentos_detalhes?.[`qtd_${key}`] || 0;
          const [mx, my] = d3.pointer(event, containerRef.current);
          tooltip
            .style("display", "block")
            .style("left", `${mx + 14}px`)
            .style("top", `${my - 44}px`)
            .html(
              `<div style="font-weight:600;margin-bottom:3px;color:#374151">${d.label}</div>` +
              `<div style="color:${CORES[key]}">${LABELS[key]}: <strong>${val}</strong></div>`
            );
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity", 1);
          tooltip.style("display", "none");
        });
    });

    // Legenda
    const legendY = H + (isMobile ? 58 : 42);
    const colW = W / 2;
    Object.entries(LABELS).forEach(([key, label], i) => {
      const lx = i * colW;
      g.append("rect")
        .attr("x", lx)
        .attr("y", legendY - 5)
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", CORES[key])
        .attr("rx", 2);

      g.append("text")
        .attr("x", lx + 20)
        .attr("y", legendY + 6)
        .style("font-size", "10px")
        .style("fill", "#374151")
        .text(label);
    });
  }, [dados]);

  useEffect(() => {
    desenhar();
    const observer = new ResizeObserver(() => desenhar());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [desenhar]);

  const temDados = dados?.some(
    (d) => d.indice_atendimentos_detalhes?.qtd_solicitacoes != null
  );
  if (!temDados) return null;

  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm font-medium text-[#231f20] mb-3">
        Volume de Solicitações vs Atendimentos
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
