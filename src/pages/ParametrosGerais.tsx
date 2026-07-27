/**
 * ParametrosGerais.tsx
 * 
 * PADRÃO SPDealer - FORMULÁRIO 100% INLINE/HARDCODED:
 * ✅ LAYOUT: Dois abas (Empresa, Peças) com grid 2-colunas
 * ✅ FORMULÁRIO: 100% INLINE hardcoded (não dinâmico)
 * ✅ FONTE: dictionary_columns (banco 192.168.10.100 erp) - consultado UMA VEZ
 * ✅ ATALHOS: ENTER (próximo), ESC (voltar), CTRL+S (gravar)
 * ✅ LAYOUT: Baseado em imagens anexadas - Dados da Empresa
 * ✅ SEM LOCALIZAR: Formulário direto para edição dos parâmetros
 * ✅ ABAS: Empresa e Peças - renderizadas manualmente/hardcoded
 * ✅ CAMPOS: form_visible = 1 (ignorar form_visible = 0 completamente)
 * ✅ CHECKBOXES: is_checkbox = 1 renderiza como <input type="checkbox" />
 * 
 * REGRA ABSOLUTA:
 * Este formulário é 100% INLINE (hardcoded no código React).
 * Nenhuma renderização dinâmica de campos de entrada.
 * Campos são definidos nas arrays CAMPOS_EMPRESA e CAMPOS_PECAS abaixo.
 * Alterações de layout devem ser feitas AQUI no código, não no banco.
 */

