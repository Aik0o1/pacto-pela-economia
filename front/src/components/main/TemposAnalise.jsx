import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import React, { useState, useEffect } from "react";
import { Clock2 } from "lucide-react";

export default function TemposAnalise({ dados }) {
  // console.log(selectedCity);
  



  const cityData = dados;
  
  // Check if tempo-de-analise exists and has items
  if (!cityData?.["tempo-de-analise"]?.length) {
    return (
      <Accordion type="single" collapsible className="border rounded-lg">
        <AccordionItem value="item-1">
          <AccordionTrigger className="flex items-center gap-2">
            <Clock2 className="h-4 w-4" />
            <span>Tempos de Análise</span>
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
            <p className="text-gray-500">Nenhum tempo de análise registrado</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }
  if( cityData["tempo-de-analise"] != "Sem dados"){

  }
  const tempos = typeof cityData["tempo-de-analise"] === 'string' 
  ? (
    <li className="py-2">
      <div className="indicador flex justify-between items-center">
        <div className="label">
          <p className="font-medium">Tempo de Análise</p>
        </div>
        <p className="valor text-gray-600">{cityData["tempo-de-analise"] || "Sem dados"}</p>
      </div>
    </li>
  )
  : cityData["tempo-de-analise"]?.map((item, index) => (
    <li key={index} className="py-2">
      <div className="indicador flex justify-between items-center">
        <div className="label">
          <p className="font-medium">{item.tipo || "Sem dados"}</p>
        </div>
        <p className="valor text-gray-600">{item.tempo_analise || "Sem dados"}</p>
      </div>
    </li>
  ));

  return (
    <Accordion type="single" collapsible className="border rounded-lg">
      <AccordionItem value="item-1" className="border-none">
        <AccordionTrigger className="flex items-center gap-3 p-4 hover:bg-gray-50 text-[#231f20]">
          <Clock2 className="h-5 w-5 text-[#034ea2]" />
          <span className="font-medium">Tempos de Análise</span>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
          <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            <ul className="space-y-3">
              {typeof tempos === 'string' ? (
                <li className="py-2">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-[#231f20]">Tempo de Análise</p>
                    <p className="text-[#034ea2]">{tempos}</p>
                  </div>
                </li>
              ) : (
                tempos
              )}
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};