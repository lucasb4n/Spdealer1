// src/types/theme.ts
export interface DashboardTheme {
  // Cores Primárias/Secundárias/Estado
  primaryColor?: string; // Ex: #2563eb
  secondaryColor?: string; // Ex: #888
  successColor?: string; // Ex: #22c55e (para indicadores positivos)
  errorColor?: string; // Ex: #ef4444 (para indicadores negativos ou erros no Card)
  warningColor?: string; // Ex: #f59e42 (para avisos)
  dangerColor?: string; // Ex: #F44336 (para erros mais críticos)

  // Cores de Fundo
  backgroundColor?: string; // Ex: #f4f6fa (fundo do DashboardContainer)
  cardBg?: string; // Ex: #fff (fundo padrão dos cards)
  cardBgGradient?: string; // Ex: linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)

  // Borda e Sombra dos Cards
  cardRadius?: string; // Ex: '18px'
  cardBorder?: string; // Ex: '1.5px solid #e5e7eb' (Adicionado para borda de cards)
  cardShadow?: string; // Ex: '0 4px 18px rgba(34,51,106,0.13)'
  cardShadowHover?: string; // Ex: '0 12px 36px rgba(34,51,106,0.22)'

  // Padding e Tipografia do Card
  cardPadding?: string; // Ex: '22px 28px 20px 28px'
  cardFontFamily?: string; // Ex: 'Inter, Arial, sans-serif'
  textColor?: string; // Cor de texto geral (se aplicável ao Card)
  lightTextColor?: string; // Cor de texto secundário/claro

  // Título do Card
  cardTitleColor?: string;
  cardTitleSize?: string;
  cardTitleWeight?: number;

  // Valor do Card (KPI)
  cardValueColor?: string;
  cardValueSize?: string;
  cardValueWeight?: number;

  // Ícone do Card (KPI)
  kpiIconBg?: string; // Fundo do círculo do ícone
  kpiIconColor?: string; // Cor do ícone no círculo
  kpiIconShadow?: string; // Sombra do círculo do ícone (Não usado no refatorado, mas pode ser adicionado)

  // Botões de Ação do Card (KPI)
  kpiActionBtnBg?: string; // Cor de fundo do botão de ação
  kpiActionBtnColor?: string; // Cor do texto/ícone do botão de ação
  kpiActionBtnBgHover?: string; // Cor de fundo do botão de ação no hover (Não usado no refatorado, mas pode ser adicionado)
  kpiActionBtnBorderRadius?: string; // Adicionado para consistência

  // Estilos de Tabela (para ListWidget)
  listTableHeaderBg?: string; // Fundo do cabeçalho da tabela
  listTableCellColor?: string; // Cor do texto das células
  listTotalRowBg?: string; // Fundo da linha de total

  // Estilos de Gráfico (para ChartWidget)
  chartLineColor?: string; // Cor da linha principal do gráfico
  chartFillColor?: string; // Cor de preenchimento de áreas do gráfico
  chartGridColor?: string; // Cor da grade do gráfico

  // Estilos de Row e Container
  rowGap?: string;
  rowMarginBottom?: string;
  rowGapMobile?: string;
  rowMarginBottomMobile?: string;
  containerPadding?: string;

  // Botões
  buttonPrimaryBg?: string; // Cor de fundo do botão primário
  buttonPrimaryColor?: string; // Cor do texto do botão primário
  buttonPrimaryBgHover?: string; // Cor de fundo do botão primário no hover
  buttonSecondaryBg?: string; // Cor de fundo do botão secundário
  buttonSecondaryColor?: string; // Cor do texto do botão secundário
  buttonSecondaryBgHover?: string; // Cor de fundo do botão secundário no hover
  buttonDangerBg?: string; // Cor de fundo do botão de perigo
  buttonDangerColor?: string; // Cor do texto do botão de perigo
  buttonDangerBgHover?: string; // Cor de fundo do botão de perigo no hover

  // Inputs
  inputBorder?: string; // Borda dos campos de input
  inputBg?: string; // Cor de fundo dos campos de input
  inputColor?: string; // Cor do texto dos campos de input
  inputBorderRadius?: string; // Border radius dos campos de input
  inputPadding?: string; // Padding dos campos de input
  inputPlaceholderColor?: string; // Cor do placeholder dos campos de input

  // Tabelas
  tableBorder?: string; // Borda das tabelas
  tableBg?: string; // Cor de fundo das tabelas
  tableHeaderBg?: string; // Cor de fundo do cabeçalho das tabelas
  tableHeaderColor?: string; // Cor do texto do cabeçalho das tabelas
  tableCellColor?: string; // Cor do texto das células das tabelas
  tableCellBorder?: string; // Borda das células das tabelas
  tableRowHoverBg?: string; // Cor de fundo das linhas no hover
  tableStripedBg?: string; // Cor de fundo das linhas alternadas
}













