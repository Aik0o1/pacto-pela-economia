import { Separator } from "../ui/separator";
import React from 'react';
import logo from "../../assets/imgs/logo-rodape.png"
import logoVertical from "../../assets/imgs/logoVertical.png"

const Footer = () => {
  return (
    <footer className="footer bg-blue-800 text-white">
      <div className="grid grid-cols-4">

        <div className="h-3 sm:h-3 bg-yellow-500"></div>
        <div className="h-3 sm:h-3 bg-red-700"></div>
        <div className="h-3 sm:h-3 bg-green-700"></div>
        <div className="h-3 sm:h-3 bg-blue-800"></div>
        <div className="h-3 sm:h-3"></div>

      </div>
      <div className="content mx-auto p-8">
        <div className="footer-container flex gap-10 justify-center">
          {/* Logo Section */}
          <div>
            <img src={logo} alt="Governo do Piaui" className="h-20" />
          </div>

          {/* Orgão Section */}
          <div>
            <h3 className="font-semibold mb-4">Órgão</h3>
            <p className="text-sm">
              Junta Comercial do Estado do Piauí<br />
              CNPJ 06.690.994/0001-00<br /><br />
              Rua General Osório, 3002 - Cabral<br />
              Teresina/PI CEP: 64000-580<br /><br />
              jucepi@jucepi.pi.gov.br
            </p>
          </div>

          {/* Atendimento Section */}
          <div>
            <h3 className="font-semibold mb-4">Atendimento</h3>
            <p className="text-sm">
              Horário:<br />
              De segunda a sexta-feira (exceto feriado),<br />
              das 07h30 às 13h30.<br /><br />
              Telefones:<br />
              Telefone suporte: (86) 3230-8810
            </p>
          </div>

          {/* Social Media Section */}
          <div >
            <h3 className="font-semibold mb-4">Siga Nossas Redes</h3>
            <div className="redes space-y-2 flex flex-col gap-3">
              <a target="_blank" href="https://x.com/jucepidigital" className="flex items-center gap-2 text-sm hover:text-black">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                Twitter
              </a>
              <a target="_blank" href="https://www.facebook.com/jucepidigital" className="flex items-center gap-2 text-sm hover:text-blue-500">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>
                Facebook
              </a>
              <a target="_blank" href="https://www.instagram.com/jucepidigital/" className="flex items-center gap-2 text-sm hover:text-pink-500">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                Instagram
              </a>
              <a target="_blank" href="https://www.youtube.com/@jucepidigital" className="flex items-center gap-2 text-sm hover:text-red-500">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                YouTube
              </a>
            </div>
          </div>

          {/* outros Serviços */}
          <div>
            <h3 className="font-semibold mb-4">Nossos Sites</h3>
            <div className="redes space-y-2 flex flex-col gap-3 pl-1">
              <a target="_blank" href="https://portal.pi.gov.br/jucepi/" className="flex items-center gap-2 text-sm hover:text-green-500">
                JUCEPI
              </a>

              <a target="_blank" href="https://www.piauidigital.pi.gov.br/home/" className="flex items-center gap-2 text-sm hover:text-green-500">
                Gov.PI Empresas
              </a>

              <a target="_blank" href="https://painelempresarial.jucepi.pi.gov.br/" className="flex items-center gap-2 text-sm hover:text-green-500">
                Painel Empresarial
              </a>
              <a target="_blank" href="https://www.piauidigital.pi.gov.br/mapa-empresas/ranking-municipal" className="flex items-center gap-2 text-sm hover:text-green-500">
                Ranking Municipal 
              </a>
              <a target="_blank" href="https://rankingnacional.jucepi.pi.gov.br/" className="flex items-center gap-2 text-sm hover:text-green-500">
                Ranking Nacional
              </a>
              <a target="_blank" href="https://rankingmunicipal.jucepi.pi.gov.br/" className="flex items-center gap-2 text-sm hover:text-green-500">
                Ranking Municipal (anual)
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-8 pt-8 border-t border-blue-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">Copyright © 2026 JUCEPI. Todos os Direitos Reservados.</p>
            <div className="flex items-center gap-2 text-sm">
              <span>Desenvolvido por:</span>
              <img src={logoVertical} alt="JUCEPI" className="h-8" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
