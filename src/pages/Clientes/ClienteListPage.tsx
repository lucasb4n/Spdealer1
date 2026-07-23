import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faPlus,
  faSearch,
  faFilter,
  faPencil,
  faBan,
} from '@fortawesome/free-solid-svg-icons';
import { AgGridTable } from '../../components/AgGridTable/AgGridTable';
import { formatarDocumento, formatarTelefone } from '../../utils/formatters';
import { API_BASE_URL } from '../../services/apiConfig';

// ============= TIPOS =============
interface Cliente {
  id?: number;
  codigo_cli: string;
  tipopessoa_cli: 'F' | 'J';
  cgccpf_cli: string;
  nome_cli: string;
  nomefan_cli?: string;
  cidade_cli?: string;
  uf_cli?: string;
  fone_cli?: string;
  celular_cli?: string;
  email_cli?: string;
  datcadi_cli?: string;
  datalt_cli?: string;
  datanasc_cli?: string;
  cliforn_cli: 'C' | 'F';
  ultimo_movimento?: string; // Data do último movimento em receber
  dias_sem_movimento?: number; // Dias desde último movimento
}

interface KPIs {
  total: number;
  ativos: number; // Movimento nos últimos 60 dias
  inativos: number; // Sem movimento há mais de 60 dias
  semMovimento: number; // Nunca teve movimento
}

// ============= ESTILOS =============
const Container = styled.div`
  padding: 24px;
  background: #f9fafb;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
`;

const ButtonPrimary = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;

const KpiContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const KpiCard = styled.div<{ color: string }>`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid ${(props) => props.color};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const KpiLabel = styled.div`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 8px;
`;

const KpiValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #111827;
`;

const FilterSection = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FilterRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FilterLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 180px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 250px;

  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const DateInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 140px;

  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const GridContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

