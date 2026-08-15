import React, { useState, useEffect, useCallback } from 'react';
import { Autoriza, Stats } from './types';
import { listarAutoriza, enviarParaBanco, emitirBanco, baixarBanco, obterStats } from './services/api';
import FiltroBar from './components/FiltroBar';
import BoletoList from './components/BoletoList';
import BoletoDetalhe from './components/BoletoDetalhe';

const filtrosIniciais = {
  banco: '',
  sucesso: '',
  numapo: '',
  inicio: '',
  fim: '',
};

export default function App() {
  const [boletos, setBoletos] = useState<Autoriza[]>([]);
  const [boletoSelecionado, setBoletoSelecionado] = useState<Autoriza | null>(null);
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [stats, setStats] = useState<Stats | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const TAMANHO_PAGINA = 50;

  const carregarDados = useCallback(async (pag?: number) => {
    setCarregando(true);
    setErro(null);
    const pg = pag !== undefined ? pag : pagina;
    try {
      const [dadosRes, statsDados] = await Promise.all([
        listarAutoriza({ ...filtros, page: pg, size: TAMANHO_PAGINA }),
        obterStats()
      ]);
      setBoletos(dadosRes.content);
      setTotalPaginas(dadosRes.totalPages);
      setTotalRegistros(dadosRes.totalElements);
      setPagina(dadosRes.currentPage);
      setStats(statsDados);
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar dados');
    } finally {
      setCarregando(false);
    }
  }, [filtros, pagina]);

  useEffect(() => {
    carregarDados(0);
  }, []);

  const handleBuscar = () => {
    setPagina(0);
    carregarDados(0);
  };

  const handleLimpar = () => {
    setFiltros(filtrosIniciais);
    setPagina(0);
    setTimeout(() => carregarDados(0), 0);
  };

  const handleEnviar = async (id: number) => {
    setEnviando(true);
    try {
      const resultado = await enviarParaBanco(id);
      alert(resultado.sucesso ? 'Consulta realizada com sucesso!' : `Erro: ${resultado.mensagem}`);
      await carregarDados();
      if (boletoSelecionado && boletoSelecionado.id === id) {
        const atualizado = boletos.find(b => b.id === id);
        if (atualizado) setBoletoSelecionado(atualizado);
      }
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const handleEmitir = async (id: number) => {
    if (!confirm('Emitir boleto no banco?')) return;
    setEnviando(true);
    try {
      const resultado = await emitirBanco(id);
      alert(resultado.sucesso ? 'Boleto emitido com sucesso!' : `Erro: ${resultado.mensagem}`);
      await carregarDados();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const handleBaixar = async (id: number) => {
    if (!confirm('Baixar este boleto? Esta acao nao pode ser desfeita.')) return;
    setEnviando(true);
    try {
      const resultado = await baixarBanco(id);
      alert(resultado.sucesso ? 'Boleto baixado com sucesso!' : `Erro: ${resultado.mensagem}`);
      await carregarDados();
      setBoletoSelecionado(null);
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const irParaPagina = (novaPagina: number) => {
    setPagina(novaPagina);
    carregarDados(novaPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Boletos SPR</h1>
              <p className="text-sm text-gray-500">Ambiente de Homologacao</p>
            </div>
          </div>
          <button
            onClick={() => carregarDados()}
            disabled={carregando}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${carregando ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Atualizar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-xl">database</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">{stats.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="material-symbols-outlined text-blue-600 text-xl">send</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Enviados</p>
                  <p className="text-lg font-bold text-gray-900">{stats.enviados.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="material-symbols-outlined text-green-600 text-xl">check_circle</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sucesso</p>
                  <p className="text-lg font-bold text-gray-900">{(stats.sucesso1 + stats.sucessoOK).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="material-symbols-outlined text-yellow-600 text-xl">pending</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pendentes</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(stats.total - stats.enviados).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <FiltroBar
          filtros={filtros}
          onChange={setFiltros}
          onBuscar={handleBuscar}
          onLimpar={handleLimpar}
        />

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-600">error</span>
            <span className="text-sm text-red-700">{erro}</span>
          </div>
        )}

        {/* Lista */}
        <BoletoList
          boletos={boletos}
          onSelecionar={setBoletoSelecionado}
          onEnviar={handleEnviar}
          onEmitir={handleEmitir}
          carregando={carregando}
        />

        {/* Paginacao */}
        {totalPaginas > 1 && (
          <div className="bg-white rounded-lg border border-gray-200 mt-4 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Pagina {pagina + 1} de {totalPaginas} ({totalRegistros.toLocaleString()} registros)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => irParaPagina(0)}
                disabled={pagina === 0}
                className="px-2 py-1 text-sm rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <span className="material-symbols-outlined text-[16px]">first_page</span>
              </button>
              <button
                onClick={() => irParaPagina(pagina - 1)}
                disabled={pagina === 0}
                className="px-2 py-1 text-sm rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                const start = Math.max(0, Math.min(pagina - 2, totalPaginas - 5));
                const p = start + i;
                if (p >= totalPaginas) return null;
                return (
                  <button
                    key={p}
                    onClick={() => irParaPagina(p)}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      p === pagina
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p + 1}
                  </button>
                );
              })}
              <button
                onClick={() => irParaPagina(pagina + 1)}
                disabled={pagina >= totalPaginas - 1}
                className="px-2 py-1 text-sm rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
              <button
                onClick={() => irParaPagina(totalPaginas - 1)}
                disabled={pagina >= totalPaginas - 1}
                className="px-2 py-1 text-sm rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <span className="material-symbols-outlined text-[16px]">last_page</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal Detalhe */}
      {boletoSelecionado && (
        <BoletoDetalhe
          boleto={boletoSelecionado}
          onClose={() => setBoletoSelecionado(null)}
          onEnviar={handleEnviar}
          onEmitir={handleEmitir}
          onBaixar={handleBaixar}
          enviando={enviando}
        />
      )}
    </div>
  );
}
