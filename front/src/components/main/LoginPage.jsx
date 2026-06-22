import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const senhaCorreta = import.meta.env.VITE_ACCESS_PASSWORD;

  const handleSubmit = (e) => {
    e.preventDefault();
    setCarregando(true);

    setTimeout(() => {
      if (senha === senhaCorreta) {
        sessionStorage.setItem("autenticado", "1");
        onLogin();
      } else {
        setErro(true);
        setSenha("");
      }
      setCarregando(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-[#034ea2] text-xl font-semibold">
            Dados Empresariais — JUCEPI
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Acesso restrito. Informe a senha para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => { setSenha(e.target.value); setErro(false); }}
            className={`w-full border rounded-lg px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#034ea2] transition [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-900 [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] ${
              erro ? "border-red-400" : "border-gray-300"
            }`}
            autoFocus
          />

          {erro && (
            <p className="text-red-500 text-xs text-center">Senha incorreta. Tente novamente.</p>
          )}

          <button
            type="submit"
            disabled={!senha || carregando}
            className="w-full bg-[#034ea2] hover:bg-[#023b7a] disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition"
          >
            {carregando ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
