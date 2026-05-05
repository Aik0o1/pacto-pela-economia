import { Check, ChevronsUpDown } from "lucide-react";
import { useState, useEffect } from "react";
import * as d3 from "d3";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ComboboxCidades({ onCidadeSelect, cidadeSelecionada }) {
  const [open, setOpen] = useState(false);
  const [cidades, setCidades] = useState([]);
  const [value, setValue] = useState("");

  const apiUrl = import.meta.env.VITE_URL_API;
  const apiToken = import.meta.env.VITE_API_TOKEN;


  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `${apiUrl}/id_nome_cidades`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        });
        const data = await response.json();
        setCidades(data);
      } catch (error) {
        console.error("Erro ao buscar dados do CouchDB:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (cidadeSelecionada?.nome?.startsWith("Território:") || cidadeSelecionada?.nome === "Selecione uma localidade") {
      setValue("");
    } else if (cidadeSelecionada?.nome) {
      setValue(cidadeSelecionada.nome);
    }
  }, [cidadeSelecionada]);

  const highlightCityOnMap = (cidade) => {
    const svg = d3.select("#map");

    svg
      .selectAll(".city")
      .classed("selected", false)
      .classed("no-selected", true)
      .transition()
      .duration(300);

    const cityElement = svg.select(`#cidade-${cidade.id}`);
    if (!cityElement.empty()) {
      cityElement
        .classed("selected", true)
        .classed("no-selected", false)
        .transition()
        .duration(300);
    }
  };

  const clearHighlightOnMap = () => {
    const svg = d3.select("#map");
    // Clear d3 selection logic, leaflet will handle the map itself primarily
    svg
      .selectAll(".city")
      .classed("selected", false)
      .classed("no-selected", true)
      .transition()
      .duration(300);
  };

  const handleSelect = (cidade) => {
    setValue(cidade.nome);
    setOpen(false);
    highlightCityOnMap(cidade);
    onCidadeSelect(cidade);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between h-auto py-2"
        >
          <span className="text-left flex-1 break-words mr-2 whitespace-normal">
            {value || "Selecione uma localidade"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Pesquisar localidade" />
          <CommandList>
            {cidades.length === 0 && (
              <CommandEmpty>Carregando cidades...</CommandEmpty>
            )}
            {cidades.length > 0 && (
              <CommandGroup>
                {cidades.map((cidade) => (
                  <CommandItem
                    key={cidade.id}
                    onSelect={() => handleSelect(cidade)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === cidade.nome ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {cidade.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
