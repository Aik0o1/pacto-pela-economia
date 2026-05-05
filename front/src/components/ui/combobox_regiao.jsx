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
import regioesData from "../../assets/municipios_regioes.json";

const normalize = (str) => {
  return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
};

export function ComboboxRegiao({ onRegiaoSelect, regiaoSelecionada }) {
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

        // Build regions list from the fetched cities
        const nomesToIds = {};
        data.forEach(c => {
          nomesToIds[normalize(c.nome)] = c.id;
        });

        const regioesMap = {};
        Object.entries(regioesData).forEach(([cityName, regionName]) => {
          const cityId = nomesToIds[normalize(cityName)];
          if (cityId) {
            if (!regioesMap[regionName]) {
              regioesMap[regionName] = [];
            }
            regioesMap[regionName].push(cityId);
          }
        });

        // Add the regions to the top of the selectable list
        const regionOptions = Object.entries(regioesMap).map(([regName, idsArray]) => ({
          id: `Território: ${regName}`, // Let the backend resolve this
          nome: `Território: ${regName}`, // Prefix "Território: " to differentiate visually
          isRegion: true,
          cidadesIds: idsArray // Keep the array for local map rendering
        }));

        setCidades(regionOptions);
      } catch (error) {
        console.error("Erro ao buscar dados do CouchDB:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!regiaoSelecionada?.nome?.startsWith("Território:")) {
      setValue("");
    } else if (regiaoSelecionada?.nome?.startsWith("Território:")) {
      setValue(regiaoSelecionada.nome);
    }
  }, [regiaoSelecionada]);

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
    clearHighlightOnMap();
    onRegiaoSelect(cidade);
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
            {value || "Selecione um território"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Pesquisar território" />
          <CommandList>
            {cidades.length === 0 && (
              <CommandEmpty>Carregando territórios...</CommandEmpty>
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
