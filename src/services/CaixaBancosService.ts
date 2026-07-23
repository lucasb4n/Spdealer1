import { 
  Banco, 
  OperacaoCaixa, 
  Departamento, 
  DocumentoReceber, 
  DocumentoPagar,
  DocumentoSelecionado,
  FormularioCaixa,
  ValidacaoMovimento 
} from 'CaixaBancos';
import { API_BASE_URL } from './apiConfig';
const API_URL = API_BASE_URL;

export class CaixaBancosService {
  
  // Bancos
  static async listarBancos(): Promise<Banco[]> {
    try {
      const response = await fetch(`${API_URL}/bancos`);
      if (!response.ok) throw new Error(`Erro ao buscar bancos: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao listar bancos:', error);
      throw error;
    }
  }

  static async buscarBancoPorCodigo(codigo: string): Promise<Banco> {
    try {
      const response = await fetch(`${API_URL}/bancos/${codigo}`);
      if (!response.ok) throw new Error(`Erro ao buscar banco: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar banco:', error);
      throw error;
    }
  }

  // Operações de Caixa
  static async listarOperacoesCaixa(): Promise<OperacaoCaixa[]> {
    try {
      const response = await fetch(`${API_URL}/operacoes-caixa`);
      if (!response.ok) throw new Error(`Erro ao buscar operações: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao listar operações de caixa:', error);
      throw error;
    }
  }

  // Departamentos
  static async listarDepartamentos(mdFilter: string = 'D'): Promise<Departamento[]> {
    try {
      // Tenta uma série de variações de URL - o backend está inconsistente entre controllers
      const triedUrls: string[] = [];
      const candidates = [
        `${API_URL}/v1/caixa/departamentos`,               // CaixaController
        `${API_URL}/relatorios/departamentos`,             // RelatoriosController
        `${API_URL}/v1/departamentos`,                     // DepartamentosController
        `${API_URL}/departamentos?md_scd=${encodeURIComponent(mdFilter)}`, // Legado/TabelasAuxiliares
        `${API_URL}/tabelas-auxiliares/masdep`             // TabelasAuxiliaresController
      ];

      for (const url of candidates) {
        try {
          triedUrls.push(url);
          console.log('[listarDepartamentos] Tentando URL:', url);
          const response = await fetch(url);
          if (!response.ok) {
            console.warn(`[listarDepartamentos] URL ${url} retornou status ${response.status}`);
            continue;
          }
          const rawData = await response.json();
          let data: any[] = [];
          
          // Tratar diferentes formatos de resposta (Array direto ou wrap em {data: []})
          if (Array.isArray(rawData)) {
            data = rawData;
          } else if (rawData && Array.isArray(rawData.data)) {
            data = rawData.data;
          } else if (rawData && typeof rawData === 'object') {
            // Tenta achar algum campo que seja array
            const firstArrayKey = Object.keys(rawData).find(k => Array.isArray(rawData[k]));
            if (firstArrayKey) data = rawData[firstArrayKey];
          }

          console.log(`[listarDepartamentos] URL bem-sucedida: ${url} - encontrados ${data.length} departamentos`);
          
          // Mapear para o formato esperado pelo frontend (codigo_scd, descr_scd) se vier diferente
          return data.map(item => ({
            codigo_scd: String(item.codigo_scd || item.codigo || item.codigo_dep || ''),
            descr_scd: String(item.descr_scd || item.descricao || item.descr_dep || ''),
            md_scd: String(item.md_scd || 'D')
          }));

        } catch (err) {
          console.warn('[listarDepartamentos] Erro ao tentar URL:', url, err);
          continue;
        }
      }

      console.warn('[listarDepartamentos] Nenhuma URL retornou dados. URLs tentadas:', triedUrls);
      return [];
    } catch (error) {
      console.error('Erro ao listar departamentos:', error);
      return [];
    }
  }

  // ✅ Documentos Disponíveis para Nova Operação (SEM vinculação a caixa)
  static async listarDocumentosReceberDisponiveis(codigoCliente: string): Promise<DocumentoReceber[]> {
    try {
      if (!codigoCliente) {
        console.warn('[listarDocumentosReceberDisponiveis] Código cliente não fornecido');
        return [];
      }
      // Tenta uma série de formatos/variações de URL — alguns ambientes expõem nomes diferentes
      const triedUrls: string[] = [];
      const candidates = [
        `${API_URL}/documentos-abertos/receber/disponiveis?codigo=${encodeURIComponent(codigoCliente)}`,
        `${API_URL}/documentos-abertos/receber/disponiveis?codigoCliente=${encodeURIComponent(codigoCliente)}`,
        `${API_URL}/documentos-abertos/receber/disponiveis?codigo_cli=${encodeURIComponent(codigoCliente)}`,
        `${API_URL}/documentos-abertos/receber?codigoCliente=${encodeURIComponent(codigoCliente)}`,
        `${API_URL}/documentos-abertos/receber?codigo=${encodeURIComponent(codigoCliente)}`
      ];

      for (const url of candidates) {
        try {
          triedUrls.push(url);
          console.log('[listarDocumentosReceberDisponiveis] Tentando URL:', url);
          const response = await fetch(url);
          if (!response.ok) {
            console.warn(`[listarDocumentosReceberDisponiveis] URL ${url} retornou status ${response.status}`);
            // se 404, tentar próxima variação
            continue;
          }
          const data = await response.json();
          console.log(`[listarDocumentosReceberDisponiveis] URL bem-sucedida: ${url} - encontrados ${Array.isArray(data) ? data.length : 0} documentos`);
          return Array.isArray(data) ? data : [];
        } catch (err) {
          console.warn('[listarDocumentosReceberDisponiveis] Erro ao tentar URL:', url, err);
          continue;
        }
      }

      console.warn('[listarDocumentosReceberDisponiveis] Nenhuma URL retornou dados. URLs tentadas:', triedUrls);
      return [];
    } catch (error) {
      console.error('[listarDocumentosReceberDisponiveis] Erro:', error);
      return [];
    }
  }

  static async listarDocumentosPagarDisponiveis(codigoFornecedor: string): Promise<DocumentoPagar[]> {
    try {
      if (!codigoFornecedor) {
        console.warn('[listarDocumentosPagarDisponiveis] Código fornecedor não fornecido');
        return [];
      }
      // Tenta variações de URL quando o endpoint 'disponiveis?codigo=' não existir
      const triedUrls: string[] = [];
      const candidates = [
        `${API_URL}/documentos-abertos/pagar/disponiveis?codigo=${encodeURIComponent(codigoFornecedor)}`,
        `${API_URL}/documentos-abertos/pagar/disponiveis?codigoFornecedor=${encodeURIComponent(codigoFornecedor)}`,
        `${API_URL}/documentos-abertos/pagar/disponiveis?codigo_for=${encodeURIComponent(codigoFornecedor)}`,
        `${API_URL}/documentos-abertos/pagar?codigoFornecedor=${encodeURIComponent(codigoFornecedor)}`,
        `${API_URL}/documentos-abertos/pagar?codigo=${encodeURIComponent(codigoFornecedor)}`
      ];

      for (const url of candidates) {
        try {
          triedUrls.push(url);
          console.log('[listarDocumentosPagarDisponiveis] Tentando URL:', url);
          const response = await fetch(url);
          if (!response.ok) {
            console.warn(`[listarDocumentosPagarDisponiveis] URL ${url} retornou status ${response.status}`);
            continue;
          }
          const data = await response.json();
          console.log(`[listarDocumentosPagarDisponiveis] URL bem-sucedida: ${url} - encontrados ${Array.isArray(data) ? data.length : 0} documentos`);
          return Array.isArray(data) ? data : [];
        } catch (err) {
          console.warn('[listarDocumentosPagarDisponiveis] Erro ao tentar URL:', url, err);
          continue;
        }
      }

      console.warn('[listarDocumentosPagarDisponiveis] Nenhuma URL retornou dados. URLs tentadas:', triedUrls);
      return [];
    } catch (error) {
      console.error('[listarDocumentosPagarDisponiveis] Erro:', error);
      return [];
    }
  }

  // DEPRECATED: Use listarDocumentosReceberDisponiveis ao invés
  static async listarDocumentosReceber(codigoCliente?: number): Promise<DocumentoReceber[]> {
    try {
      const url = codigoCliente 
        ? `${API_URL}/documentos-abertos/receber?codigoCliente=${codigoCliente}`
        : `${API_URL}/documentos-abertos/receber`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erro ao buscar documentos a receber: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao listar documentos a receber:', error);
      throw error;
    }
  }

  // DEPRECATED: Use listarDocumentosPagarDisponiveis ao invés
  static async listarDocumentosPagar(codigoFornecedor?: number): Promise<DocumentoPagar[]> {
    try {
      const url = codigoFornecedor 
        ? `${API_URL}/documentos-abertos/pagar?codigoFornecedor=${codigoFornecedor}`
        : `${API_URL}/documentos-abertos/pagar`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erro ao buscar documentos a pagar: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao listar documentos a pagar:', error);
      throw error;
    }
  }

  // Próxima Sequência
  static async buscarProximaSequencia(dataMovimento: string): Promise<{ proxima_sequencia: number; data_movimento: string }> {
    try {
      // Converter DD/MM/AAAA para DDMMAAAA
      const dataInterna = dataMovimento.replace(/[/\-.]/g, '');
      
      const response = await fetch(`${API_URL}/documentos-abertos/proxima-sequencia?datMovimento=${dataInterna}`);
      if (!response.ok) throw new Error(`Erro ao buscar sequência: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar próxima sequência:', error);
      throw error;
    }
  }

  // Buscar documentos vinculados em Contas a Receber usando CHAVE_REC_A14 (cxbco_rec, dtpagi_rec, seqcai_rec)
  // ⚠️ INCOMPATIBILIDADE DE TIPOS: 
  //    - caixa.codbanco_cai = CHAR(5) (armazena código do banco, ex: "00003")
  //    - receber.cxbco_rec = DECIMAL(5) (tipo numérico)
  //    Backend DEVE fazer CAST: WHERE cxbco_rec = CAST(codbanco_cai AS DECIMAL(5))
  static async buscarDocumentosReceberVinculados(cxbco_rec: string, dtpagi_rec: string, seqcai_rec: number | string): Promise<DocumentoReceber[]> {
    try {
      // ✅ CONVERSÃO CORRETA DE DATA
      // Input: YYYY-MM-DD (2025-12-01)
      // Output: AAAAMMDD (20251201) - Backend espera este formato!
      
      let dataPagi = String(dtpagi_rec || '').trim();
      console.log('[CaixaBancosService.buscarDocumentosReceberVinculados] INPUT dtpagi_rec (raw):', dtpagi_rec);
      
      // ✅ Normalização robusta de data (Remove fração de tempo ISO/Date e formata barra / se necessário)
      if (dataPagi.includes('T')) {
        dataPagi = dataPagi.split('T')[0].trim();
      }
      if (dataPagi.includes('/')) {
        // format: DD/MM/YYYY -> YYYY-MM-DD
        const partesData = dataPagi.split('/');
        if (partesData.length === 3) {
          if (partesData[2].length === 4) {
            dataPagi = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
          } else if (partesData[0].length === 4) {
            dataPagi = `${partesData[0]}-${partesData[1]}-${partesData[2]}`;
          }
        }
      }
      
      console.log('[CaixaBancosService.buscarDocumentosReceberVinculados] INPUT dataPagi (normalizada):', dataPagi);
      
      // ✅ VALIDAÇÃO: Aceita APENAS formatos válidos
      // VÁLIDO 1: YYYY-MM-DD (2025-12-01) - 10 caracteres com hífens
      // VÁLIDO 2: AAAAMMDD (20251201) - 8 dígitos puros
      // INVÁLIDO: Qualquer outro formato (como 201201-25-20)
      
      if (dataPagi.includes('-')) {
        // Tenta parsear como YYYY-MM-DD
        const partes = dataPagi.split('-');
        
        if (partes.length === 3) {
          const ano = partes[0];   // 2025
          const mes = partes[1];   // 12
          const dia = partes[2];   // 01
          
          // ✅ VALIDAÇÃO DE SANIDADE
          if (ano.length === 4 && mes.length === 2 && dia.length === 2 && 
              /^\d+$/.test(ano) && /^\d+$/.test(mes) && /^\d+$/.test(dia)) {
            dataPagi = `${ano}${mes}${dia}`; // 20251201 (AAAAMMDD)
            console.log('[CaixaBancosService.buscarDocumentosReceberVinculados] ✅ Convertido YYYY-MM-DD → AAAAMMDD:', dataPagi);
          } else {
            console.error('[CaixaBancosService.buscarDocumentosReceberVinculados] ❌ ERRO: Formato YYYY-MM-DD inválido!', { ano, mes, dia });
            return [];
          }
        } else {
          console.error('[CaixaBancosService.buscarDocumentosReceberVinculados] ❌ ERRO: Split por "-" retornou', partes.length, 'partes. Esperado 3!');
          return [];
        }
      } else if (dataPagi.length === 8 && /^\d{8}$/.test(dataPagi)) {
        // Já está em formato numérico (20251201)
        console.log('[CaixaBancosService.buscarDocumentosReceberVinculados] ✅ Data já em formato AAAAMMDD:', dataPagi);
      } else {
        console.error('[CaixaBancosService.buscarDocumentosReceberVinculados] ❌ ERRO: Formato de data não reconhecido!', { dataPagi, length: dataPagi.length });
        return [];
      }
      
      console.log('[CaixaBancosService.buscarDocumentosReceberVinculados] OUTPUT dataPagi (final):', dataPagi);
      
      const params = new URLSearchParams({
        cxbco: cxbco_rec,
        dtpagi: dataPagi,  // AAAAMMDD (20251201)
        seqcai: String(seqcai_rec)
      });
      const url = `${API_URL}/documentos-abertos/receber/vinculados?${params.toString()}`;
      console.log('[CaixaBancosService.buscarDocumentosReceberVinculados] URL completa:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Aviso ao buscar documentos receber vinculados: ${response.status}`);
        return [];
      }
      const data = await response.json();
      console.log('[CaixaBancosService.buscarDocumentosReceberVinculados] Retorno:', data);
      return data || [];
    } catch (error) {
      console.warn('Erro ao buscar documentos receber vinculados (ignorar):', error);
      return [];
    }
  }

  // Buscar documentos vinculados em Contas a Pagar usando CHAVE_PAG_A12 (cxbco_pag, dtpagi_pag, seqcai_pag)
  // ⚠️ INCOMPATIBILIDADE DE TIPOS: 
  //    - caixa.codbanco_cai = CHAR(5) (armazena código do banco, ex: "00003")
  //    - pagar.cxbco_pag = DECIMAL(5) (tipo numérico)
  //    Backend DEVE fazer CAST: WHERE cxbco_pag = CAST(codbanco_cai AS DECIMAL(5))
  static async buscarDocumentosPagarVinculados(cxbco_pag: string, dtpagi_pag: string, seqcai_pag: number | string): Promise<DocumentoPagar[]> {
    try {
      // ✅ CONVERSÃO CORRETA DE DATA (mesmo padrão que RECEBER)
      // Input: YYYY-MM-DD (2025-12-01)
      // Output: AAAAMMDD (20251201) - Backend espera este formato!
      
      let dataPagi = String(dtpagi_pag || '').trim();
      console.log('[CaixaBancosService.buscarDocumentosPagarVinculados] INPUT dtpagi_pag (raw):', dtpagi_pag);
      
      // ✅ Normalização robusta de data (Remove fração de tempo ISO/Date e formata barra / se necessário)
      if (dataPagi.includes('T')) {
        dataPagi = dataPagi.split('T')[0].trim();
      }
      if (dataPagi.includes('/')) {
        // format: DD/MM/YYYY -> YYYY-MM-DD
        const partesData = dataPagi.split('/');
        if (partesData.length === 3) {
          if (partesData[2].length === 4) {
            dataPagi = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
          } else if (partesData[0].length === 4) {
            dataPagi = `${partesData[0]}-${partesData[1]}-${partesData[2]}`;
          }
        }
      }
      
      console.log('[CaixaBancosService.buscarDocumentosPagarVinculados] INPUT dataPagi (normalizada):', dataPagi);
      
      // ✅ VALIDAÇÃO: Aceita APENAS formatos válidos
      // VÁLIDO 1: YYYY-MM-DD (2025-12-01) - 10 caracteres com hífens
      // VÁLIDO 2: AAAAMMDD (20251201) - 8 dígitos puros
      // INVÁLIDO: Qualquer outro formato (como 201201-25-20)
      
      if (dataPagi.includes('-')) {
        // Tenta parsear como YYYY-MM-DD
        const partes = dataPagi.split('-');
        
        if (partes.length === 3) {
          const ano = partes[0];   // 2025
          const mes = partes[1];   // 12
          const dia = partes[2];   // 01
          
          // ✅ VALIDAÇÃO DE SANIDADE
          if (ano.length === 4 && mes.length === 2 && dia.length === 2 && 
              /^\d+$/.test(ano) && /^\d+$/.test(mes) && /^\d+$/.test(dia)) {
            dataPagi = `${ano}${mes}${dia}`; // 20251201 (AAAAMMDD)
            console.log('[CaixaBancosService.buscarDocumentosPagarVinculados] ✅ Convertido YYYY-MM-DD → AAAAMMDD:', dataPagi);
          } else {
            console.error('[CaixaBancosService.buscarDocumentosPagarVinculados] ❌ ERRO: Formato YYYY-MM-DD inválido!', { ano, mes, dia });
            return [];
          }
        } else {
          console.error('[CaixaBancosService.buscarDocumentosPagarVinculados] ❌ ERRO: Split por "-" retornou', partes.length, 'partes. Esperado 3!');
          return [];
        }
      } else if (dataPagi.length === 8 && /^\d{8}$/.test(dataPagi)) {
        // Já está em formato numérico (20251201)
        console.log('[CaixaBancosService.buscarDocumentosPagarVinculados] ✅ Data já em formato AAAAMMDD:', dataPagi);
      } else {
        console.error('[CaixaBancosService.buscarDocumentosPagarVinculados] ❌ ERRO: Formato de data não reconhecido!', { dataPagi, length: dataPagi.length });
        return [];
      }
      
      console.log('[CaixaBancosService.buscarDocumentosPagarVinculados] OUTPUT dataPagi (final):', dataPagi);
      
      const params = new URLSearchParams({
        cxbco: cxbco_pag,
        dtpagi: dataPagi,  // AAAAMMDD (20251201)
        seqcai: String(seqcai_pag)
      });
      const url = `${API_URL}/documentos-abertos/pagar/vinculados?${params.toString()}`;
      console.log('[CaixaBancosService.buscarDocumentosPagarVinculados] URL completa:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Aviso ao buscar documentos pagar vinculados: ${response.status}`);
        return [];
      }
      const data = await response.json();
      console.log('[CaixaBancosService.buscarDocumentosPagarVinculados] Retorno:', data);
      return data || [];
    } catch (error) {
      console.warn('Erro ao buscar documentos pagar vinculados (ignorar):', error);
      return [];
    }
  }

  // Buscar lançamento por ID (detalhe completo do caixa)
  static async buscarLancamentoPorId(id: number | string, chaveCompleta?: { filial_cai: string; tipocai_cai: string; cliforn_cai: string; codbanco_cai: string; dtmovi_cai: string; seq_cai: number }): Promise<any> {
    try {
      let url = `${API_URL}/v1/caixa/lancamentos/${id}`;
      
      // Se fornecida a chave primária completa, usar na query string
      if (chaveCompleta) {
        const params = new URLSearchParams({
          filial: chaveCompleta.filial_cai,
          tipocai: chaveCompleta.tipocai_cai,
          cliforn: chaveCompleta.cliforn_cai,
          codbanco: chaveCompleta.codbanco_cai,
          dtmovi: chaveCompleta.dtmovi_cai,
          seq: String(chaveCompleta.seq_cai)
        });
        url = `${API_URL}/v1/caixa/lancamentos/${id}?${params.toString()}`;
        console.log('[CaixaBancosService.buscarLancamentoPorId] URL com chave completa:', url);
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erro ao buscar lancamento: ${response.status}`);
      const data = await response.json();
      console.log('[CaixaBancosService.buscarLancamentoPorId] Retorno:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar lancamento por id:', error);
      throw error;
    }
  }

  // Validação de Movimento
  static validarMovimento(valorInformado: number, documentosSelecionados: DocumentoSelecionado[]): ValidacaoMovimento {
    const valorDocumentos = Math.round(documentosSelecionados.reduce(
      (total, doc) => total + (doc.valor_selecionado || 0), 
      0
    ) * 100) / 100;
    
    const diferenca = Math.abs(valorInformado - valorDocumentos);
    const valido = diferenca < 0.01; // Tolerância de 1 centavo
    
    let mensagem = '';
    if (!valido) {
      if (valorInformado > valorDocumentos) {
        mensagem = `Faltam R$ ${(valorInformado - valorDocumentos).toFixed(2)} em documentos selecionados`;
      } else {
        mensagem = `Excesso de R$ ${(valorDocumentos - valorInformado).toFixed(2)} em documentos selecionados`;
      }
    }

    return {
      valor_informado: valorInformado,
      valor_documentos: valorDocumentos,
      diferenca,
      valido,
      mensagem: valido ? undefined : mensagem
    };
  }

  // Processar Movimento
  static async processarMovimento(formulario: FormularioCaixa): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/movimento-caixa/processar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formulario),
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(resultado.erro || `Erro ao processar movimento: ${response.status}`);
      }

      return resultado;
    } catch (error) {
      console.error('Erro ao processar movimento:', error);
      throw error;
    }
  }

  // ✅ NOVO: Atualizar movimento de caixa existente (ediçao com propagaçao de saldo)
  static async atualizarMovimentoCaixa(dados: {
    id?: number | string;
    seq_cai: number | string;
    filial_cai?: string;
    tipocai_cai?: string;
    cliforn_cai?: string;
    codbanco_cai: string;
    dtmovi_cai: string;
    original_codbanco_cai?: string;
    original_dtmovi_cai?: string;
    original_filial_cai?: string;
    sequencia?: number | string;
    dc_cai?: string;
    valor_cai: number;
    historico_cai?: string;
    operacao_cai?: string;
    dpto_cai?: string;
    cliente_cai?: string;
    valor_original?: number;
    valor_novo?: number;
    documentos_selecionados?: DocumentoSelecionado[];
  }): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/v1/caixa/atualizar-movimento`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });

      const resultado = await response.json();

      if (!response.ok) {
        const errorMsg = resultado.mensagem || resultado.message || (typeof resultado.erro === 'string' ? resultado.erro : '') || `Erro ao atualizar movimento: ${response.status}`;
        throw new Error(errorMsg);
      }

      return resultado;
    } catch (error) {
      console.error('Erro ao atualizar movimento de caixa:', error);
      throw error;
    }
  }

  // ✅ Desvincular documento individual do movimento de caixa (ícone lixeira)
  static async desvincularDocumento(
    seqCai: number | string,
    tipo: 'R' | 'P',
    documentoId: number | string,
    banco: string,
    dataMovimento: string
  ): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/v1/caixa/${seqCai}/desvincular-documento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, documentoId, banco, dataMovimento }),
      });

      const resultado = await response.json();

      if (!response.ok) {
        const errorMsg = resultado.mensagem || resultado.message || 'Erro ao desvincular documento';
        throw new Error(errorMsg);
      }

      return resultado;
    } catch (error) {
      console.error('[CaixaBancosService] Erro ao desvincular documento:', error);
      throw error;
    }
  }

  // ✅ Estornar movimento completo de caixa (lote_cai = 'E')
  static async estornarMovimento(
    seqCai: number | string,
    banco: string,
    dataMovimento: string,
    filial: string = '001',
    usuarioLog: string = 'SYSTEM'
  ): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/v1/caixa/${seqCai}/estornar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banco, dataMovimento, filial, usuarioLog }),
      });

      const resultado = await response.json();

      if (!response.ok) {
        const errorMsg = resultado.mensagem || resultado.message || 'Erro ao estornar movimento';
        throw new Error(errorMsg);
      }

      return resultado;
    } catch (error) {
      console.error('[CaixaBancosService] Erro ao estornar movimento:', error);
      throw error;
    }
  }

  // Formatadores Utilitários
  static formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  static formatarData(data: string): string {
    if (!data) return '';
    
    // Se já está no formato DD/MM/AAAA
    if (data.includes('/')) return data;
    
    // Se está no formato AAAA-MM-DD (ISO)
    if (data.includes('-') && data.length === 10) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    
    // Se está no formato DDMMAAAA (sistema legado)
    if (data.length === 8 && /^\d{8}$/.test(data)) {
      const dia = data.substring(0, 2);
      const mes = data.substring(2, 4);
      const ano = data.substring(4, 8);
      return `${dia}/${mes}/${ano}`;
    }
    
    return data;
  }

  static formatarDataInterna(data: string): string {
    // Converte DD/MM/AAAA para DDMMAAAA
    return data.replace(/[/\-.]/g, '');
  }

  /**
   * Converte data DD/MM/AAAA para formato legado DDMMAAAA
   * Usado APENAS para compatibilidade com sistema legado
   */
  static converterDataParaLegado(data: string): string {
    if (!data) return '';
    
    // Remove barras e converte DD/MM/AAAA para DDMMAAAA
    if (data.includes('/')) {
      return data.replace(/\//g, '');
    }
    
    // Se for formato AAAA-MM-DD, converte para DDMMAAAA
    if (data.includes('-') && data.length === 10) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}${mes}${ano}`;
    }
    
    return data;
  }

  /**
   * Converte data do formato legado DDMMAAAA para DD/MM/AAAA
   */
  static converterDataDeLegado(dataLegado: string): string {
    if (!dataLegado || dataLegado.length !== 8) return '';
    
    const dia = dataLegado.substring(0, 2);
    const mes = dataLegado.substring(2, 4);
    const ano = dataLegado.substring(4, 8);
    
    return `${dia}/${mes}/${ano}`;
  }

  /**
   * Converte data para formato DATE do SQL (YYYY-MM-DD)
   * Este é o formato PRINCIPAL usado pelo SPDealer
   */
  static converterParaFormatoSQL(data: string): string {
    if (!data) return '';
    
    // Se já está no formato YYYY-MM-DD
    if (data.includes('-') && data.length === 10) {
      return data;
    }
    
    // Se está no formato DD/MM/AAAA
    if (data.includes('/')) {
      const [dia, mes, ano] = data.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    // Se está no formato DDMMAAAA
    if (data.length === 8 && /^\d{8}$/.test(data)) {
      const dia = data.substring(0, 2);
      const mes = data.substring(2, 4);
      const ano = data.substring(4, 8);
      return `${ano}-${mes}-${dia}`;
    }
    
    return data;
  }

  /**
   * Prepara dados de data para gravação no sistema
   * Retorna ambos os formatos necessários
   */
  static prepararDatasParaGravacao(dataMovimento: string) {
    const dataSQL = this.converterParaFormatoSQL(dataMovimento); // YYYY-MM-DD (principal)
    const dataLegado = this.converterDataParaLegado(dataMovimento); // DDMMAAAA (compatibilidade)
    
    return {
      dtmov_cai: dataLegado,    // Só para compatibilidade com sistema legado
      dtmovi_cai: dataSQL       // Campo DATE principal do SPDealer
    };
  }
}













