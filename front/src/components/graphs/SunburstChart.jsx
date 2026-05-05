import React, { useEffect, useRef, useMemo, useState } from "react";
import * as d3 from "d3";

function D3SunburstChart({ data, width, height, colorScale }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || width === 0 || height === 0) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const root = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    const partition = d3.partition()
      .size([2 * Math.PI, radius]);

    partition(root);

    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 - 1);

    const arcHover = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 + 5);

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

    const segments = svg
      .selectAll("path")
      .data(root.descendants().filter(d => d.depth && d.value > 0))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => {
        // Pega a categoria raiz (nível 1)
        const category = d.depth === 1 ? d.data.name : d.parent.data.name;
        return colorScale(category);
      })
      .attr("fill-opacity", d => d.depth === 1 ? 0.9 : 0.7)
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover)
          .attr("fill-opacity", 1);

        const percent = ((d.value / root.value) * 100).toFixed(1);
        const path = d.ancestors().reverse().slice(1).map(n => n.data.name).join(" → ");
        
        tooltip.style("opacity", 1).html(
          `<strong>${path}</strong><br/>
           Quantidade: ${d.value.toLocaleString('pt-BR')}<br/>
           Percentual: ${percent}%`
        );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 10}px`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc)
          .attr("fill-opacity", d => d.depth === 1 ? 0.9 : 0.7);
        
        tooltip.style("opacity", 0);
      });

    // Adicionar labels para o nível 1 (categorias principais) - NOME
    svg
      .selectAll("text.category-name")
      .data(root.descendants().filter(d => d.depth === 1 && d.value > 0))
      .enter()
      .append("text")
      .attr("class", "category-name")
      .attr("transform", d => {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "-0.3em") // Posiciona acima do centro
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "700")
      .style("fill", "white")
      .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
      .style("pointer-events", "none")
      .text(d => d.data.name);

    // Adicionar percentuais para o nível 1 - PERCENTUAL
    svg
      .selectAll("text.category-percent")
      .data(root.descendants().filter(d => d.depth === 1 && d.value > 0))
      .enter()
      .append("text")
      .attr("class", "category-percent")
      .attr("transform", d => {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "1em") // Posiciona abaixo do centro
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", "white")
      .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)")
      .style("pointer-events", "none")
      .text(d => {
        const percent = ((d.value / root.value) * 100).toFixed(1);
        return `${percent}%`;
      });

    return () => d3.selectAll(".chart-tooltip").remove();
  }, [data, width, height, colorScale]);

  return <svg ref={svgRef}></svg>;
}

export default function SunburstCard({ title, rawData }) {
  const chartContainerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

  // Escala de cores personalizada
  const colorScale = useMemo(() => {
    return d3.scaleOrdinal()
      .domain(["Comercio", "Industria", "Servico", "Não Classificado"])
      .range(["#10b981", "#ef4444", "#3b82f6", "#6b7280"]);
  }, []);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const newWidth = entry.contentRect.width;
        setDimensions({ width: newWidth, height: Math.min(newWidth, 400) });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Converter formato do backend para formato hierárquico do D3
  const hierarchicalData = useMemo(() => {
    if (!rawData) return null;

    return {
      name: "Total",
      children: Object.entries(rawData)
        .map(([categoria, itens]) => {
          // Filtrar itens vazios ou com valor 0
          const validItems = itens.filter(item => item.value && item.value > 0);
          
          // Se não há itens válidos, retornar null
          if (validItems.length === 0) return null;

          return {
            name: categoria === "-" ? "Não Classificado" : categoria.charAt(0).toUpperCase() + categoria.slice(1),
            children: validItems.map(item => ({
              name: item.label,
              value: item.value
            }))
          };
        })
        .filter(category => category !== null) // Remove categorias nulas
    };
  }, [rawData]);

  // Agrupar legenda por categoria
  const legendByCategory = useMemo(() => {
    if (!rawData) return {};

    const result = {};
    
    // Calcular total apenas de itens com valor
    const totalSum = Object.values(rawData).reduce((acc, itens) => 
      acc + itens.reduce((sum, item) => sum + (item.value || 0), 0), 0
    );

    Object.entries(rawData).forEach(([categoria, itens]) => {
      // Filtrar apenas itens com valor
      const validItems = itens.filter(item => item.value && item.value > 0);
      
      // Se não há itens válidos, pular esta categoria
      if (validItems.length === 0) return;

      const categoryName = categoria === "-" ? "Não Classificado" : categoria.charAt(0).toUpperCase() + categoria.slice(1);
      const categoryTotal = validItems.reduce((sum, item) => sum + item.value, 0);
      
      result[categoryName] = {
        color: colorScale(categoryName),
        total: categoryTotal,
        percent: ((categoryTotal / totalSum) * 100).toFixed(2),
        items: validItems.map(item => ({
          label: item.label,
          value: item.value,
          percent: ((item.value / totalSum) * 100).toFixed(2)
        })).sort((a, b) => b.value - a.value)
      };
    });

    return result;
  }, [rawData, colorScale]);

  if (!rawData || !hierarchicalData || hierarchicalData.children.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p>Não há dados para exibir.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow-sm">
      <h3 className="text-sm font-bold text-gray-700 uppercase p-2 text-center mb-2 bg-gray-100">
        {title}
      </h3>
      
      <div 
        ref={chartContainerRef} 
        className="w-full h-[400px] flex justify-center items-center mb-4"
      >
        <D3SunburstChart 
          data={hierarchicalData} 
          width={dimensions.width} 
          height={dimensions.height}
          colorScale={colorScale}
        />
      </div>

      
    </div>
  );
}
