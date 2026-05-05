import React, { useEffect, useRef, useMemo, useState } from "react";
import * as d3 from "d3";

function D3PieChart({ data, width, height }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || width === 0 || height === 0) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = 10;
    const radius = Math.min(width, height) / 2 - margin;
    const colors = d3.scaleOrdinal(d3.schemeSet3);

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie().value((d) => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(0).outerRadius(radius + 8);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "chart-tooltip") 
      .style("position", "absolute")
      .style("opacity", 0)
      .style("background", "rgba(0,0,0,0.8)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "4px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("z-index", 1000);

    const segments = svg.selectAll("path").data(pie(data)).enter().append("g");

    segments
      .append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => colors(i))
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("d", arcHover);
        const total = d3.sum(data, (d) => d.value);
        const percent = (d.data.value / total * 100).toFixed(2);
        tooltip.style("opacity", 1).html(
          `<strong>${d.data.label}</strong><br/>
           Quantidade: ${d.data.value.toLocaleString('pt-BR')}<br/>
           Percentual: ${percent}%`
        );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 10}px`);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("d", arc);
        tooltip.style("opacity", 0);
      });

    segments
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#333")
      .style("pointer-events", "none")
      .text((d) => {
        const total = d3.sum(data, (d) => d.value);
        const percent = (d.data.value / total) * 100;
        return percent >= 10 ? `${percent.toFixed(0)}%` : "";
      });

    return () => d3.selectAll(".chart-tooltip").remove();
  }, [data, width, height]);

  return <svg ref={svgRef}></svg>;
}

export default function ChartCard({
  title,
  data,
}) {
  const colors = d3.scaleOrdinal(d3.schemeSet3);

  
  const chartContainerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 280 }); 

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const newWidth = entry.contentRect.width;
        setDimensions({ width: newWidth, height: Math.min(newWidth, 280) });
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []); 



  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data].sort((a, b) => b.value - a.value);
  }, [data]);

  const legendData = useMemo(() => {
    if (!sortedData || sortedData.length === 0) return [];
    const total = d3.sum(sortedData, (d) => d.value);
    return sortedData.map((d, i) => ({
      ...d,
      percent: (d.value / total * 100).toFixed(2),
      color: colors(i),
    }));
  }, [sortedData]);

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p>Não há dados para exibir.</p>
      </div>
    );
  }

  return (
    <div className=" border rounded-lg shadow-sm ">

      <h3 className="text-sm font-bold text-gray-700 uppercase p-2 text-center mb-2 bg-gray-100">
  {title}
</h3>
      <div 
        ref={chartContainerRef} 
        className="w-full h-[280px] flex justify-center items-center mb-4"
      >
        <D3PieChart 
          data={sortedData} 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      </div>

      <div className=" pt-4 p-6">
      <div className="border-t pt-4 p-6"/>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Legenda</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {legendData.map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
              <div
                className="w-4 h-4 rounded flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate" title={item.label}>
                  {item.label}
                </div>
                <div className="text-xs text-gray-500">
                  {item.value.toLocaleString('pt-BR')} ({item.percent}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}