// ============= COMPONENTE =============
const ClienteListPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [, setLoading] = useState(false);
  const [kpis, setKpis] = useState<KPIs>({
    total: 0,
    ativos: 0,
    inativos: 0,
    semMovimento: 0,
  });


  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [quickFilterText, setQuickFilterText] = useState<string>('');
  const [dataInicial, setDataInicial] = useState<string>('');
  const [dataFinal, setDataFinal] = useState<string>('');
  const [tipoBuscaData, setTipoBuscaData] = useState<string>('cadastro'); // cadastro, alteracao, aniversario

  // ============= CARREGAR DADOS =============
  const loadClientes = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/clientes/com-movimento`;
      console.log('[ClienteListPage] Carregando clientes de:', url);
      
      const response = await fetch(url);
      console.log('[ClienteListPage] Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[ClienteListPage] Dados recebidos:', data);
        setClientes(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.error('[ClienteListPage] Erro HTTP:', response.status, errorText);
        setClientes([]);
      }
    } catch (error) {
      console.error('[ClienteListPage] Erro ao carregar clientes:', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  // ============= FILTRAR E CALCULAR KPIs =============
  const filterAndUpdateKpis = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let filtered = clientes;

    console.log('[ClienteListPage] Aplicando filtro:', statusFilter, 'Total registros:', clientes.length);

    // 1. FILTRO POR DATA (conforme tipo de busca)
    if (dataInicial && dataFinal) {
      const dtInicio = new Date(dataInicial);
      const dtFim = new Date(dataFinal);
      dtInicio.setHours(0, 0, 0, 0);
      dtFim.setHours(23, 59, 59, 999);

      filtered = filtered.filter(c => {
        let dataComparar: Date | null = null;

        if (tipoBuscaData === 'cadastro' && c.datcadi_cli) {
          dataComparar = new Date(c.datcadi_cli);
        } else if (tipoBuscaData === 'alteracao' && c.datalt_cli) {
          dataComparar = new Date(c.datalt_cli);
        } else if (tipoBuscaData === 'aniversario' && c.tipopessoa_cli === 'F' && c.datanasc_cli) {
          dataComparar = new Date(c.datanasc_cli);
        }

        if (!dataComparar) return false;
        return dataComparar >= dtInicio && dataComparar <= dtFim;
      });
    }

    // 2. FILTRO POR STATUS (Ativo/Inativo/Sem Movimento)
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(c => {
        const diasSemMov = c.dias_sem_movimento || 0;

        if (statusFilter === 'ATIVOS') {
          return diasSemMov > 0 && diasSemMov <= 60;
        } else if (statusFilter === 'INATIVOS') {
          return diasSemMov > 60;
        } else if (statusFilter === 'SEM_MOVIMENTO') {
          return !c.ultimo_movimento || diasSemMov === 0;
        }
        return true;
      });
    }

    // 3. FILTRO POR TIPO DE PESSOA
    if (tipoFilter !== 'TODOS') {
      filtered = filtered.filter(c => c.tipopessoa_cli === tipoFilter);
    }

    // Atualizar lista filtrada
    setFilteredClientes(filtered);

    // ============= CALCULAR KPIs =============
    const totalClientes = clientes.length;
    let totalAtivos = 0;
    let totalInativos = 0;
    let totalSemMovimento = 0;

    clientes.forEach(c => {
      const diasSemMov = c.dias_sem_movimento || 0;

      if (!c.ultimo_movimento || diasSemMov === 0) {
        totalSemMovimento++;
      } else if (diasSemMov <= 60) {
        totalAtivos++;
      } else {
        totalInativos++;
      }
    });

    setKpis({
      total: totalClientes,
      ativos: totalAtivos,
      inativos: totalInativos,
      semMovimento: totalSemMovimento,
    });
  }, [clientes, statusFilter, tipoFilter, dataInicial, dataFinal, tipoBuscaData]);

  useEffect(() => {
    filterAndUpdateKpis();
  }, [clientes, statusFilter, tipoFilter, dataInicial, dataFinal, tipoBuscaData]);

  // ============= HANDLERS =============
  const handleNovoCliente = () => {
    navigate('/cadastros/clientes/incluir-registro');
  };

  const handleEditCliente = (cliente: Cliente) => {
    // Navegar para o formulário de inclusão, passando o id para edição
    navigate(`/cadastros/clientes/incluir-registro?editId=${cliente.codigo_cli}`);
  };

  

  const handleCancelarCliente = async (cliente: Cliente) => {
    const confirmed = window.confirm('Tem certeza que deseja inativar este cliente?');
    if (confirmed) {
      try {
        const response = await fetch(`${API_BASE_URL}/clientes/${cliente.codigo_cli}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...cliente,
            status_cli: 'I', // Inativo
          }),
        });
        if (response.ok) {
          loadClientes();
          alert('Cliente inativado com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao inativar cliente:', error);
        alert('Erro ao inativar cliente');
      }
    }
  };

  // ============= FORMATADORES =============
  const formatarData = (data: string | undefined) => {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  };

  // ============= COLUNAS AG-GRID =============
  const columnDefs = [
    { field: 'codigo_cli', headerName: 'Código', width: 100, pinned: 'left' },
    {
      field: 'cgccpf_cli',
      headerName: 'Documento',
      width: 150,
      valueFormatter: (params: any) => {
        // Passar tipo de pessoa para formatação (F = Física, J = Jurídica)
        const tipo = params.data?.tipopessoa_cli || undefined;
        return formatarDocumento(params.value, tipo as any);
      }
    },
    {
      field: 'nome_cli',
      headerName: 'Nome/Razão Social',
      width: 300,
      filter: true,
    },
    {
      field: 'nomefan_cli',
      headerName: 'Nome Fantasia',
      width: 200,
      filter: true,
    },
    {
      field: 'cidade_cli',
      headerName: 'Cidade',
      width: 150,
      filter: true,
    },
    {
      field: 'uf_cli',
      headerName: 'UF',
      width: 60,
      filter: true,
    },
    {
      field: 'fone_cli',
      headerName: 'Telefone',
      width: 130,
      valueFormatter: (params: any) => formatarTelefone(params.value)
    },
    {
      field: 'celular_cli',
      headerName: 'Celular',
      width: 130,
      valueFormatter: (params: any) => formatarTelefone(params.value)
    },
    {
      field: 'email_cli',
      headerName: 'Email',
      width: 200,
      filter: true,
    },
    {
      field: 'datcadi_cli',
      headerName: 'Data Cadastro',
      width: 130,
      valueFormatter: (params: any) => formatarData(params.value),
    },
    {
      field: 'datalt_cli',
      headerName: 'Última Alteração',
      width: 140,
      valueFormatter: (params: any) => formatarData(params.value),
    },
    {
      field: 'ultimo_movimento',
      headerName: 'Último Movimento',
      width: 150,
      valueFormatter: (params: any) => formatarData(params.value),
    },
    {
      field: 'dias_sem_movimento',
      headerName: 'Dias s/ Movimento',
      width: 150,
      valueFormatter: (params: any) => {
        const dias = params.value;
        if (!dias || dias === 0) return 'Sem movimento';
        return `${dias} dias`;
      },
      cellStyle: (params: any) => {
        const dias = params.value || 0;
        if (dias === 0) return { color: '#9ca3af' };
        if (dias <= 60) return { color: '#10b981', fontWeight: '600' };
        return { color: '#ef4444', fontWeight: '600' };
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      cellRenderer: (params: any) => {
        const dias = params.data.dias_sem_movimento || 0;
        let statusLabel = '';
        let color = '';

        if (!params.data.ultimo_movimento || dias === 0) {
          statusLabel = '⚪ Sem Movimento';
          color = '#9ca3af';
        } else if (dias <= 60) {
          statusLabel = '✅ Ativo';
          color = '#10b981';
        } else {
          statusLabel = '⏰ Inativo';
          color = '#ef4444';
        }

        return (
          <span
            style={{
              color,
              fontWeight: '600',
              fontSize: '13px',
            }}
          >
            {statusLabel}
          </span>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 80,
      pinned: 'right',
      sortable: false,
      cellRenderer: (params: any) => (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '100%' }}>
          <button
            onClick={() => handleEditCliente(params.data)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '9px',
              color: '#2563eb',
              padding: '1px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Editar"
          >
            <FontAwesomeIcon icon={faPencil} />
          </button>
          <button
            onClick={() => handleCancelarCliente(params.data)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '9px',
              color: '#ef4444',
              padding: '1px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Inativar"
          >
            <FontAwesomeIcon icon={faBan} />
          </button>
        </div>
      ),
    },
  ];

  // ============= RENDER =============
  return (
    <Container>
      {/* HEADER */}
      <Header>
        <Title>
          <FontAwesomeIcon icon={faUsers} color="#2563eb" />
          Clientes
        </Title>
        <ButtonPrimary onClick={handleNovoCliente}>
          <FontAwesomeIcon icon={faPlus} />
          Incluir Registro
        </ButtonPrimary>
      </Header>

      {/* KPIs */}
      <KpiContainer>
        <KpiCard color="#2563eb">
          <KpiLabel>Total de Clientes</KpiLabel>
          <KpiValue>{kpis.total}</KpiValue>
        </KpiCard>
        <KpiCard color="#10b981">
          <KpiLabel>Ativos (até 60 dias)</KpiLabel>
          <KpiValue>{kpis.ativos}</KpiValue>
        </KpiCard>
        <KpiCard color="#ef4444">
          <KpiLabel>Inativos (&gt; 60 dias)</KpiLabel>
          <KpiValue>{kpis.inativos}</KpiValue>
        </KpiCard>
        <KpiCard color="#9ca3af">
          <KpiLabel>Sem Movimento</KpiLabel>
          <KpiValue>{kpis.semMovimento}</KpiValue>
        </KpiCard>
      </KpiContainer>

      {/* FILTROS */}
      <FilterSection>
        <FilterRow>
          <FilterGroup>
            <FilterLabel>
              <FontAwesomeIcon icon={faFilter} /> Status
            </FilterLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="ATIVOS">✅ Ativos</option>
              <option value="INATIVOS">⏰ Inativos</option>
              <option value="SEM_MOVIMENTO">⚪ Sem Movimento</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Tipo de Pessoa</FilterLabel>
            <Select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="F">Pessoa Física</option>
              <option value="J">Pessoa Jurídica</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Buscar por Data</FilterLabel>
            <Select value={tipoBuscaData} onChange={(e) => setTipoBuscaData(e.target.value)}>
              <option value="cadastro">Data Cadastro</option>
              <option value="alteracao">Última Alteração</option>
              <option value="aniversario">Aniversário (PF)</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Data Inicial</FilterLabel>
            <DateInput
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Data Final</FilterLabel>
            <DateInput
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>
              <FontAwesomeIcon icon={faSearch} /> Busca Rápida
            </FilterLabel>
            <SearchInput
              type="text"
              placeholder="Buscar cliente..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
            />
          </FilterGroup>
        </FilterRow>
      </FilterSection>

      {/* GRID */}
      <GridContainer>
        <AgGridTable
          rowData={filteredClientes}
          columnDefs={columnDefs}
          quickFilterText={quickFilterText}
        />
      </GridContainer>
      
      
    </Container>
  );
};

export default ClienteListPage;