import React, { useState, useRef, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import './ParametrosGerais.css';

// ✅ Interface para campo inline
interface CampoInline {
  field: string;
  label: string;
  isCheckbox: 0 | 1;
  maxLength?: number;
  mask?: string; // Padrão de máscara (ex: "(##) ####-####" para telefone)
}

// ✅ Interface para dados
interface ParametrosGeraisData {
  [key: string]: any;
}

// ✅ FUNÇÃO AUXILIAR: Aplicar máscara a um valor
const aplicarMascara = (valor: string, mascara: string): string => {
  if (!mascara || !valor) return valor;
  
  let resultado = '';
  let valorIndex = 0;
  
  for (let i = 0; i < mascara.length && valorIndex < valor.length; i++) {
    const char = mascara[i];
    if (char === '#') {
      // Espera um dígito
      if (/\d/.test(valor[valorIndex])) {
        resultado += valor[valorIndex];
        valorIndex++;
      } else {
        break;
      }
    } else if (char === '@') {
      // Espera uma letra
      if (/[a-zA-Z]/.test(valor[valorIndex])) {
        resultado += valor[valorIndex].toUpperCase();
        valorIndex++;
      } else {
        break;
      }
    } else if (char === 'X') {
      // Alphanumeric
      if (/[a-zA-Z0-9]/.test(valor[valorIndex])) {
        resultado += valor[valorIndex].toUpperCase();
        valorIndex++;
      } else {
        break;
      }
    } else {
      // Caractere literal
      resultado += char;
    }
  }
  
  return resultado;
};

const ParametrosGerais: FC = () => {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Estado do formulário
  const [dados, setDados] = useState<ParametrosGeraisData>({});
  const [dadosOriginais, setDadosOriginais] = useState<ParametrosGeraisData>({});
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [abaSelecionada, setAbaSelecionada] = useState<string>('Empresa');

  // ✅ LAYOUT HARDCODED - ABA EMPRESA
  // Fonte: dictionary_columns banco 192.168.10.100 erp (form_visible=1)
  // Layout organizado conforme FOTO - Labels ao LADO dos componentes
  const CAMPOS_EMPRESA_INLINE: CampoInline[] = [
    { field: 'NUMEMPR_GER', label: 'Local', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'CGC_GER', label: 'CNPJ', isCheckbox: 0, maxLength: 14, mask: '##.###.###/####-##' },
    { field: 'INSCRIC_GER', label: 'Inscricao Estadual', isCheckbox: 0, maxLength: 20 },
    { field: 'NOME_GER', label: 'Nome', isCheckbox: 0, maxLength: 60 },
    { field: 'RESPONSAVEL_GER', label: 'Nome do Responsavel', isCheckbox: 0, maxLength: 40 },
    { field: 'ENDERECO_GER', label: 'Endereco', isCheckbox: 0, maxLength: 50 },
    { field: 'CIDADE_GER', label: 'Cidade', isCheckbox: 0, maxLength: 40 },
    { field: 'BAIRRO_GER', label: 'Bairro', isCheckbox: 0, maxLength: 30 },
    { field: 'CEP_GER', label: 'Cep', isCheckbox: 0, maxLength: 10, mask: '#####-###' },
    { field: 'ESTADO_GER', label: 'UF', isCheckbox: 0, maxLength: 2, mask: '@@' },
    { field: 'PAIS_GER', label: 'Pais', isCheckbox: 0, maxLength: 3 },
    { field: 'FONE_GER', label: 'Fone', isCheckbox: 0, maxLength: 13, mask: '(##) ####-####' },
    { field: 'FAX_GER', label: 'Fax', isCheckbox: 0, maxLength: 13, mask: '(##) ####-####' },
    { field: 'IMPOSTO_GER', label: 'Nome do Imposto', isCheckbox: 0, maxLength: 10 },
    { field: 'MENEMPRE_GER', label: 'Menu da Empresa', isCheckbox: 0, maxLength: 8 },
    { field: 'INSCRMUN_GER', label: 'Inscrição Municipal', isCheckbox: 0, maxLength: 20 },
    { field: 'MONTADORA_GER', label: 'Montadora', isCheckbox: 0, maxLength: 15 },
    { field: 'CODFAB_GER', label: 'Código Fábrica', isCheckbox: 0, maxLength: 15 },
    { field: 'MAQ_GER', label: 'Revenda de Máquina e Equip', isCheckbox: 0, maxLength: 1 },
    { field: 'MOEDA_GER', label: 'Sigla da Moeda Corrente', isCheckbox: 0, maxLength: 3, mask: '@@@' },
    { field: 'EQUIPARADA_GER', label: 'Empresa equiparada a Indústria', isCheckbox: 0, maxLength: 1 },
    { field: 'IP_GER', label: 'IP do Servidor', isCheckbox: 0, maxLength: 50 },
    { field: 'PREF_GER', label: 'Prefixo', isCheckbox: 0, maxLength: 8, mask: '###' },
    { field: 'DB_GER', label: 'DataBase', isCheckbox: 0, maxLength: 40 },
    { field: 'CONTINGERNCIA_GER', label: 'Contingencia', isCheckbox: 0, maxLength: 1 },
    { field: 'DHCONT_GER', label: 'Data da Contingencia', isCheckbox: 0, maxLength: 25, mask: '##/##/#### ##:##:##' },
    { field: 'XJUST_GER', label: 'Justificativa', isCheckbox: 0, maxLength: 50 },
  ];

  // ✅ LAYOUT HARDCODED - ABA PEÇAS
  // Fonte: dictionary_columns banco 192.168.10.100 erp (aba = 'Pecas')
  // 48 campos - todos com form_visible=1
  // Layout: 1 coluna
  const CAMPOS_PECAS_INLINE: CampoInline[] = [
    { field: 'COFINS_GER', label: '% COFINS', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'COFINSIM_GER', label: '% COFINS (Importação)', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'COFINSIP_GER', label: '% COFINS (IP)', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'CONSISNBM_GER', label: 'Considera ISS NBM', isCheckbox: 1, maxLength: 1 },
    { field: 'CREDIPI_GER', label: 'Credi PI', isCheckbox: 1, maxLength: 1 },
    { field: 'CURVAA_GER', label: 'Curva A', isCheckbox: 0, maxLength: 2, mask: '##.##%' },
    { field: 'CURVAB_GER', label: 'Curva B', isCheckbox: 0, maxLength: 2, mask: '##.##%' },
    { field: 'CURVAC_GER', label: 'Curva C', isCheckbox: 0, maxLength: 2, mask: '##.##%' },
    { field: 'CURVAD_GER', label: 'Curva D', isCheckbox: 0, maxLength: 2, mask: '##.##%' },
    { field: 'CURVAX_GER', label: 'Curva X', isCheckbox: 0, maxLength: 2, mask: '##.##%' },
    { field: 'CURVAY_GER', label: 'Curva Y', isCheckbox: 0, maxLength: 2, mask: '##.##%' },
    { field: 'CURVAZ_GER', label: 'Curva Z', isCheckbox: 0, maxLength: 2, mask: '##.##%' },
    { field: 'DESCIPI_GER', label: 'Desc IPI', isCheckbox: 1, maxLength: 1 },
    { field: 'DPPECAS_GER', label: 'Código Depto Peças', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'ENTDEMNOESTADO_GER', label: 'Entrada No Estado (ICMS-DEM)', isCheckbox: 0, maxLength: 3, mask: '##.###' },
    { field: 'ENTDEMOUTROSEST_GER', label: 'Entrada Outros Estados (ICMS-DEM)', isCheckbox: 0, maxLength: 3, mask: '##.###' },
    { field: 'ENTREMNOESTADO_GER', label: 'Entrada No Estado (ICMS-REM)', isCheckbox: 0, maxLength: 3, mask: '##.###' },
    { field: 'ENTREMOUTROSEST_GER', label: 'Entrada Outros Estados (ICMS-REM)', isCheckbox: 0, maxLength: 3, mask: '##.###' },
    { field: 'ESTCRIMAX_GER', label: 'Estoque Crítico Máximo', isCheckbox: 0, maxLength: 2, mask: '###' },
    { field: 'ESTCRIMIN_GER', label: 'Estoque Crítico Mínimo', isCheckbox: 0, maxLength: 2, mask: '###' },
    { field: 'FRETSB_GER', label: 'Frete SB', isCheckbox: 1, maxLength: 1 },
    { field: 'GRALTO_GER', label: 'Giro Alto', isCheckbox: 0, maxLength: 2, mask: '###' },
    { field: 'GRBAIXO_GER', label: 'Giro Baixo', isCheckbox: 0, maxLength: 2, mask: '###' },
    { field: 'ICMSFRETSB_GER', label: 'ICMS Frete SB', isCheckbox: 1, maxLength: 1 },
    { field: 'INATIVA_GER', label: 'N° dias considerar peças INATIVAS', isCheckbox: 0, maxLength: 4, mask: '###' },
    { field: 'LOCACAO_GER', label: 'Locação', isCheckbox: 1, maxLength: 1 },
    { field: 'MAISIPI_GER', label: 'Mais IPI', isCheckbox: 1, maxLength: 1 },
    { field: 'MASCARA_GER', label: 'Mascara', isCheckbox: 1, maxLength: 1 },
    { field: 'NIVEL_GER', label: 'Nível para consulta de Preços', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'OUTROSBCPISCOFINS-GER', label: 'Outros BC PIS COFINS', isCheckbox: 1, maxLength: 1 },
    { field: 'PECFAL_GER', label: 'Peca Fal', isCheckbox: 1, maxLength: 1 },
    { field: 'PIS_GER', label: '% PIS', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'PISIM_GER', label: '% PIS (Importação)', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'PISIP_GER', label: '% PIS (IP)', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'PRECOMATRIZ_GER', label: 'Preço Matriz', isCheckbox: 1, maxLength: 1 },
    { field: 'QTDIAOCPEND_GER', label: 'Considerar OC Pendente com mais de', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'QTDIAORC_GER', label: 'Qtde de Dias de Permanências de Orçamentos em Aberto', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'SAIDEMNOESTADO_GER', label: 'Saída No Estado (ICMS-DEM)', isCheckbox: 0, maxLength: 3, mask: '##.###' },
    { field: 'SAIDEMOUTROSEST_GER', label: 'Saída Outros Estados (ICMS-DEM)', isCheckbox: 0, maxLength: 3, mask: '##.###' },
    { field: 'SAIREMNOESTADO_GER', label: 'Saída No Estado (ICMS-REM)', isCheckbox: 0, maxLength: 3, mask: '##.###' },
    { field: 'SAIREMOUTROSEST_GER', label: 'Saída Outros Estados (ICMS-REM)', isCheckbox: 0, maxLength: 3, mask: '##.###' },
    { field: 'SALDONEG_GER', label: 'Saldo Negativo', isCheckbox: 1, maxLength: 1 },
    { field: 'SEMMOV_GER', label: 'Considerar Item sem Movimento em dias', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'SOMAPC_GER', label: 'Soma PC', isCheckbox: 1, maxLength: 1 },
    { field: 'SUBNBM_GER', label: 'Sub NBM', isCheckbox: 1, maxLength: 1 },
    { field: 'TIPOSER_GER', label: 'Tipo de OS no Chamado', isCheckbox: 0, maxLength: 2, mask: '###' },
    { field: 'ULTEST_GER', label: 'Último Código para cadastro de Itens do Estoque', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'ULTORC_GER', label: 'Último ORC', isCheckbox: 0, maxLength: 6, mask: '######' },
    { field: 'ULTPA_GER', label: 'Último PA', isCheckbox: 0, maxLength: 6, mask: '######' },
  ];

  // ✅ LAYOUT HARDCODED - ABA GERAL
  // Fonte: dictionary_columns banco 192.168.10.100 erp (aba = 'Geral')
  // 21 campos - inputs simples
  const CAMPOS_GERAL_INLINE: CampoInline[] = [
    { field: 'ULTCLI_GER', label: 'Próximo código para Cadastro Cliente', isCheckbox: 0, maxLength: 6, mask: '######' },
    { field: 'PEDRES_GER', label: 'Trocar de Pedido para Orçamento (Peças) restrito ao Gerente', isCheckbox: 0, maxLength: 1 },
    { field: 'CAMIFIS_GER', label: 'Caminho para impressora fiscal da rede', isCheckbox: 0, maxLength: 100 },
    { field: 'TIMER_GER', label: 'Tempo p/Retorno', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'NRECF_GER', label: 'Número Impressora Fiscal', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'IMPSERV_GER', label: 'Imprime serviços na Imp/Fiscal', isCheckbox: 0, maxLength: 1 },
    { field: 'NOTAUNIC_GER', label: 'Em multipla Nota Fiscal manter o mesmo numero', isCheckbox: 0, maxLength: 1 },
    { field: 'UNICOCLI_GER', label: 'Cadastro Único do Cliente/Fornecedor', isCheckbox: 0, maxLength: 1 },
    { field: 'ANOMES_GER', label: 'Ano/Mês Inicio Sistema', isCheckbox: 0, maxLength: 6, mask: '######' },
    { field: 'EST157_GER', label: '(Est157) Informe para Cálculo da Margem -(V)alor Liquido da Venda ou (R)emessa Liquida da Venda', isCheckbox: 0, maxLength: 1 },
    { field: 'USALIB_GER', label: 'Usa Controle de codigo para liberar credito', isCheckbox: 0, maxLength: 1 },
    { field: 'OUTRANFSER_GER', label: 'Imprime serviços em outra NF', isCheckbox: 0, maxLength: 1 },
    { field: 'ORCSOVEND_GER', label: 'No orçamento de peças só mostrar o do vendedor', isCheckbox: 0, maxLength: 1 },
    { field: 'IANOMES_GER', label: 'Último inventario fisico', isCheckbox: 0, maxLength: 6, mask: '######' },
    { field: 'TITOBS_GER', label: 'Gravar Ocorr. Remessa/Retorno Bancario OBS Títulos', isCheckbox: 0, maxLength: 1 },
    { field: 'SDONEGEXCENT_GER', label: 'Permitir Saldo Negativo para Exclusão de Nota Fiscal de Entrada', isCheckbox: 0, maxLength: 1 },
    { field: 'DTREMESSA_GER', label: 'Data da ultima remessa de dados', isCheckbox: 0, maxLength: 10, mask: '##/##/####' },
    { field: 'ANOMESINV_GER', label: 'Último inventario mensal', isCheckbox: 0, maxLength: 6, mask: '######' },
    { field: 'DESTIMP_GER', label: 'Imprimir impostos (ST/IPI) nos orçamentos', isCheckbox: 0, maxLength: 1 },
    { field: 'DESCPROMOC_GER', label: 'Aplicar desconto em itens com preço promocional', isCheckbox: 0, maxLength: 1 },
    { field: 'DESCONTR_GER', label: 'Aplicar desconto em itens com preço de contrato', isCheckbox: 0, maxLength: 1 },
    { field: 'OSSOVEND_GER', label: 'Na OS só mostra o do recepcionista', isCheckbox: 0, maxLength: 1 },
  ];

  // ✅ LAYOUT HARDCODED - ABA CONTRATO DE MANUTENÇÃO
  // Fonte: dictionary_columns banco 192.168.10.100 erp (aba = 'Contrato de Manutenção')
  // Campos organizados por grupo (coluna 'grup')
  const CAMPOS_CONTRATO_MANUTENCAO_INLINE: CampoInline[] = [
    // GRUPO 0: Configurações Gerais
    { field: 'CMTIPOSER_GER', label: 'Tipo de Ordem de Serviço', isCheckbox: 0, maxLength: 2, mask: '##' },
    { field: 'DPLOC_GER', label: 'Departamento de Locação', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'DIASAGE_GER', label: 'Quantidade de dias anteriores a data atual que podem ser incluidos compromissos na agenda de vendedores', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'AGENDAREVISAO_GER', label: 'Gera agenda para o vendedor da programação da revisão', isCheckbox: 0, maxLength: 1 },
    { field: 'REVISAO1_GER', label: 'Revisões de', isCheckbox: 0, maxLength: 3, mask: '###' },
    
    // GRUPO 1: NF Saída/Entrada (CM)
    { field: 'CMSAINOESTADO_GER', label: 'NF CM no Estado', isCheckbox: 0, maxLength: 8, mask: '########' },
    { field: 'CMSAIOUTROSEST_GER', label: 'NF CM Outros Estados', isCheckbox: 0, maxLength: 8, mask: '########' },
    
    // GRUPO 2: Configurações de Horimetro e Revisão
    { field: 'DIASTRAZ_GER', label: 'Dias para traz para o cálculo do horimetro', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'DIASAVISO_GER', label: 'Dias para aviso no sistema para programaçao de revisão', isCheckbox: 0, maxLength: 3, mask: '###' },
  ];

  // ✅ LAYOUT PEÇAS - 1 COLUNA (SINGLE COLUMN)
  // Todos os 48 campos em uma única coluna
  const LAYOUT_PECAS_1COL: Record<string, { campos: string[] }> = {
    secao1: {
      campos: ['COFINS_GER', 'COFINSIM_GER', 'COFINSIP_GER', 'CONSISNBM_GER', 'CREDIPI_GER', 'CURVAA_GER', 'CURVAB_GER', 'CURVAC_GER', 'CURVAD_GER', 'CURVAX_GER', 'CURVAY_GER', 'CURVAZ_GER', 'DESCIPI_GER', 'DPPECAS_GER', 'ENTDEMNOESTADO_GER', 'ENTDEMOUTROSEST_GER', 'ENTREMNOESTADO_GER', 'ENTREMOUTROSEST_GER', 'ESTCRIMAX_GER', 'ESTCRIMIN_GER', 'FRETSB_GER', 'GRALTO_GER', 'GRBAIXO_GER', 'ICMSFRETSB_GER', 'INATIVA_GER', 'LOCACAO_GER', 'MAISIPI_GER', 'MASCARA_GER', 'NIVEL_GER', 'OUTROSBCPISCOFINS-GER', 'PECFAL_GER', 'PIS_GER', 'PISIM_GER', 'PISIP_GER', 'PRECOMATRIZ_GER', 'QTDIAOCPEND_GER', 'QTDIAORC_GER', 'SAIDEMNOESTADO_GER', 'SAIDEMOUTROSEST_GER', 'SAIREMNOESTADO_GER', 'SAIREMOUTROSEST_GER', 'SALDONEG_GER', 'SEMMOV_GER', 'SOMAPC_GER', 'SUBNBM_GER', 'TIPOSER_GER', 'ULTEST_GER', 'ULTORC_GER', 'ULTPA_GER']
    }
  };

  // ✅ LAYOUT CONTRATO DE MANUTENÇÃO - AGRUPADO POR GRUPO
  // grup = 0: componentes comuns (sem grupo)
  // grup = 1, 2, 3...: componentes em grupos com título
  const LAYOUT_CONTRATO_MANUTENCAO: Record<string, any> = {
    comuns: {
      // grup = 0: Componentes comuns (sem título de grupo)
      campos: ['CMTIPOSER_GER', 'DPLOC_GER', 'DIASAGE_GER', 'AGENDAREVISAO_GER', 'REVISAO1_GER']
    },
    grupo1: {
      titulo: 'NF Contrato de Manutenção (CM)',
      campos: ['CMSAINOESTADO_GER', 'CMSAIOUTROSEST_GER']
    },
    grupo2: {
      titulo: 'Configurações de Horimetro e Revisão',
      campos: ['DIASTRAZ_GER', 'DIASAVISO_GER']
    }
  };

  // ✅ LAYOUT GERAL - 2 COLUNAS (LEFT/RIGHT) conforme FOTO
  // Labels ao LADO dos inputs, não encima
  const LAYOUT_GERAL_2COL: Record<string, { left: string[], right: string[] }> = {
    secao1: {
      left: ['ULTCLI_GER', 'CAMIFIS_GER', 'NRECF_GER', 'NOTAUNIC_GER', 'ANOMES_GER', 'USALIB_GER', 'ORCSOVEND_GER', 'TITOBS_GER', 'DTREMESSA_GER', 'DESTIMP_GER'],
      right: ['PEDRES_GER', 'TIMER_GER', 'IMPSERV_GER', 'UNICOCLI_GER', 'EST157_GER', 'OUTRANFSER_GER', 'IANOMES_GER', 'SDONEGEXCENT_GER', 'ANOMESINV_GER', 'DESCPROMOC_GER', 'DESCONTR_GER', 'OSSOVEND_GER']
    }
  };

  // ✅ LAYOUT HARDCODED - ABA COBRANÇA
  // Fonte: dictionary_columns banco 192.168.10.100 erp (aba = 'Cobranca')
  // 6 campos - todos fazem parte do mesmo grupo: "Operação de Caixa para Retorno Bancario"
  // Layout: 2 colunas
  const CAMPOS_COBRANCA_INLINE: CampoInline[] = [
    { field: 'OPEJUR_GER', label: 'Juros', isCheckbox: 0, maxLength: 20, mask: '######' },
    { field: 'OPEDESC_GER', label: 'Desconto', isCheckbox: 0, maxLength: 20, mask: '######' },
    { field: 'OPEABAT_GER', label: 'Abatimento', isCheckbox: 0, maxLength: 20, mask: '######' },
    { field: 'OPEOCRED_GER', label: 'Outro Crédito', isCheckbox: 0, maxLength: 20, mask: '######' },
    { field: 'OPEIOF_GER', label: 'Valor IOF', isCheckbox: 0, maxLength: 20, mask: '######' },
    { field: 'OPEDESP_GER', label: 'Valor Despesas', isCheckbox: 0, maxLength: 20, mask: '######' },
  ];

  // ✅ LAYOUT COBRANÇA - 2 COLUNAS
  // Todos os campos pertencem ao mesmo grupo: "Operação de Caixa para Retorno Bancario"
  const LAYOUT_COBRANCA_2COL: Record<string, { left: string[], right: string[] }> = {
    grupo_cobranca: {
      left: ['OPEJUR_GER', 'OPEABAT_GER', 'OPEIOF_GER'],
      right: ['OPEDESC_GER', 'OPEOCRED_GER', 'OPEDESP_GER']
    }
  };

  // ✅ LAYOUT EMPRESA - 2 COLUNAS (LEFT/RIGHT) conforme FOTO
  // Labels ao LADO dos inputs, não encima
  const LAYOUT_EMPRESA_2COL: Record<string, { left: string[], right: string[] }> = {
    secao1: {
      left: ['NUMEMPR_GER', 'NOME_GER', 'ENDERECO_GER', 'CEP_GER', 'FONE_GER'],
      right: ['CGC_GER', 'RESPONSAVEL_GER', 'CIDADE_GER', 'ESTADO_GER', 'FAX_GER']
    },
    secao2: {
      left: ['MENEMPRE_GER', 'MONTADORA_GER', 'MAQ_GER'],
      right: ['INSCRMUN_GER', 'CODFAB_GER', 'MOEDA_GER']
    },
    secao3: {
      left: ['EQUIPARADA_GER', 'CONTINGERNCIA_GER'],
      right: ['IP_GER', 'DHCONT_GER']
    },
    secao4: {
      left: ['DB_GER'],
      right: []
    }
  };

  // ✅ LAYOUT HARDCODED - ABA PEÇAS (51 campos - Conforme Photo Layout)
  // Fonte: dictionary_columns banco 192.168.10.100 erp + MAS008.imp (Legacy Form) + Photo Layout
  // Nota: Checkboxes (is_checkbox=1) renderizam como <input type="checkbox" />

  // ✅ LAYOUT HARDCODED - ABA SERVIÇO
  // ✅ CAMPOS HARDCODED - ABA SERVIÇO (REORGANIZADO)
  // Fonte: dictionary_columns banco 192.168.10.100 erp (aba = 'Serviço')
  // Layout conforme FOTO - 2 colunas com grupos e checkboxes
  // ✅ LAYOUT HARDCODED - ABA SERVIÇO (RECONSTRUÍDA)
  // Fonte: dictionary_columns banco 192.168.10.100 erp (aba = 'Servico')
  // Layout: 2 colunas superior + 2 grupos inferior
  const CAMPOS_SERVICO_INLINE: CampoInline[] = [
    // PARTE SUPERIOR: Componentes normais (2 colunas)
    { field: 'ULTIMO_NUM_OS_GER', label: 'Último N° de O.S', isCheckbox: 0, maxLength: 8 },
    { field: 'ULTIMA_REQ_PECAS_OF_GER', label: 'Última Req. de Peças para Oficina', isCheckbox: 0, maxLength: 8 },
    { field: 'ULTIMO_ORC_OFICINA_GER', label: 'Ultimo Orçamento da Oficina', isCheckbox: 0, maxLength: 8 },
    { field: 'CATEG_SERV_GER', label: 'Categoria para Serviço', isCheckbox: 0, maxLength: 40 },
    { field: 'SEPARADOR_GER', label: '', isCheckbox: 0, maxLength: 1 }, // Apenas separador visual
    { field: 'SITUACAO_TRIB_GER', label: 'Situação Tributária', isCheckbox: 0, maxLength: 2 },
    { field: 'COD_TIPO_OS_GARANTIA_GER', label: 'Código do Tipo de O.S P/Garantia', isCheckbox: 0, maxLength: 2 },
    { field: 'COD_DEPTO_SERV_GER', label: 'Cod Depto Serviço', isCheckbox: 0, maxLength: 3 },
    { field: 'EMITE_NF_OS_INTERNA_GER', label: 'Emite NF para O.S Interna', isCheckbox: 0, maxLength: 1 },
    { field: 'NUMERO_MAX_ITENS_REQ_GER', label: 'Numero Máximo de Itens para Requisição de Peças', isCheckbox: 0, maxLength: 3 },
    { field: 'EMITIR_SERVICOS_MESMO_CAMPO_GER', label: 'Emitir serviços no mesmo campo de peças', isCheckbox: 0, maxLength: 1 },
    { field: 'PERMITIR_OS_ABERTO_GER', label: 'Permitir O.S nova para chassi que ja tem O.S em Aberto', isCheckbox: 0, maxLength: 1 },
    { field: 'E_REMESSA_GARANTIA_GER', label: 'E-Remessa em Garantia', isCheckbox: 0, maxLength: 1 },
    { field: 'E_RECEBIMENTO_PECA_GARANTIA_GER', label: 'E-Recebimento de Peças em Garantia', isCheckbox: 0, maxLength: 1 },
    { field: 'I_REMESSA_GARANTIA_GER', label: 'I-Remessa em Garantia', isCheckbox: 0, maxLength: 1 },
    { field: 'I_RECEBIMENTO_PECA_GARANTIA_GER', label: 'I-Recebimento de Peças em Garantia', isCheckbox: 0, maxLength: 1 },
    { field: 'RETER_PIS_COFINS_GER', label: 'Reter PIS/CONFINS/CSLL com valor superior a', isCheckbox: 0, maxLength: 13, mask: '#########.##' },
    { field: 'GRAVA_CHASSI_GER', label: 'Grava chassi novo no seguimento e frota apartir da OS e ou Orçamento', isCheckbox: 1 },
    { field: 'IMPR_REQ_GER', label: 'Na impressão da requisição habilitar a seleção dos itens a imprimir', isCheckbox: 1 },
    
    // GRUPO 1: Cód. Nat. de Oper. - OS em Garantia (renderizado separado)
    // Será renderizado como grupo especial abaixo dos componentes
    
    // GRUPO 2: Retenção MP135 (renderizado como tabela)
    { field: 'PIS_SERVICOS_GER', label: '% PIS Servicos', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'COFINS_SERVICO_GER', label: '% COFINS Servico', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'CSLL_GER', label: '% CSLL', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
  ];

  // ✅ LAYOUT SERVIÇO - 2 COLUNAS SUPERIOR + GRUPOS INFERIOR
  // Componentes na parte superior (2 colunas: LEFT/RIGHT lado-a-lado)
  // Grupos especiais (Cód. Nat. de Oper. e Retenção MP135) na parte inferior
  const LAYOUT_SERVICO_2COL: Record<string, any> = {
    // SEÇÃO SUPERIOR: Componentes em 2 colunas (LEFT/RIGHT)
    secao_superior: {
      tipo: '2col',
      left: [
        'ULTIMO_NUM_OS_GER',
        'CATEG_SERV_GER',
        'COD_TIPO_OS_GARANTIA_GER',
        'EMITIR_SERVICOS_MESMO_CAMPO_GER',
        'I_REMESSA_GARANTIA_GER',
        'I_RECEBIMENTO_PECA_GARANTIA_GER'
      ],
      right: [
        'ULTIMA_REQ_PECAS_OF_GER',
        'SEPARADOR_GER',
        'SITUACAO_TRIB_GER',
        'COD_DEPTO_SERV_GER',
        'EMITE_NF_OS_INTERNA_GER',
        'NUMERO_MAX_ITENS_REQ_GER',
        'PERMITIR_OS_ABERTO_GER',
        'E_REMESSA_GARANTIA_GER',
        'E_RECEBIMENTO_PECA_GARANTIA_GER'
      ]
    },
    ultimo_orcamento: 'ULTIMO_ORC_OFICINA_GER',
    reter_pis_cofins: 'RETER_PIS_COFINS_GER',
    checkboxes: {
      tipo: 'checkboxes-inline',
      campos: [
        'GRAVA_CHASSI_GER',
        'IMPR_REQ_GER'
      ]
    }
  };

  // ✅ RENDERIZAÇÃO ESPECIAL PARA GRUPOS DE SERVIÇO
  // Será renderizado ABAIXO dos componentes principais
  const GRUPOS_SERVICO = {
    grupo1: {
      titulo: 'Cód. Nat. de Oper. - OS em Garantia para SP E-Estadual I-Interestadual',
      tipo: '2col',
      campos: [
        { label: 'SP', field: 'COD_NAT_OPER_SP_GER', placeholder: '(3)' },
        { label: 'E-Estadual', field: 'COD_NAT_OPER_E_EST_GER', placeholder: '(3)' },
        { label: 'I-Interestadual', field: 'COD_NAT_OPER_I_EST_GER', placeholder: '(3)' }
      ]
    },
    grupo2: {
      titulo: 'Retenção MP135',
      tipo: 'tabela-piscofins',
      colunas: [
        { label: '% PIS Servicos', field: 'PIS_SERVICOS_GER' },
        { label: '% COFINS Servico', field: 'COFINS_SERVICO_GER' },
        { label: '% CSLL', field: 'CSLL_GER' }
      ]
    }
  };

  // ✅ CAMPOS HARDCODED - ABA MAQUINAS
  // Fonte: dictionary_columns banco 192.168.10.100 erp (aba = 'Maquinas')
  // Layout conforme FOTO - Grupos, Checkboxes, Inputs e Tabela PIS/COFINS
  const CAMPOS_MAQUINAS_INLINE: CampoInline[] = [
    // GRUPO 1: Instruções Gerais
    { field: 'NORESVEIC_MAQ', label: 'Não reservar o veículo com Instrução de Faturamento', isCheckbox: 1 },
    { field: 'CODDEPNOV_MAQ', label: 'Código Depto. Máquinas Novas', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'ULTPROMNOV_MAQ', label: 'Filial consolidada para veículos/máquinas', isCheckbox: 0, maxLength: 2, mask: '##' },
    { field: 'CODDEPUSA_MAQ', label: 'Código Depto. Máquinas Usadas', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'ALIQ_ICMS_NOVOS_MAQ', label: 'Aliq de ICMS para Venda de Novos', isCheckbox: 0, maxLength: 6, mask: '##.##%' },
    { field: 'IMPACES_MAQ', label: 'Imprinte Acessórios na Instrução de Faturamento', isCheckbox: 1 },
    { field: 'USAFICHACUST_MAQ', label: 'Usa Ficha de Custo pelo Modelo do Veículo', isCheckbox: 1 },
    
    // GRUPO 2: Parâmetros para emissão de nota fiscal de entradas de veículos usados
    { field: 'CODDOCCONT_MAQ', label: 'Código documento do contas a pagar', isCheckbox: 0, maxLength: 2, mask: '##' },
    { field: 'CODCOBRCONT_MAQ', label: 'Código cobrança do contas a pagar', isCheckbox: 0, maxLength: 2, mask: '##' },
    { field: 'NRDIASVENC_MAQ', label: 'Nr Dias para vencimento', isCheckbox: 0, maxLength: 2, mask: '##' },
    { field: 'LOCALGRAVAR_MAQ', label: 'Local para gravar o Título [Pagar [Compromiso', isCheckbox: 1 },
    { field: 'LIBERAGRAV_MAQ', label: 'Libera gravação financeiro de nota de saída sem instrução de faturamento?', isCheckbox: 1 },
    
    // GRUPO 3: Tabela PIS/COFINS
    { field: 'PISNACC_MAQ', label: '% PIS', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'COFINSNACC_MAQ', label: '% Cofins', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'PISIMP_MAQ', label: '% PIS', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'COFINSIMP_MAQ', label: '% Cofins', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'PISUSAD_MAQ', label: '% PIS', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
    { field: 'COFINSUSAD_MAQ', label: '% Cofins', isCheckbox: 0, maxLength: 8, mask: '##.##%' },
  ];

  // ✅ LAYOUT MÁQUINAS - 2 COLUNAS (LEFT/RIGHT)
  const LAYOUT_MAQUINAS_2COL: Record<string, { left: string[], right: string[] }> = {
    secao1: {
      left: [
        'NORESVEIC_MAQ',
        'CODDEPNOV_MAQ',
        'CODDEPUSA_MAQ',
        'IMPACES_MAQ',
        'CODDOCCONT_MAQ',
        'NRDIASVENC_MAQ',
        'PISNACC_MAQ',
        'PISIMP_MAQ',
        'PISUSAD_MAQ'
      ],
      right: [
        'ULTPROMNOV_MAQ',
        'ALIQ_ICMS_NOVOS_MAQ',
        'USAFICHACUST_MAQ',
        'CODCOBRCONT_MAQ',
        'LOCALGRAVAR_MAQ',
        'LIBERAGRAV_MAQ',
        'COFINSNACC_MAQ',
        'COFINSIMP_MAQ',
        'COFINSUSAD_MAQ'
      ]
    }
  };

  // ✅ CAMPOS HARDCODED - ABA FINANCEIRO
  // Fonte: dictionary_columns banco 192.168.10.100 erp (aba = 'Financeiro')
  // Layout conforme FOTO - 2 colunas com grupos e campos alternados
  const CAMPOS_FINANCEIRO_INLINE: CampoInline[] = [
    // GRUPO: Parâmetros para o Contas a Receber (LEFT)
    { field: 'BLOQ_CLI_ATRASO_GER', label: 'Bloquear Cliente com', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'BLOQ_CLI_DIAS_ATRASO_GER', label: 'dias ou mais de atraso', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'BLOQ_CLI_SEM_MOV_GER', label: 'Bloquear Cliente com', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'BLOQ_CLI_DIAS_SEM_MOV_GER', label: 'dias sem movimento', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'USA_NF_CONTAS_REC_GER', label: 'Usa Número da N.F. para Gravar o Contas a Receber', isCheckbox: 1 },
    { field: 'ENCER_CR_GER', label: 'Data de Encer. do CR', isCheckbox: 0, maxLength: 10, mask: '##/##/####' },
    { field: 'ENCER_CP_GER', label: 'Data de Encer. do CP', isCheckbox: 0, maxLength: 10, mask: '##/##/####' },
    { field: 'ENCER_CAIXA_GER', label: 'Data de Encer. da Caixa', isCheckbox: 0, maxLength: 10, mask: '##/##/####' },
    { field: 'EMITE_BOLETO_REMESSA_GER', label: 'Emite Boleto Banco na Remessa', isCheckbox: 1 },
    { field: 'ULTIMO_NUM_CONTROL_GER', label: 'Último número de contralo', isCheckbox: 0, maxLength: 8, mask: '########' },
    
    // GRUPO: Parâmetros para o Contas a Receber (RIGHT)
    { field: 'MOTIVO_BLOQUEIO_GER', label: 'Motivo Bloqueio', isCheckbox: 0, maxLength: 25 },
    { field: 'LIBERAR_AUTO_SIST_GER', label: 'Liberar - Automática Pelo Sistema', isCheckbox: 1 },
    { field: 'NUM_ULTIMO_LOTE_MOV_GER', label: 'Número do último lote de movimento de títulos', isCheckbox: 0, maxLength: 8, mask: '########' },
    { field: 'EMITE_DUP_SIMPLES_GER', label: 'Emite duplicata simples para cada título', isCheckbox: 1 },
    { field: 'CONTAS_REC_ONLINE_GER', label: 'Contas a Receber ON-LINE', isCheckbox: 0, maxLength: 1 },
    { field: 'CONTAS_PAG_ONLINE_GER', label: 'Contas a Pagar ON-LINE', isCheckbox: 0, maxLength: 1 },
    { field: 'ULTIMA_DUP_EMITIDA_GER', label: 'Última Dup. Emitida', isCheckbox: 0, maxLength: 6, mask: '######' },
    { field: 'ULTIMA_FATURA_EMITIDA_GER', label: 'Última Fatura Emitida', isCheckbox: 0, maxLength: 6, mask: '######' },
    { field: 'ULTIMO_LIVRO_DUP_GER', label: 'Último Livro de Duplicatas', isCheckbox: 0, maxLength: 8, mask: '########' },
    { field: 'FOLHA_ULTIMO_LIVRO_DUP_GER', label: 'Folha', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'AONDE_GRAVAR_DEVOL_COMPRA_GER', label: 'Aonde gravar valor ref. devolução de compra', isCheckbox: 0, maxLength: 1 },
    { field: 'AONDE_GRAVAR_DEVOL_VENDA_GER', label: 'Aonde gravar valor ref. devolução de venda', isCheckbox: 0, maxLength: 1 },
    { field: 'INFORME_COD_DOC_DEVOL_VENDA_GER', label: 'Informe Código de Documento para Devolução de Venda', isCheckbox: 0, maxLength: 2, mask: '##' },
    { field: 'INFORME_COD_DOC_DEVOL_COMPRA_GER', label: 'Informe Código de Documento para Devolução de Compra', isCheckbox: 0, maxLength: 2, mask: '##' },
    { field: 'IMPRINTE_VALOR_EXTENSO_GER', label: 'Imprinte valor por extenso no cheque', isCheckbox: 1 },
    { field: 'OS_NOTA_PECAS_CONTRATO_ESPECIAL_GER', label: 'No caso do OS com nota de peças e serviços separada e contrato ESPECIAL gravar todo o financeiro na primeira', isCheckbox: 1 },
  ];

  // ✅ CAMPOS HARDCODED - ABA FISCAL
  // Fonte: dictionary_columns banco 192.168.10.100 erp (aba = 'Fiscal')
  // Layout conforme FOTO - Grupos múltiplos, 2 colunas
  const CAMPOS_FISCAL_INLINE: CampoInline[] = [
    // GRUPO 1: Notas Fiscais Saída/Entrada
    { field: 'SOMAR_ISS_COLUNA_GER', label: 'Somar a base de ISS na coluna |0| iros ou na coluna ||sentas do Livro Fiscal de Saídas/Entrada', isCheckbox: 1 },
    { field: 'ULTIMA_NF_SAIDA_NUM_GER', label: 'Última Nota Fiscal Saída Número', isCheckbox: 0, maxLength: 8, mask: '########' },
    { field: 'SERIE_GER', label: 'Serie', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'ULTIMA_NF_ENTRADA_NUM_GER', label: 'Última Nota Fiscal Entrada Número', isCheckbox: 0, maxLength: 8, mask: '########' },
    { field: 'SERIE_ENTRADA_GER', label: 'Serie', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'NOTA_SERV_SEPARADA_GER', label: 'Nota de Serviços separada mas na mesma sequencia', isCheckbox: 1 },
    { field: 'ULTIMA_NF_SEMANAL_GER', label: 'Última Nota Fiscal Saimento Semanal', isCheckbox: 0, maxLength: 8, mask: '########' },
    { field: 'AMBIENTE_GER', label: 'Ambiente 1 ou 2', isCheckbox: 0, maxLength: 1 },
    { field: 'VERSAO_GER', label: 'Versão', isCheckbox: 0, maxLength: 1 },
    { field: 'NF_SERVICOS_ELETRONICA_GER', label: 'Nota Fiscal de Serviços Eletronica', isCheckbox: 0, maxLength: 1 },
    { field: 'ULTIMO_LIVRO_REG_INVENTARIO_GER', label: 'Último Livro Registro Inventário', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'FOLHA_LIVRO_GER', label: 'Folha', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'PAGAR_NUM_NF_SAIDA_FILIAL_GER', label: 'Pagar Numeração da Nota Fiscal de Saída da Filial', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'PAGAR_NUM_NF_ENTRADA_FILIAL_GER', label: 'Pagar Numeração da Nota Fiscal de Entrada da Filial', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'MOSTRA_VENDEDORES_GER', label: 'Mostra Vendedores de Todos os Departamentos na Consulta', isCheckbox: 1 },
    
    // GRUPO 2: Configurações de ISS e ICMS
    { field: 'ULTIMA_REQ_INTERNA_GER', label: 'Última req. Interna', isCheckbox: 0, maxLength: 6, mask: '######' },
    { field: 'NUM_ITENS_POR_NOTA_GER', label: 'Número de Itens por Nota', isCheckbox: 0, maxLength: 3, mask: '###' },
    { field: 'NUM_SERVICOS_GER', label: 'Número de Serviços', isCheckbox: 0, maxLength: 2, mask: '##' },
    { field: 'ALIQ_ISS_LOCAL_GER', label: 'Alíquota de ISS Local', isCheckbox: 0, maxLength: 6, mask: '##.##%' },
    { field: 'ALIQ_ICMS_CREDITO_ST_GER', label: 'Alíquota de ICMS para crédito no calculo da ST', isCheckbox: 0, maxLength: 6, mask: '##.##%' },
    { field: 'ALIQ_ICMS_LOCAL_GER', label: 'Alíquota de ICMS Local', isCheckbox: 0, maxLength: 6, mask: '##.##%' },
    { field: 'ALIQ_ICMS_IMPORTADO_GER', label: 'Alíquota de ICMS para produto importado', isCheckbox: 0, maxLength: 6, mask: '##.##%' },
    
    // GRUPO 3: Checkboxes de Serviços e Substituição Tributária
    { field: 'ACEITA_DEVOLUCAO_SERVICOS_GER', label: 'Aceita Devolução de Serviços', isCheckbox: 1 },
    { field: 'NAO_TRIBUTAR_FRETE_VENDA_GER', label: 'Não tributar valor referente a FRETE na VENDA', isCheckbox: 1 },
    { field: 'NAO_SOMAR_SUBST_TRIB_FIN_GER', label: 'Não somar o valor da Subst. Tributária no financeiro da nota', isCheckbox: 1 },
    { field: 'NAO_SOMAR_SUBST_TRIB_TOTAL_GER', label: 'Não somar o valor da Subst. Tributária no total da nota', isCheckbox: 1 },
    { field: 'QUANDO_DESTACAR_ST_GER', label: 'Quando destacar ST nas deduções (%DE - vendidas indevistadas', isCheckbox: 1 },
    
    // GRUPO 4: Última Fatura e Localizações
    { field: 'ULTIMA_FATURA_LOCACAO_GER', label: 'Última Fatura de Locação', isCheckbox: 0, maxLength: 10, mask: '##/##/####' },
    { field: 'LOCAL_GRAVAR_NFE_XML_GER', label: 'Local para gravar a NF-e (XML)', isCheckbox: 0, maxLength: 100 },
    { field: 'LOCAL_RETORNO_XML_GER', label: 'Local onde esta o retorno do XML', isCheckbox: 0, maxLength: 100 },
    { field: 'LOCAL_GRAVAR_NFSE_XML_GER', label: 'Local para gravar a NFS-e (XML)', isCheckbox: 0, maxLength: 100 },
    { field: 'LOCAL_LER_XML_VALIDADO_GER', label: 'Local para Ler XML Validado (Impressão DANFE)', isCheckbox: 0, maxLength: 100 },
    { field: 'LOCAL_GRAVAR_NFS_XML_GER', label: 'Local para gravar a NFS-e (XML)', isCheckbox: 0, maxLength: 100 },
    
    // GRUPO 5: Mensagem para Substituição Tributária
    { field: 'MENSAGEM_ITENS_ST_GER', label: 'Mensagem para itens no regime de substituição tributária', isCheckbox: 0, maxLength: 98 },
  ];

  // ✅ LAYOUT FISCAL - 2 COLUNAS (LEFT/RIGHT) conforme FOTO
  const LAYOUT_FISCAL_2COL: Record<string, { left: string[], right: string[] }> = {
    secao1: {
      left: [
        'SOMAR_ISS_COLUNA_GER',
        'ULTIMA_NF_SAIDA_NUM_GER',
        'ULTIMA_NF_ENTRADA_NUM_GER',
        'ULTIMA_NF_SEMANAL_GER',
        'NF_SERVICOS_ELETRONICA_GER',
        'ULTIMA_REQ_INTERNA_GER',
        'NUM_ITENS_POR_NOTA_GER',
        'NUM_SERVICOS_GER',
        'ALIQ_ISS_LOCAL_GER',
        'ALIQ_ICMS_CREDITO_ST_GER',
        'ALIQ_ICMS_LOCAL_GER',
        'ALIQ_ICMS_IMPORTADO_GER'
      ],
      right: [
        'SERIE_GER',
        'SERIE_ENTRADA_GER',
        'NOTA_SERV_SEPARADA_GER',
        'AMBIENTE_GER',
        'VERSAO_GER',
        'ULTIMO_LIVRO_REG_INVENTARIO_GER',
        'FOLHA_LIVRO_GER',
        'PAGAR_NUM_NF_SAIDA_FILIAL_GER',
        'PAGAR_NUM_NF_ENTRADA_FILIAL_GER',
        'MOSTRA_VENDEDORES_GER',
        'ACEITA_DEVOLUCAO_SERVICOS_GER',
        'NAO_TRIBUTAR_FRETE_VENDA_GER',
        'NAO_SOMAR_SUBST_TRIB_FIN_GER',
        'NAO_SOMAR_SUBST_TRIB_TOTAL_GER',
        'QUANDO_DESTACAR_ST_GER',
        'ULTIMA_FATURA_LOCACAO_GER'
      ]
    }
  };

  // ✅ LAYOUT FINANCEIRO - 2 COLUNAS (LEFT/RIGHT) conforme FOTO
  // Campos organizados lado-a-lado com labels ao lado dos inputs
  const LAYOUT_FINANCEIRO_2COL: Record<string, { left: string[], right: string[] }> = {
    secao1: {
      left: [
        'BLOQ_CLI_ATRASO_GER',
        'BLOQ_CLI_DIAS_ATRASO_GER',
        'BLOQ_CLI_SEM_MOV_GER',
        'BLOQ_CLI_DIAS_SEM_MOV_GER',
        'USA_NF_CONTAS_REC_GER',
        'ENCER_CR_GER',
        'ENCER_CP_GER',
        'ENCER_CAIXA_GER',
        'EMITE_BOLETO_REMESSA_GER',
        'ULTIMO_NUM_CONTROL_GER'
      ],
      right: [
        'MOTIVO_BLOQUEIO_GER',
        'LIBERAR_AUTO_SIST_GER',
        'NUM_ULTIMO_LOTE_MOV_GER',
        'EMITE_DUP_SIMPLES_GER',
        'CONTAS_REC_ONLINE_GER',
        'CONTAS_PAG_ONLINE_GER',
        'ULTIMA_DUP_EMITIDA_GER',
        'ULTIMA_FATURA_EMITIDA_GER',
        'ULTIMO_LIVRO_DUP_GER',
        'FOLHA_ULTIMO_LIVRO_DUP_GER',
        'AONDE_GRAVAR_DEVOL_COMPRA_GER',
        'AONDE_GRAVAR_DEVOL_VENDA_GER',
        'INFORME_COD_DOC_DEVOL_VENDA_GER',
        'INFORME_COD_DOC_DEVOL_COMPRA_GER',
        'IMPRINTE_VALOR_EXTENSO_GER',
        'OS_NOTA_PECAS_CONTRATO_ESPECIAL_GER'
      ]
    }
  };



  // ✅ LAYOUT PEÇAS POR LINHAS (Conforme Photo Layout - Estrutura 2 colunas lado-a-lado)
  // NOTA: Layout reorganizado conforme imagem MAS008.imp - foto do formulário legado
  const LAYOUT_PECAS: Record<string, string[]> = {
    // LINHA 1: Considerar OC Pendente (Full-width)
    linha1: ['QTDIAOCPEND_GER'],
    
    // LINHA 2: Últimas datas (2 colunas com 2 campos cada)
    linha2esq: ['ULTPA_GER', 'ULTPED_GER'],
    linha2dir: ['ULTPEDE_GER', 'ULTORC_GER'],
    
    // LINHA 3: Considerar Item sem Movimento (Full-width)
    linha3: ['SEMMOV_GER'],
    
    // LINHA 4: Código Depto + Máscara Padrão + Olde de Dias ORC (3 colunas)
    linha4: ['DPPECAS_GER', 'MASCARA_GER', 'QTDIAORC_GER'],
    
    // LINHA 5: Frete e Substitição Tributária (Left) + Cadastro e lista preço (Right)
    linha5esq: ['FRETSB_GER', 'PRECOMATRIZ_GER'],
    linha5dir: ['ICMSFRETSB_GER', 'SUBNBM_GER'],
    
    // LINHA 6: NBM no cadastro (Left) + Usar Distribuição Peças (Right)
    linha6esq: ['CONSISNBM_GER'],
    linha6dir: ['PECFAL_GER'],
    
    // LINHA 7: Estoque Crítico (Mínimo e Máximo)
    linha7: ['ESTCRIMIN_GER', 'ESTCRIMAX_GER'],
    
    // LINHA 8: Percentuais Curva ABC (7 colunas - ABCXYZ)
    linha8: ['CURVAA_GER', 'CURVAB_GER', 'CURVAC_GER', 'CURVAD_GER', 'CURVAX_GER', 'CURVAY_GER', 'CURVAZ_GER'],
    
    // LINHA 9: Giros (Alto e Baixo)
    linha9: ['GRALTO_GER', 'GRBAIXO_GER'],
    
    // LINHA 10: Últimos Códigos Entrada (Left) + Saída (Right)
    linha10esq: ['ULTEST_GER'],
    linha10dir: ['INATIVA_GER'],
    
    // LINHA 11: Liberar Saída com Saldo Negativo
    linha11: ['SALDONEG_GER'],
    
    // LINHA 12: Aplicar desconto IPI (Left) + Nível para Consulta Preços (Right)
    linha12esq: ['DESCIPI_GER'],
    linha12dir: ['NIVEL_GER'],
    
    // LINHA 13: Não permitir mesma Locação (Left) + Código NAI Oper Demonstração (Right)
    linha13esq: ['LOCACAO_GER'],
    linha13dir: ['TIPOSER_GER'],
    
    // LINHA 14: Código NAI Oper Remessa (Left) + [vazio] (Right)
    linha14esq: [],
    linha14dir: [],
    
    // LINHA 15: Seção de ICMS - Saída/Entrada (2 colunas)
    linha15: ['SAIREMNOESTADO_GER', 'ENTREMNOESTADO_GER'],
    
    // LINHA 16: ICMS outros estados
    linha16: ['SAIREMOUTROSEST_GER', 'ENTREMOUTROSEST_GER'],
    
    // LINHA 17: ICMS DEM
    linha17: ['SAIDEMNOESTADO_GER', 'ENTDEMNOESTADO_GER'],
    
    // LINHA 18: ICMS DEM outros estados
    linha18: ['SAIDEMOUTROSEST_GER', 'ENTDEMOUTROSEST_GER'],
    
    // LINHA 19: PIS/COFINS Padrão (2 colunas)
    linha19: ['PIS_GER', 'COFINS_GER'],
    
    // LINHA 20: PIS/COFINS Importação (2 colunas)
    linha20: ['PISIM_GER', 'COFINSIM_GER'],
    
    // LINHA 21: PIS/COFINS Polifásicos (Left) + Considerar Frete (Right)
    linha21esq: ['PISIP_GER', 'COFINSIP_GER'],
    linha21dir: ['MAISIPI_GER', 'OUTROSBCPISCOFINS_GER'],
    
    // LINHA 22: Adicionar PIS/COFINS ao preço de venda
    linha22: ['SOMAPC_GER'],
  };

  // ✅ Abas disponíveis
  const ABAS_DISPONIVEIS = ['Empresa', 'Peças', 'Serviço', 'Maquinas', 'Financeiro', 'Fiscal', 'Geral', 'Contrato de Manutenção', 'Cobrança'];

  // ✅ Carregar dados dos parâmetros gerais
  useEffect(() => {
    carregarParametros();
  }, []);

  const carregarParametros = async () => {
    setCarregando(true);
    try {
      // ✅ NOVO: Buscar dados da tabela masger (banco 100.126.166.63) para popular componentes
      const response = await fetch('/api/parametros-gerais/masger');
      if (!response.ok) throw new Error('Erro ao carregar parâmetros da tabela masger');
      const data = await response.json();
      setDados(data);
      setDadosOriginais(JSON.parse(JSON.stringify(data)));
      setSucesso(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
      // Inicializar com dados vazios em caso de erro
      const novosDados: ParametrosGeraisData = {};
      const todosCampos = [...CAMPOS_EMPRESA_INLINE, ...CAMPOS_PECAS_INLINE, ...CAMPOS_SERVICO_INLINE];
      todosCampos.forEach(campo => {
        novosDados[campo.field] = '';
      });
      setDados(novosDados);
    } finally {
      setCarregando(false);
    }
  };

  // ✅ Handler: Atualizar campo
  const handleChangeCampo = (field: string, valor: any) => {
    setDados(prev => ({
      ...prev,
      [field]: valor,
    }));
  };

  // ✅ Handler: Gravar
  const handleGravar = async () => {
    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch('/api/parametros-gerais', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gravar');
      }

      const savedData = await response.json();
      setDados(savedData);
      setDadosOriginais(JSON.parse(JSON.stringify(savedData)));
      setSucesso('Parâmetros gravados com sucesso!');
      
      setTimeout(() => setSucesso(null), 3000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gravar');
    } finally {
      setCarregando(false);
    }
  };

  // ✅ Handler: Restaurar
  const handleRestaurar = () => {
    if (window.confirm('Deseja descartar as alterações e restaurar os valores originais?')) {
      setDados(JSON.parse(JSON.stringify(dadosOriginais)));
      setErro(null);
      setSucesso(null);
    }
  };

  // ✅ Handler: Sair
  const handleSair = () => {
    if (JSON.stringify(dados) !== JSON.stringify(dadosOriginais)) {
      if (!window.confirm('Existem alterações não gravadas. Deseja sair?')) {
        return;
      }
    }
    navigate(-1);
  };

  // ✅ Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleGravar();
      } else if (e.key === 'Escape') {
        handleSair();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dados, dadosOriginais]);

  // ✅ Renderizar campo inline
  const renderField = (campo: CampoInline) => {
    if (campo.isCheckbox === 1) {
      // Checkbox: <input type="checkbox" />
      return (
        <div key={campo.field} className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name={campo.field}
              checked={!!dados[campo.field]}
              onChange={(e) => handleChangeCampo(campo.field, e.target.checked ? 1 : 0)}
              className="form-checkbox"
            />
            <span>{campo.label}</span>
          </label>
        </div>
      );
    } else {
      // Input normal - com label ao LADO (inline-horizontal)
      const inputWidth = getInputWidth(campo.maxLength || 0);
      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let valor = e.target.value;
        if (campo.mask) {
          valor = aplicarMascara(valor, campo.mask);
        }
        handleChangeCampo(campo.field, valor);
      };
      
      return (
        <div key={campo.field} className="form-group-horizontal">
          <label htmlFor={campo.field} className="form-label-inline">
            {campo.label}
          </label>
          <input
            type="text"
            id={campo.field}
            name={campo.field}
            value={dados[campo.field] || ''}
            onChange={handleInputChange}
            className="form-input-inline"
            style={{ width: inputWidth }}
            maxLength={campo.maxLength || 255}
            placeholder={campo.mask ? campo.mask : undefined}
          />
        </div>
      );
    }
  };

  // ✅ Helper: Calcular largura do input conforme maxLength
  const getInputWidth = (maxLength: number): string => {
    if (maxLength <= 2) return '30px';
    if (maxLength <= 3) return '40px';
    if (maxLength <= 5) return '60px';
    if (maxLength <= 8) return '80px';
    if (maxLength <= 10) return '100px';
    if (maxLength <= 13) return '130px';
    if (maxLength <= 14) return '140px';
    if (maxLength <= 15) return '150px';
    if (maxLength <= 20) return '180px';
    if (maxLength <= 25) return '220px';
    if (maxLength <= 30) return '250px';
    if (maxLength <= 40) return '300px';
    if (maxLength <= 50) return '350px';
    if (maxLength <= 60) return '400px';
    return '450px';
  };

  if (carregando && Object.keys(dados).length === 0) {
    return <div className="loading">Carregando parâmetros...</div>;
  }

  return (
    <div className="parametros-gerais-container">
      {/* ✅ HEADER com Botões */}
      <div className="parametros-header">
        <div className="botoes-esquerda">
          <button 
            className="btn btn-primary"
            onClick={handleGravar}
            disabled={carregando}
            title="Ctrl+S"
          >
            💾 Gravar
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleRestaurar}
            disabled={carregando}
            title="Desfazer alterações"
          >
            ↺ Restaurar
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleSair}
            title="Esc"
          >
            ✕ Sair
          </button>
        </div>

        <div className="titulo">
          <h1>Parâmetros Gerais da Empresa</h1>
        </div>
      </div>

      {/* ✅ Mensagens de Status */}
      {erro && <div className="alert alert-danger">{erro}</div>}
      {sucesso && <div className="alert alert-success">{sucesso}</div>}

      {/* ✅ FORMULÁRIO COM ABAS INLINE */}
      <div className="parametros-form-container">
        {/* Abas */}
        <div className="tabs-header">
          {ABAS_DISPONIVEIS.map((aba) => (
            <button
              key={aba}
              className={`tab-button ${abaSelecionada === aba ? 'active' : ''}`}
              onClick={() => setAbaSelecionada(aba)}
            >
              {aba}
            </button>
          ))}
        </div>

        <form ref={formRef} className="parametros-form">
          {/* ✅ ABA EMPRESA - LAYOUT 2 COLUNAS */}
          {abaSelecionada === 'Empresa' && (
            <div className="form-grid-empresa-2col">
              {Object.entries(LAYOUT_EMPRESA_2COL).map(([secao, { left, right }]) => (
                <div key={secao} className="form-secao-2col">
                  {/* COLUNA ESQUERDA */}
                  <div className="form-coluna-esq">
                    {left.map(fieldName => {
                      const campo = CAMPOS_EMPRESA_INLINE.find(c => c.field === fieldName);
                      return campo ? renderField(campo) : null;
                    })}
                  </div>
                  
                  {/* COLUNA DIREITA */}
                  <div className="form-coluna-dir">
                    {right.map(fieldName => {
                      const campo = CAMPOS_EMPRESA_INLINE.find(c => c.field === fieldName);
                      return campo ? renderField(campo) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ✅ ABA PEÇAS - LAYOUT 1 COLUNA */}
          {abaSelecionada === 'Peças' && (
            <div className="form-grid-pecas-1col">
              {Object.entries(LAYOUT_PECAS_1COL).map(([secao, { campos }]) => (
                <div key={secao} className="form-secao-1col">
                  {campos.map(fieldName => {
                    const campo = CAMPOS_PECAS_INLINE.find(c => c.field === fieldName);
                    return campo ? (
                      <div key={fieldName} className="form-field-inline">
                        {renderField(campo)}
                      </div>
                    ) : null;
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ✅ ABA SERVIÇO - RECONSTRUÍDA: 2 COLUNAS SUPERIOR + 2 GRUPOS INFERIOR */}
          {abaSelecionada === 'Serviço' && (
            <div className="form-grid-servico">
              {/* SEÇÃO SUPERIOR: Componentes em 2 colunas */}
              <div className="secao-superior-servico">
                <div className="form-linha linha-2">
                  {/* COLUNA ESQUERDA */}
                  <div className="form-coluna-esq">
                    {LAYOUT_SERVICO_2COL.secao_superior.left.map((fieldName: string) => {
                      const campo = CAMPOS_SERVICO_INLINE.find(c => c.field === fieldName);
                      return campo ? (
                        <div key={fieldName} className="form-field-inline">
                          {renderField(campo)}
                        </div>
                      ) : null;
                    })}
                  </div>
                  
                  {/* COLUNA DIREITA */}
                  <div className="form-coluna-dir">
                    {LAYOUT_SERVICO_2COL.secao_superior.right.map((fieldName: string) => {
                      const campo = CAMPOS_SERVICO_INLINE.find(c => c.field === fieldName);
                      return campo ? (
                        <div key={fieldName} className="form-field-inline">
                          {renderField(campo)}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              {/* LINHA EXTRA: Ultimo Orçamento + Reter PIS/COFINS */}
              <div className="linha-extra-servico">
                <div className="form-linha linha-2">
                  <div className="form-coluna-esq">
                    {CAMPOS_SERVICO_INLINE.filter(c => c.field === LAYOUT_SERVICO_2COL.ultimo_orcamento).map(renderField)}
                  </div>
                  <div className="form-coluna-dir">
                    {CAMPOS_SERVICO_INLINE.filter(c => c.field === LAYOUT_SERVICO_2COL.reter_pis_cofins).map(renderField)}
                  </div>
                </div>
              </div>

              {/* CHECKBOXES INLINE */}
              <div className="checkboxes-servico">
                <div className="form-linha linha-1">
                  {LAYOUT_SERVICO_2COL.checkboxes.campos.map((fieldName: string) => {
                    const campo = CAMPOS_SERVICO_INLINE.find(c => c.field === fieldName);
                    return campo ? (
                      <div key={fieldName} className="form-checkbox-inline">
                        {renderField(campo)}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* SEÇÃO INFERIOR: GRUPO 1 - Cód. Nat. de Oper. */}
              <div className="grupo-servico grupo-1">
                <div className="grupo-titulo">{GRUPOS_SERVICO.grupo1.titulo}</div>
                <div className="grupo-conteudo">
                  <div className="form-linha linha-3">
                    {GRUPOS_SERVICO.grupo1.campos.map((item: any) => (
                      <div key={item.field} className="form-field-grupo-servico">
                        <label className="form-label">{item.label}</label>
                        <input
                          type="text"
                          name={item.field}
                          placeholder={item.placeholder}
                          value={dados[item.field] || ''}
                          onChange={(e) => handleChangeCampo(item.field, e.target.value)}
                          className="form-input"
                          maxLength={3}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SEÇÃO INFERIOR: GRUPO 2 - Retenção MP135 */}
              <div className="grupo-servico grupo-2">
                <div className="grupo-titulo">{GRUPOS_SERVICO.grupo2.titulo}</div>
                <div className="grupo-conteudo">
                  <div className="tabela-retencao-mp135">
                    {GRUPOS_SERVICO.grupo2.colunas.map((item: any) => (
                      <div key={item.field} className="linha-retencao">
                        <label className="form-label">{item.label}</label>
                        <input
                          type="text"
                          name={item.field}
                          value={dados[item.field] || ''}
                          onChange={(e) => handleChangeCampo(item.field, e.target.value)}
                          className="form-input"
                          maxLength={8}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ ABA MÁQUINAS - LAYOUT 2 COLUNAS */}
          {abaSelecionada === 'Maquinas' && (
            <div className="form-grid-maquinas-2col">
              <div className="grupo-maquinas">
                <div className="grupo-maquinas-2col">
                  {/* COLUNA ESQUERDA */}
                  <div className="maquinas-coluna-esq">
                    {LAYOUT_MAQUINAS_2COL.secao1.left.map(fieldName => {
                      const campo = CAMPOS_MAQUINAS_INLINE.find(c => c.field === fieldName);
                      return campo ? (
                        <div key={fieldName} className="form-field-maquinas">
                          {renderField(campo)}
                        </div>
                      ) : null;
                    })}
                  </div>
                  
                  {/* COLUNA DIREITA */}
                  <div className="maquinas-coluna-dir">
                    {LAYOUT_MAQUINAS_2COL.secao1.right.map(fieldName => {
                      const campo = CAMPOS_MAQUINAS_INLINE.find(c => c.field === fieldName);
                      return campo ? (
                        <div key={fieldName} className="form-field-maquinas">
                          {renderField(campo)}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ ABA FINANCEIRO - LAYOUT 2 COLUNAS */}
          {abaSelecionada === 'Financeiro' && (
            <div className="form-grid-financeiro-2col">
              <div className="grupo-financeiro">
                <div className="grupo-titulo">Parâmetros para o Contas a Receber</div>
                <div className="grupo-financeiro-2col">
                  {/* COLUNA ESQUERDA */}
                  <div className="financeiro-coluna-esq">
                    {LAYOUT_FINANCEIRO_2COL.secao1.left.map(fieldName => {
                      const campo = CAMPOS_FINANCEIRO_INLINE.find(c => c.field === fieldName);
                      return campo ? (
                        <div key={fieldName} className="form-field-financeiro">
                          {renderField(campo)}
                        </div>
                      ) : null;
                    })}
                  </div>
                  
                  {/* COLUNA DIREITA */}
                  <div className="financeiro-coluna-dir">
                    {LAYOUT_FINANCEIRO_2COL.secao1.right.map(fieldName => {
                      const campo = CAMPOS_FINANCEIRO_INLINE.find(c => c.field === fieldName);
                      return campo ? (
                        <div key={fieldName} className="form-field-financeiro">
                          {renderField(campo)}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ ABA FISCAL - LAYOUT 2 COLUNAS COM CAMPOS LONGOS */}
          {abaSelecionada === 'Fiscal' && (
            <div className="form-grid-fiscal-2col">
              <div className="grupo-fiscal">
                <div className="grupo-fiscal-2col">
                  {/* COLUNA ESQUERDA */}
                  <div className="fiscal-coluna-esq">
                    {LAYOUT_FISCAL_2COL.secao1.left.map(fieldName => {
                      const campo = CAMPOS_FISCAL_INLINE.find(c => c.field === fieldName);
                      return campo ? (
                        <div key={fieldName} className="form-field-fiscal">
                          {renderField(campo)}
                        </div>
                      ) : null;
                    })}
                  </div>
                  
                  {/* COLUNA DIREITA */}
                  <div className="fiscal-coluna-dir">
                    {LAYOUT_FISCAL_2COL.secao1.right.map(fieldName => {
                      const campo = CAMPOS_FISCAL_INLINE.find(c => c.field === fieldName);
                      return campo ? (
                        <div key={fieldName} className="form-field-fiscal">
                          {renderField(campo)}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
              
              {/* CAMPOS FINAIS DE LOCALIZAÇÃO E MENSAGEM */}
              <div className="grupo-fiscal-final">
                <div className="form-field-fiscal-full">
                  {CAMPOS_FISCAL_INLINE.filter(c => c.field === 'ULTIMA_FATURA_LOCACAO_GER').map(renderField)}
                </div>
                <div className="form-field-fiscal-full">
                  {CAMPOS_FISCAL_INLINE.filter(c => c.field === 'LOCAL_GRAVAR_NFE_XML_GER').map(renderField)}
                </div>
                <div className="form-field-fiscal-full">
                  {CAMPOS_FISCAL_INLINE.filter(c => c.field === 'LOCAL_RETORNO_XML_GER').map(renderField)}
                </div>
                <div className="form-field-fiscal-full">
                  {CAMPOS_FISCAL_INLINE.filter(c => c.field === 'LOCAL_GRAVAR_NFSE_XML_GER').map(renderField)}
                </div>
                <div className="form-field-fiscal-full">
                  {CAMPOS_FISCAL_INLINE.filter(c => c.field === 'LOCAL_LER_XML_VALIDADO_GER').map(renderField)}
                </div>
                <div className="form-field-fiscal-full">
                  {CAMPOS_FISCAL_INLINE.filter(c => c.field === 'LOCAL_GRAVAR_NFS_XML_GER').map(renderField)}
                </div>
                <div className="form-field-fiscal-full">
                  {CAMPOS_FISCAL_INLINE.filter(c => c.field === 'MENSAGEM_ITENS_ST_GER').map(renderField)}
                </div>
              </div>
            </div>
          )}

          {/* ✅ ABA GERAL - LAYOUT 2 COLUNAS */}
          {abaSelecionada === 'Geral' && (
            <div className="form-grid-geral-2col">
              <div className="grupo-geral">
                <div className="grupo-geral-2col">
                  {/* COLUNA ESQUERDA */}
                  <div className="geral-coluna-esq">
                    {LAYOUT_GERAL_2COL.secao1.left.map(fieldName => {
                      const campo = CAMPOS_GERAL_INLINE.find(c => c.field === fieldName);
                      return campo ? (
                        <div key={fieldName} className="form-field-geral">
                          {renderField(campo)}
                        </div>
                      ) : null;
                    })}
                  </div>
                  
                  {/* COLUNA DIREITA */}
                  <div className="geral-coluna-dir">
                    {LAYOUT_GERAL_2COL.secao1.right.map(fieldName => {
                      const campo = CAMPOS_GERAL_INLINE.find(c => c.field === fieldName);
                      return campo ? (
                        <div key={fieldName} className="form-field-geral">
                          {renderField(campo)}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ ABA CONTRATO DE MANUTENÇÃO - LAYOUT COM GRUPOS */}
          {abaSelecionada === 'Contrato de Manutenção' && (
            <div className="form-grid-contrato-manutencao">
              {/* Seção de componentes comuns (grup = 0) - SEM TÍTULO */}
              <div className="componentes-comuns">
                {LAYOUT_CONTRATO_MANUTENCAO.comuns.campos.map((fieldName: string) => {
                  const campo = CAMPOS_CONTRATO_MANUTENCAO_INLINE.find(c => c.field === fieldName);
                  return campo ? (
                    <div key={fieldName} className="form-field-contrato">
                      {renderField(campo)}
                    </div>
                  ) : null;
                })}
              </div>

              {/* Grupos específicos (grup = 1, 2, 3...) - COM TÍTULO */}
              {Object.entries(LAYOUT_CONTRATO_MANUTENCAO).map(([chaveGrupo, grupo]) => {
                // Pular a seção 'comuns' (já renderizada acima)
                if (chaveGrupo === 'comuns') return null;

                return (
                  <div key={chaveGrupo} className="grupo-contrato-manutencao">
                    <h3 className="grupo-titulo">{grupo.titulo}</h3>
                    <div className="grupo-campos">
                      {grupo.campos.map((fieldName: string) => {
                        const campo = CAMPOS_CONTRATO_MANUTENCAO_INLINE.find(c => c.field === fieldName);
                        return campo ? (
                          <div key={fieldName} className="form-field-contrato">
                            {renderField(campo)}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ✅ ABA COBRANÇA - LAYOUT COM GRUPO ÚNICO (2 COLUNAS) */}
          {abaSelecionada === 'Cobrança' && (
            <div className="form-grid-cobranca">
              {/* Seção do grupo único: "Operação de Caixa para Retorno Bancario" */}
              <div className="grupo-cobranca">
                <div className="grupo-titulo">Operação de Caixa para Retorno Bancario</div>
                <div className="grupo-campos">
                  <div className="form-linha linha-2">
                    {/* COLUNA ESQUERDA */}
                    <div className="form-coluna-esq">
                      {LAYOUT_COBRANCA_2COL.grupo_cobranca.left.map((fieldName: string) => {
                        const campo = CAMPOS_COBRANCA_INLINE.find(c => c.field === fieldName);
                        return campo ? (
                          <div key={fieldName} className="form-field-cobranca">
                            {renderField(campo)}
                          </div>
                        ) : null;
                      })}
                    </div>
                    
                    {/* COLUNA DIREITA */}
                    <div className="form-coluna-dir">
                      {LAYOUT_COBRANCA_2COL.grupo_cobranca.right.map((fieldName: string) => {
                        const campo = CAMPOS_COBRANCA_INLINE.find(c => c.field === fieldName);
                        return campo ? (
                          <div key={fieldName} className="form-field-cobranca">
                            {renderField(campo)}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ParametrosGerais;














