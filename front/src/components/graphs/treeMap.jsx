import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function HierarchicalTreeMap({ secoesData, title }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!secoesData) return;


    // Limpa o SVG anterior
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 1400;
    const height = 700;

    // Função para criar children a partir dos dados de cada setor
    const createChildren = (data, parentName) => {
      if (!data || !Array.isArray(data)) return [];
      return data
        .filter((item) => item.value !== null && item.value > 0)
        .map((item) => ({
          name: item.label,
          value: item.value,
          parent: parentName
        }));
    };
    // Cria a estrutura hierárquica
    const data = {
      name: "Total",
      children: [
        {
          name: "Comércio",
          color: "#16a34a",
          children: createChildren(secoesData.comercio, "Comércio")
        },
        {
          name: "Serviços",
          color: "#2563eb",
          children: createChildren(secoesData.servico, "Serviços")
        },
        {
          name: "Indústria",
          color: "#ea580c",
          children: createChildren(secoesData.industria, "Indústria")
        },
        {
          name: "Sem Classificação",
          color: "#6b7280",
          children: createChildren(secoesData["-"], "Sem Classificação")
        }
      ].filter(setor => setor.children.length > 0) // Remove setores sem dados
    };

    // Se não houver dados, não renderiza
    if (data.children.length === 0) return;

    const treemap = d3.treemap()
      .size([width, height])
      .padding(2)
      .round(true);

    const root = d3
      .hierarchy(data)
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value);

    treemap(root);

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Função para obter a cor baseada no setor pai
    const getColor = (d) => {
      // Se é um nó folha (atividade), pega a cor do pai
      if (!d.children) {
        let parent = d.parent;
        while (parent && !parent.data.color) {
          parent = parent.parent;
        }
        if (parent && parent.data.color) {
          // Varia a cor baseado no índice para criar tons diferentes
          const siblings = parent.children || [];
          const index = siblings.indexOf(d);
          const totalSiblings = siblings.length;

          const baseColor = d3.rgb(parent.data.color);
          const darkenFactor = index / Math.max(totalSiblings - 1, 1);

          return baseColor.darker(darkenFactor * 1.2).toString();
        }
      }
      // Se é um setor principal, usa a cor definida
      return d.data.color || "#999999";
    };

    // Renderiza apenas os nós folha (atividades) e os setores principais sem subdivisões
    const leaves = root.leaves();
    const sectorsWithoutChildren = root.descendants().filter(d =>
      d.depth === 1 && (!d.children || d.children.length === 0)
    );

    const nodesToRender = [...leaves, ...sectorsWithoutChildren];

    const cell = svg
      .selectAll("g")
      .data(nodesToRender)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    cell
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", getColor)
      .attr("opacity", 0.85)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Adiciona texto
    cell.each(function (d) {
      const rectWidth = d.x1 - d.x0;
      const rectHeight = d.y1 - d.y0;
      const cellGroup = d3.select(this);

      // Calcula tamanhos de fonte apropriados
      const minDimension = Math.min(rectWidth, rectHeight);
      const labelFontSize = Math.max(10, Math.min(14, minDimension / 8));
      const valueFontSize = Math.max(16, Math.min(24, minDimension / 4));

      // Nome da atividade ou setor
      const displayName = d.data.name;

      // Quebra o texto em palavras
      const words = displayName.split(/[,\s]+/);
      const maxCharsPerLine = Math.floor(rectWidth / (labelFontSize * 0.70));

      // Agrupa palavras em linhas
      const lines = [];
      let currentLine = "";

      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= maxCharsPerLine) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            lines.push(word.substring(0, maxCharsPerLine - 3) + "...");
          }
        }
      });
      if (currentLine) lines.push(currentLine);

      // Limita o número de linhas
      const lineHeight = labelFontSize + 3;
      const maxLines = Math.floor((rectHeight - valueFontSize - 25) / lineHeight);
      const finalLines = lines.slice(0, Math.max(1, maxLines));

      // Adiciona as linhas de texto
      const textGroup = cellGroup.append("g");

      finalLines.forEach((line, i) => {
        textGroup
          .append("text")
          .attr("x", 8)
          .attr("y", 18 + (i * lineHeight))
          .attr("text-anchor", "start")
          .attr("fill", "white")
          .style("font-size", `${labelFontSize}px`)
          .style("font-weight", "600")
          .style("text-transform", "uppercase")
          .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.7)")
          .text(line);
      });

      // Adiciona o valor
      if (d.value) {
        textGroup
          .append("text")
          .attr("x", 8)
          .attr("y", 18 + (finalLines.length * lineHeight) + 18)
          .attr("text-anchor", "start")
          .attr("fill", "#FFFFFF")
          .style("font-size", `${valueFontSize}px`)
          .style("font-weight", "bold")
          .style("text-shadow", "2px 2px 4px rgba(0,0,0,0.8)")
          .text(d.value.toLocaleString('pt-BR'));
      }
    });

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.9)")
      .style("color", "white")
      .style("padding", "12px 16px")
      .style("border-radius", "8px")
      .style("visibility", "hidden")
      .style("font-size", "14px")
      .style("z-index", "1000")
      .style("box-shadow", "0 4px 6px rgba(0,0,0,0.3)");

    cell
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).select("rect").attr("opacity", 1);

        // Descobre o setor pai
        let parent = d.parent;
        while (parent && parent.depth > 1) {
          parent = parent.parent;
        }
        const setorNome = parent && parent.depth === 1 ? parent.data.name : "Total";

        tooltip
          .style("visibility", "visible")
          .html(
            `<strong style="color: #FFD700; font-size: 11px;">${setorNome}</strong><br>
             
            <strong style="color: #FFF; font-size: 15px;">${d.data.name}</strong><br>
             <span style="font-size: 16px; margin-top: 6px; display: block;">Empresas: <strong style="color: #FFD700;">${d.value.toLocaleString('pt-BR')}</strong></span>`
          );
      })
      .on("mousemove", (event) => {
        const tooltipNode = tooltip.node();
        const tooltipWidth = tooltipNode ? tooltipNode.offsetWidth : 200;
        const windowWidth = window.innerWidth;

        // Se o tooltip ultrapassar a borda direita, mostra à esquerda
        const leftPosition = event.pageX + tooltipWidth + 30 > windowWidth
          ? event.pageX - tooltipWidth - 15
          : event.pageX + 15;

        tooltip
          .style("top", `${event.pageY + 15}px`)
          .style("left", `${leftPosition}px`);
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).select("rect").attr("opacity", 0.85);
        tooltip.style("visibility", "hidden");
      });

    // Cleanup
    return () => {
      d3.select("body").selectAll("div").filter(function () {
        return d3.select(this).style("position") === "absolute" &&
          d3.select(this).style("background").includes("rgba(0, 0, 0, 0.9)");
      }).remove();
    };
  }, [secoesData]);

  return (
    <div className="w-full">
      <div className="">

        <div className=" overflow-hidden">
          <svg ref={svgRef} style={{ width: "100%" }}></svg>
        </div>
      </div>
    </div>
  );
}