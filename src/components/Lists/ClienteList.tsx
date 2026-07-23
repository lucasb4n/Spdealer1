import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Localizar from 'components/Localizar';
import { ClientesService } from 'services/ClientesService';
import { formatarTelefone } from 'utils/formatters';
import './ClienteList.css';
import ClienteAnaliseFinanceiraModal from 'components/Modal/ClienteAnaliseFinanceiraModal';
import { API_BASE_URL } from 'services/apiConfig';

const ClienteList: React.FC = () => {
  const navigate = useNavigate();
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [niveisClientes, setNiveisClientes] = useState<Map<string, string>>(new Map());
  const [tendenciasClientes, setTendenciasClientes] = useState<Map<string, string>>(new Map());
  const [isAnaliseModalOpen, setIsAnaliseModalOpen] = useState(false);
  const [selectedCodigoCliente, setSelectedCodigoCliente] = useState<string>('');

  // Carregar clientes
  useEffect(() => {
    setLoading(true);
    const fetchClientes = async () => {
      try {
        const res = await ClientesService.getClientes();
        setDados(res);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
    // carregar niveis (mesma fonte usada pelo Receber)
    const loadNiveis = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/receber/niveis-clientes`);
        if (resp.ok) {
          const data = await resp.json();
          const mapN = new Map<string, string>();
          const mapT = new Map<string, string>();
          data.forEach((item: any) => {
            mapN.set(item.codigo_cli, item.nivel);
            mapT.set(item.codigo_cli, item.tendencia);
          });
          setNiveisClientes(mapN);
          setTendenciasClientes(mapT);
        }
      } catch (err) {
        console.error('Erro ao carregar niveis de clientes:', err);
      }
    };
    loadNiveis();
  }, []);

  // Colunas AG-Grid
  const columns = [
    {
      headerName: 'Nível',
      field: 'nivel',
      width: 130,
      pinned: 'left',
      cellRenderer: (params: any) => {
        const nivel = niveisClientes.get(params.data?.codigo_cli) || 'Bronze';
        const tendencia = tendenciasClientes.get(params.data?.codigo_cli) || 'estavel';
        let icon = '';
        let color = '';
        let trendIcon = '➡️';
        switch (nivel) {
          case 'Diamante':
            icon = '💎';
            color = '#0ea5e9';
            break;
          case 'Ouro':
            icon = '🥇';
            color = '#f59e0b';
            break;
          case 'Prata':
            icon = '🥈';
            color = '#94a3b8';
            break;
          default:
            icon = '🥉';
            color = '#a16207';
        }
        if (tendencia === 'melhorando') trendIcon = '↗️';
        else if (tendencia === 'piorando') trendIcon = '↘️';

        return (
          <span
            style={{ color, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            title={`Nível ${nivel} - Tendência: ${tendencia}`}
            onClick={(e: React.MouseEvent) => {
              // Prevenir propagação do clique para não disparar seleção da linha
              e.stopPropagation();
              // Abrir modal de Análise Financeira do Cliente
              if (params.data && params.data.codigo_cli) {
                setSelectedCodigoCliente(params.data.codigo_cli);
                setIsAnaliseModalOpen(true);
              }
            }}
          >
            {icon} {nivel} {trendIcon}
          </span>
        );
      }
    },
    { headerName: 'Código', field: 'codigo_cli', width: 100, pinned: 'left' },
    {
      headerName: 'Documento',
      field: 'cpf_cnpj_cli',
      width: 150,
      valueFormatter: (params: any) => {
        const doc = params.value;
        if (!doc) return '';
        // Remover caracteres não numéricos
        const cleanDoc = doc.replace(/\D/g, '');
        // CPF: 11 dígitos
        if (cleanDoc.length === 11) {
          return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        // CNPJ: 14 dígitos
        if (cleanDoc.length === 14) {
          return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return doc;
      }
    },
    { headerName: 'Nome/Razão Social', field: 'nome_cli', flex: 1, minWidth: 250 },
    { headerName: 'UF', field: 'uf_cli', width: 60 },
    { headerName: 'Inscrição Estadual', field: 'inscest_cli', width: 140 },
    {
      headerName: 'Telefone',
      field: 'fone_cli',
      width: 120,
      valueFormatter: (params: any) => formatarTelefone(params.value)
    },
    {
      headerName: 'Celular',
      field: 'celular_cli',
      width: 120,
      valueFormatter: (params: any) => formatarTelefone(params.value)
    }
  ];

  // Editar cliente (navega para ClienteForm isolado)
  const handleEditar = (registro: any) => {
    navigate(`/cadastros/clientes/${registro.codigo_cli}/edit`);
  };

  // Incluir novo cliente
  const handleIncluir = () => {
    navigate('/cadastros/clientes/novo');
  };

  return (
    <div className="cliente-list-container">
      <div className="cliente-list-header">
        <h2>Clientes</h2>
        <button className="btn-primary" onClick={handleIncluir}>
          + Incluir Registro
        </button>
      </div>
      
      <div className="cliente-list-content">
        {loading ? (
          <div className="loading">Carregando clientes...</div>
        ) : (
          <Localizar
            title="Clientes"
            columns={columns}
            data={dados}
            editable={false}
            onRowSelected={(rows) => {
              if (rows && rows.length === 1) handleEditar(rows[0]);
            }}
          />
        )}
      </div>
      {/* MODAL DE ANÁLISE FINANCEIRA */}
      <ClienteAnaliseFinanceiraModal
        isOpen={isAnaliseModalOpen}
        onClose={() => setIsAnaliseModalOpen(false)}
        codigoCliente={selectedCodigoCliente}
      />
    </div>
  );
};

export default ClienteList;














