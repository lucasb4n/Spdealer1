import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBookOpen, 
  faSearch, 
  faKey, 
  faBoxes, 
  faFileInvoiceDollar, 
  faWrench, 
  faWallet, 
  faUsers,
  faKeyboard,
  faLightbulb,
  faCheckCircle,
  faShieldAlt,
  faLayerGroup,
  faUserLock,
  faExclamationTriangle,
  faTruckLoading,
  faClipboardCheck,
  faCartPlus,
  faTags,
  faBarcode,
  faFileExcel
} from '@fortawesome/free-solid-svg-icons';
import './ManualPage.css';

type SectionKey = 'introducao' | 'pecas' | 'fiscal' | 'servico' | 'financeiro' | 'crm';

interface NavSection {
  id: SectionKey;
  label: string;
  icon: any;
}

const navSections: NavSection[] = [
  { id: 'introducao', label: 'Introdução', icon: faBookOpen },
  { id: 'pecas', label: 'Peças', icon: faBoxes },
  { id: 'fiscal', label: 'Fiscal', icon: faFileInvoiceDollar },
  { id: 'servico', label: 'Serviço', icon: faWrench },
  { id: 'financeiro', label: 'Financeiro', icon: faWallet },
  { id: 'crm', label: 'CRM', icon: faUsers },
];

const ManualPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionKey>('introducao');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="manual-container">
      {/* Header do Manual */}
      <div className="manual-header-bar">
        <div className="manual-header-title">
          <FontAwesomeIcon icon={faBookOpen} style={{ fontSize: '22px', color: '#2dd4bf' }} />
          <h1>Manual do Sistema SPDealer</h1>
          <span>100% Web • Guia do Usuário</span>
        </div>
        <div className="manual-search-box">
          <FontAwesomeIcon icon={faSearch} className="manual-search-icon" />
          <input
            type="text"
            className="manual-search-input"
            placeholder="Pesquisar função (ex: F4, Permissão, Pecfal)..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="manual-body">
        {/* Sidebar de Navegação Lateral */}
        <aside className="manual-sidebar">
          <div className="manual-sidebar-header">Seções do Manual</div>
          <ul className="manual-nav-list">
            {navSections.map((sec) => (
              <li
                key={sec.id}
                className={`manual-nav-item ${activeSection === sec.id ? 'active' : ''}`}
                onClick={() => setActiveSection(sec.id)}
              >
                <div className="manual-nav-icon">
                  <FontAwesomeIcon icon={sec.icon} />
                </div>
                <span>{sec.label}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Área Central de Conteúdo */}
        <main className="manual-content-area">
          {/* ========================================================================= */}
          {/* SEÇÃO 1: INTRODUÇÃO */}
          {/* ========================================================================= */}
          {activeSection === 'introducao' && (
            <div className="manual-section">
              <div className="manual-section-title">
                <FontAwesomeIcon icon={faBookOpen} style={{ color: '#0d9488' }} />
                <span>Introdução, Autenticação e Sistema de Permissões</span>
              </div>
              <p className="manual-section-subtitle">
                Bem-vindo ao Manual Oficial do SPDealer Web! Esta seção explica a arquitetura de acesso do sistema, como funciona o Login Dinâmico e como o perfil de cada operador molda as telas e permissões de uso.
              </p>

              {/* Card 1: Login Dinâmico e Controle de Sessão */}
              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faKey} style={{ color: '#0284c7' }} />
                  <span>1. Sistema de Login Dinâmico & Inicialização de Sessão</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    O acesso ao SPDealer Web é realizado através de autenticação criptografada por token. Cada usuário possui um nome de usuário (login) e senha vinculados ao seu registro de operador no sistema.
                  </p>
                  <ul className="step-list">
                    <li className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-text">
                        <strong>Identificação do Operador:</strong> Ao digitar suas credenciais na tela de Login, o sistema verifica a senha encriptada e busca o perfil de permissões associado na base de dados.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-text">
                        <strong>Carregamento de Perfil e Empresa:</strong> A sessão identifica a filial/empresa ativa e carrega dinamicamente as permissões de acesso às funções do sistema.
                      </div>
                    </li>
                  </ul>

                  {/* Mockup do Formulário de Login */}
                  <div className="form-print-mockup">
                    <div className="mockup-header">
                      <div className="mockup-header-dots">
                        <span className="dot dot-red"></span>
                        <span className="dot dot-yellow"></span>
                        <span className="dot dot-green"></span>
                      </div>
                      <span>Autenticação SPDealer Web • Login Dinâmico</span>
                    </div>
                    <div className="mockup-body">
                      <div className="mockup-grid">
                        <div className="mockup-field">
                          <label>Usuário / Operador</label>
                          <input type="text" value="kevin.vendas" readOnly />
                        </div>
                        <div className="mockup-field">
                          <label>Senha de Acesso</label>
                          <input type="password" value="••••••••••••" readOnly />
                        </div>
                        <div className="mockup-field">
                          <label>Empresa / Filial</label>
                          <select disabled value="01">
                            <option value="01">01 - SPDEALER MATRIZ</option>
                          </select>
                        </div>
                      </div>
                      <div className="mockup-footer-actions">
                        <button className="mockup-btn mockup-btn-primary">Acessar Sistema</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Permissões de Usuário e Menu Dinâmico com Exemplos Reais */}
              <div className="manual-card" style={{ borderLeft: '4px solid #0d9488' }}>
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faUserLock} style={{ color: '#0d9488' }} />
                  <span>2. Sistema de Permissão de Usuário & Menu Sidebar Dinâmico</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    O SPDealer utiliza um sistema de <strong>Controle de Acesso Baseado em Perfis e Grupos</strong>. Quando um operador faz login, o menu lateral (Sidebar) é construído dinamicamente: apenas as abas e opções para as quais o usuário tem autorização expressa serão exibidas.
                  </p>

                  <div className="shortcut-box" style={{ background: '#f0f9ff', borderColor: '#bae6fd', borderLeftColor: '#0284c7' }}>
                    <h4 style={{ color: '#0369a1' }}>
                      <FontAwesomeIcon icon={faShieldAlt} />
                      Exemplos Práticos de Acesso no Dia a Dia:
                    </h4>
                    <p style={{ color: '#0c4a6e' }}>
                      As permissões garantem segurança operacional e evitam que funcionários visualizem ou alterem informações fora de sua alçada de trabalho.
                    </p>
                  </div>

                  <ul className="step-list" style={{ marginTop: '16px' }}>
                    <li className="step-item">
                      <div className="step-number" style={{ background: '#0284c7' }}>A</div>
                      <div className="step-text">
                        <strong>Exemplo — Usuário Kevin (Vendedor de Balcão / Oficina):</strong>
                        <br />
                        O operador <em>Kevin</em> faz parte do Grupo de Atendimento e Peças. O Administrador configurou o perfil dele para acessar apenas funções operacionais.
                        <br />
                        <strong>O que o Kevin enxerga no menu:</strong> Apenas as abas <strong style={{ color: '#0d9488' }}>Peças</strong> e <strong style={{ color: '#0d9488' }}>Serviço</strong>. As abas de <em>Financeiro</em>, <em>Fiscal</em> e <em>CRM</em> ficam <u>totalmente ocultas e inacessíveis</u> para ele.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number" style={{ background: '#0d9488' }}>B</div>
                      <div className="step-text">
                        <strong>Exemplo — Usuária Lorena (Tesouraria / Financeiro):</strong>
                        <br />
                        A operadora <em>Lorena</em> trabalha no departamento financeiro. Suas atribuições envolvem controle de caixas, contas a pagar e receber.
                        <br />
                        <strong>O que a Lorena enxerga no menu:</strong> Exclusivamente a aba <strong style={{ color: '#0d9488' }}>Financeiro</strong> (Caixas, Bancos, Contas a Pagar/Receber e Fluxo de Caixa). O módulo de <em>Peças</em>, <em>Serviços</em> e <em>Parâmetros</em> não aparecem na tela dela.
                      </div>
                    </li>
                  </ul>

                  {/* Demonstração comparativa dos Menus dos Usuários */}
                  <div className="form-print-mockup">
                    <div className="mockup-header">
                      <div className="mockup-header-dots">
                        <span className="dot dot-red"></span>
                        <span className="dot dot-yellow"></span>
                        <span className="dot dot-green"></span>
                      </div>
                      <span>Simulação Visual do Menu Sidebar Dinâmico por Usuário</span>
                    </div>
                    <div className="mockup-body">
                      <div className="mockup-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <h5 style={{ margin: '0 0 10px 0', color: '#0284c7', fontWeight: 700 }}>Menu do Usuário Kevin (Vendas)</h5>
                          <div style={{ background: '#0d9488', color: '#fff', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                            <FontAwesomeIcon icon={faBoxes} style={{ marginRight: '8px' }} /> Peças (Liberado)
                          </div>
                          <div style={{ background: '#0d9488', color: '#fff', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                            <FontAwesomeIcon icon={faWrench} style={{ marginRight: '8px' }} /> Serviço (Liberado)
                          </div>
                          <div style={{ background: '#f1f5f9', color: '#94a3b8', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontStyle: 'italic' }}>
                            [ Financeiro, Fiscal, CRM - Ocultos ]
                          </div>
                        </div>

                        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <h5 style={{ margin: '0 0 10px 0', color: '#0d9488', fontWeight: 700 }}>Menu da Usuária Lorena (Financeiro)</h5>
                          <div style={{ background: '#0d9488', color: '#fff', padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                            <FontAwesomeIcon icon={faWallet} style={{ marginRight: '8px' }} /> Financeiro (Liberado)
                          </div>
                          <div style={{ background: '#f1f5f9', color: '#94a3b8', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontStyle: 'italic' }}>
                            [ Peças, Serviço, Fiscal, CRM - Ocultos ]
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Sistema de Acesso às Funções (Nível de Ação) */}
              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#0284c7' }} />
                  <span>3. Sistema de Acesso às Funções (Operações e Ações por Tela)</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    Além de filtrar as abas do menu, o sistema de permissões atua no nível detalhado de botões e ações dentro de cada formulário:
                  </p>
                  <ul className="step-list">
                    <li className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-text">
                        <strong>Permissão de Inclusão e Alteração:</strong> Controla se o operador pode criar novos registros ou editar registros já existentes.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-text">
                        <strong>Permissão de Exclusão e Cancelamento:</strong> Botões críticos (como Cancelar NF-e ou Excluir Lançamento de Caixa) exigem direito específico de exclusão.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">3</div>
                      <div className="step-text">
                        <strong>Liberação por Senha de Gerência:</strong> Quando uma operação excede o limite permitido (ex: desconto acima da alçada ou cliente sem limite de crédito), o formulário exibe uma caixa de diálogo solicitando a senha de um supervisor habilitado.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SEÇÃO 2: PEÇAS (DETALHADA ITEM POR ITEM E MECÂNICAS) */}
          {/* ========================================================================= */}
          {activeSection === 'pecas' && (
            <div className="manual-section">
              <div className="manual-section-title">
                <FontAwesomeIcon icon={faBoxes} style={{ color: '#0d9488' }} />
                <span>Módulo de Peças — Detalhamento Completo dos Itens de Menu</span>
              </div>
              <p className="manual-section-subtitle">
                O módulo de Peças é o coração operacional do SPDealer. Abaixo está o detalhamento minucioso de cada item filho do menu e das mecânicas avançadas de orçamento e vendas.
              </p>

              {/* ITEM FILHO 1: CONSULTA DE ESTOQUE */}
              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faSearch} style={{ color: '#0284c7' }} />
                  <span>Item Filho 1: Consulta de Estoque</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    A <strong>Consulta de Estoque</strong> é a ferramenta de localização rápida do almoxarifado. Permite pesquisar peças por múltiplos critérios e checar disponibilidades em tempo real.
                  </p>
                  <ul className="step-list">
                    <li className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-text">
                        <strong>Filtros Principais:</strong> Pesquisa por Código Interno, Código do Fabricante (Código Original), Descrição da Peça, Grupo de Itens, Marca e Aplicação.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-text">
                        <strong>Saldos em Tempo Real:</strong>
                        <br />
                        • <em>Saldo Físico:</em> Quantidade exata armazenada na prateleira.
                        <br />
                        • <em>Saldo Reservado:</em> Quantidade comprometida em pedidos de venda aprovados.
                        <br />
                        • <em>Saldo Disponível:</em> Quantidade livre para novos orçamentos (Saldo Físico - Saldo Reservado).
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">3</div>
                      <div className="step-text">
                        <strong>Visualização de Preços e Posição:</strong> Exibe a tabela de preços (Balcão, Atacado, Custo Médio) e a localização física da peça no estoque (Ex: Corredor A, Prateleira 03).
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* ITEM FILHO 2: CADASTRO DE ESTOQUE */}
              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faBarcode} style={{ color: '#0d9488' }} />
                  <span>Item Filho 2: Cadastro de Estoque</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    O <strong>Cadastro de Estoque</strong> centraliza todas as especificações técnicas, fiscais e comerciais de cada produto comercializado.
                  </p>
                  <ul className="step-list">
                    <li className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-text">
                        <strong>Aba Dados Básicos:</strong> Código do item, descrição comercial, aplicação (em quais máquinas/veículos é utilizado), grupo de itens, fabricante e código de barras EAN.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-text">
                        <strong>Aba Tributação & Fiscal:</strong> Classificação fiscal NCM, Código de Origem, tributação do ICMS (Alíquota, Base de Cálculo, Substituição Tributária - ST), IPI, PIS e COFINS.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">3</div>
                      <div className="step-text">
                        <strong>Aba Custos & Preços:</strong> Definição da margem de lucro (markup), preço balcão, preço atacado, preço para garantia, custo de reposição e custo médio calculado.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* ITEM FILHO 3: ENTRADA DE MERCADORIAS (IMPORTAÇÃO XML) */}
              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faTruckLoading} style={{ color: '#0284c7' }} />
                  <span>Item Filho 3: Entrada de Mercadorias (Importação XML de NF-e)</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    A tela de <strong>Entrada de Mercadorias</strong> automatiza o recebimento de compras efetuando a leitura direta do arquivo XML emitido pelo fornecedor.
                  </p>
                  <ul className="step-list">
                    <li className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-text">
                        <strong>Leitura de Chave da NF-e:</strong> O operador digita ou lê com o leitor de código de barras a chave de 44 dígitos da nota fiscal de compra.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-text">
                        <strong>Mapeamento "De / Para":</strong> O sistema relaciona o código do produto que veio no XML do fornecedor ao código cadastrado internamente no SPDealer. Essa amarração é salva para que nas próximas compras o vínculo ocorra de forma 100% automática.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">3</div>
                      <div className="step-text">
                        <strong>Atualização Automática:</strong> Ao confirmar o lançamento da nota, o sistema incrementa o saldo físico no estoque, recalcula o custo médio ponderado da peça e gera os títulos no módulo de <em>Contas a Pagar</em>.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* ITEM FILHO 4: MANUTENÇÃO DE ORDEM DE COMPRA */}
              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faClipboardCheck} style={{ color: '#0d9488' }} />
                  <span>Item Filho 4: Manutenção de Ordem de Compra</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    A <strong>Ordem de Compra</strong> gerencia o fluxo de pedidos enviados aos fornecedores para reposição de peças ou atendimento a necessidades urgentes.
                  </p>
                  <ul className="step-list">
                    <li className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-text">
                        <strong>Emissão de Pedido de Compra:</strong> Seleção do fornecedor, itens desejados, quantidade pedida, preço negociado e previsão de entrega.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-text">
                        <strong>Acompanhamento de Atendimento:</strong> Controle dos status das ordens (Pendente, Parcialmente Atendida ou Concluída).
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">3</div>
                      <div className="step-text">
                        <strong>Integração com Peças Faltantes (Pecfal):</strong> As ordens de compra podem ser geradas a partir das requisições automáticas do setor de vendas.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* ITEM FILHO 5: INVENTÁRIO DE ESTOQUE */}
              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faBoxes} style={{ color: '#0284c7' }} />
                  <span>Item Filho 5: Inventário de Estoque</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    O <strong>Inventário de Estoque</strong> é o processo de contagem física e alinhamento fiscal/contábil do almoxarifado.
                  </p>
                  <ul className="step-list">
                    <li className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-text">
                        <strong>Congelamento de Saldo:</strong> O supervisor congela o saldo do sistema para o grupo ou setor que será contado, garantindo que movimentações simultâneas não distorçam a apuração.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-text">
                        <strong>Digitação da Contagem Física:</strong> Inclusão das quantidades aferidas manualmente pelos conferentes de estoque.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">3</div>
                      <div className="step-text">
                        <strong>Apuração de Divergências & Ajuste no Kardex:</strong> O sistema compara a contagem física com o saldo contábil. Apuradas as diferenças (sobra ou falta), é gerado o lançamento automático de ajuste de Kardex.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* ITEM FILHO 6: ORÇAMENTO / PEDIDO DE VENDA - MECÂNICAS DETALHADAS */}
              <div className="manual-card" style={{ borderLeft: '4px solid #0284c7' }}>
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faCartPlus} style={{ color: '#0284c7' }} />
                  <span>Item Filho 6: Orçamento / Pedido de Venda — Mecânicas & Regras de Negócio</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    O formulário de <strong>Orçamento e Pedido de Venda</strong> é a principal ferramenta de vendas de peças do SPDealer. Abaixo estão detalhadas todas as suas mecânicas operacionais.
                  </p>

                  {/* Mecânica 1: Cabeçalho */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 700 }}>
                      Mecânica 1: Digitação do Cabeçalho
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#334155' }}>
                      O operador seleciona o <strong>Cliente</strong> (via código ou busca por CPF/CNPJ), o <strong>Vendedor responsável</strong>, a <strong>Tabela de Preços</strong> aplicável, a <strong>Condição de Pagamento</strong> (ex: 30/60 dias ou À Vista) e o <strong>Tipo de Operação Fiscal</strong> (Venda Balcão, Venda Estadual, Transferência).
                    </p>
                  </div>

                  {/* Mecânica 2: O F4 */}
                  <div className="shortcut-box">
                    <h4>
                      <FontAwesomeIcon icon={faKeyboard} />
                      Mecânica 2: Busca Rápida com a Tecla F4 (Consulta de Peças na Grade)
                    </h4>
                    <p>
                      Durante a inclusão dos itens, posicione o cursor no campo <strong>Código da Peça</strong> e pressione a tecla <span className="key-badge">F4</span>:
                      <br /><br />
                      1. O sistema abre a modal de <strong>Pesquisa Avançada de Itens</strong>.
                      <br />
                      2. Digite qualquer palavra-chave da descrição (ex: <em>filtro oleo</em>) ou número do fabricante.
                      <br />
                      3. A lista exibe o <strong>Saldo Disponível em Estoque</strong> e o <strong>Preço de Tabela</strong>.
                      <br />
                      4. Pressione <span className="key-badge">Enter</span> sobre o item selecionado: o código, a descrição, a unidade e o preço unitário são transportados instantaneamente para a grade do orçamento.
                    </p>
                  </div>

                  {/* Mecânica 3: Limite de Crédito */}
                  <div style={{ background: '#fff1f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecdd3', borderLeft: '4px solid #e11d48', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#9f1239', fontWeight: 700 }}>
                      <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '6px' }} />
                      Mecânica 3: Validação de Limite de Crédito & Títulos Vencidos
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#881337' }}>
                      Conforme os itens são adicionados, o sistema calcula o valor total acumulado e valida em tempo real o cadastro do cliente no CRM:
                      <br />
                      • Se o cliente possuir <strong>títulos vencidos não pagos</strong> no Contas a Receber, ou se o valor total do pedido ultrapassar seu <strong>Limite de Crédito aprovado</strong>, o pedido será <strong>bloqueado</strong>.
                      <br />
                      • Para prosseguir com o pedido bloqueado, o sistema exige a digitação da <strong>Senha de Liberação do Gerente/Supervisor</strong>.
                    </p>
                  </div>

                  {/* Mecânica 4: Pecfal */}
                  <div style={{ background: '#fefce8', padding: '16px', borderRadius: '8px', border: '1px solid #fef08a', borderLeft: '4px solid #ca8a04', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#854d0e', fontWeight: 700 }}>
                      <FontAwesomeIcon icon={faBoxes} style={{ marginRight: '6px' }} />
                      Mecânica 4: Peças Faltantes (Pecfal)
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#713f12' }}>
                      Se o vendedor inserir uma quantidade superior ao saldo físico disponível em estoque:
                      <br />
                      • O sistema aceita a digitação do orçamento, porém dispara automaticamente o gatilho de <strong>Pecfal (Peças Faltantes)</strong> para a quantidade em déficit.
                      <br />
                      • A informação da peça faltante é enviada ao painel do setor de compras para emissão urgente da Ordem de Compra.
                    </p>
                  </div>

                  {/* Mecânica 5: Virar Pedido */}
                  <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0', borderLeft: '4px solid #16a34a', marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#14532d', fontWeight: 700 }}>
                      <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '6px' }} />
                      Mecânica 5: Conversão em Pedido de Venda ("Virar Pedido")
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#166534' }}>
                      Após a aprovação do orçamento pelo cliente, o operador clica no botão <strong>Virar Pedido</strong>:
                      <br />
                      1. O sistema altera o indicador `TIPO_ORP` de Orçamento para Pedido de Venda.
                      <br />
                      2. Os produtos da grade têm seu saldo no estoque imediatamente <strong>reservado</strong> no Kardex.
                      <br />
                      3. É realizada a geração das parcelas financeiras prevendo o lançamento no <em>Contas a Receber</em>.
                      <br />
                      4. O pedido fica apto para o faturamento e transmissão da Nota Fiscal Eletrônica (NF-e).
                    </p>
                  </div>

                  {/* Mockup do Orçamento / Pedido */}
                  <div className="form-print-mockup">
                    <div className="mockup-header">
                      <div className="mockup-header-dots">
                        <span className="dot dot-red"></span>
                        <span className="dot dot-yellow"></span>
                        <span className="dot dot-green"></span>
                      </div>
                      <span>Formulário de Orçamento / Pedido de Venda • Demonstração da Grade</span>
                    </div>
                    <div className="mockup-body">
                      <div className="mockup-grid">
                        <div className="mockup-field">
                          <label>Cliente (Busca / F4)</label>
                          <input type="text" value="00482 - FAZENDA STA RITA EIRELI" readOnly />
                        </div>
                        <div className="mockup-field">
                          <label>Condição Pagto</label>
                          <input type="text" value="30 / 60 DIAS (BOLETO)" readOnly />
                        </div>
                        <div className="mockup-field">
                          <label>Código Peça [ Pressione F4 ]</label>
                          <input type="text" className="highlight" value="1010-09 (Busca F4 ativa)" readOnly />
                        </div>
                      </div>

                      <table className="mockup-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Código Peça</th>
                            <th>Descrição da Peça</th>
                            <th>Qtd Pedida</th>
                            <th>Estoque Disp.</th>
                            <th>Vlr Unit. (R$)</th>
                            <th>Total (R$)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>01</td>
                            <td>1010-09</td>
                            <td>FILTRO DE OLEO DIESEL HEAVY</td>
                            <td>4.00</td>
                            <td>12.00</td>
                            <td>150,00</td>
                            <td>600,00</td>
                          </tr>
                          <tr style={{ background: '#fff1f2' }}>
                            <td>02</td>
                            <td>2040-88</td>
                            <td>CORREIA TRANS. PK800 (Pecfal)</td>
                            <td>2.00</td>
                            <td style={{ color: '#e11d48', fontWeight: 700 }}>0.00 (Falta)</td>
                            <td>220,00</td>
                            <td>440,00</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="mockup-footer-actions">
                        <span style={{ fontSize: '13px', fontWeight: 700, alignSelf: 'center', marginRight: 'auto', color: '#0f172a' }}>
                          Total do Pedido: R$ 1.040,00
                        </span>
                        <button className="mockup-btn mockup-btn-secondary">Consultar F4</button>
                        <button className="mockup-btn mockup-btn-accent">Gerar Pecfal</button>
                        <button className="mockup-btn mockup-btn-primary">Virar Pedido</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SEÇÃO 3: FISCAL */}
          {/* ========================================================================= */}
          {activeSection === 'fiscal' && (
            <div className="manual-section">
              <div className="manual-section-title">
                <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#0d9488' }} />
                <span>Módulo Fiscal & NF-e</span>
              </div>
              <p className="manual-section-subtitle">
                Emissão, validação e transmissão de Notas Fiscais Eletrônicas de Saída e Entrada.
              </p>

              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#0284c7' }} />
                  <span>1. Emissão de NF-e e Monitor SEFAZ</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    Ao faturar um pedido de venda ou nota de serviço, a NF-e é transmitida à SEFAZ em tempo real.
                  </p>
                  <ul className="step-list">
                    <li className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-text">
                        <strong>Operação Fiscal & CFOP:</strong> O sistema determina automaticamente a alíquota de ICMS, PIS, COFINS e IPI com base na natureza de operação configurada.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-text">
                        <strong>Danfe e XML:</strong> Após a autorização da SEFAZ, o arquivo XML e a impressão da DANFE são disponibilizados instantaneamente.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SEÇÃO 4: SERVIÇO */}
          {/* ========================================================================= */}
          {activeSection === 'servico' && (
            <div className="manual-section">
              <div className="manual-section-title">
                <FontAwesomeIcon icon={faWrench} style={{ color: '#0d9488' }} />
                <span>Módulo de Serviços & O.S.</span>
              </div>
              <p className="manual-section-subtitle">
                Controle completo das ordens de serviço, tempos de mão de obra (TMO), garantia e modelos de máquina.
              </p>

              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faWrench} style={{ color: '#0284c7' }} />
                  <span>1. Manutenção de Ordens de Serviço e TMO</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    Cadastre os tipos de OS (Revisão, Garantia, Manutenção Interna) e atribua os tempos padrão de mão de obra (TMO) aos mecânicos e técnicos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SEÇÃO 5: FINANCEIRO */}
          {/* ========================================================================= */}
          {activeSection === 'financeiro' && (
            <div className="manual-section">
              <div className="manual-section-title">
                <FontAwesomeIcon icon={faWallet} style={{ color: '#0d9488' }} />
                <span>Módulo Financeiro & Fluxo de Caixa</span>
              </div>
              <p className="manual-section-subtitle">
                Gestão integrada de contas a receber, contas a pagar, movimento de caixa e consolidação bancária.
              </p>

              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faWallet} style={{ color: '#0284c7' }} />
                  <span>1. Movimentação de Caixas e Bancos</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    Lance entradas, saídas e transferências entre contas bancárias com controle total de extrato e conciliação.
                  </p>
                </div>
              </div>

              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#0d9488' }} />
                  <span>2. Contas a Receber e Contas a Pagar</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    Acompanhe vencimentos de títulos de clientes e duplicatas de fornecedores, realizando liquidações parciais ou totais.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SEÇÃO 6: CRM */}
          {/* ========================================================================= */}
          {activeSection === 'crm' && (
            <div className="manual-section">
              <div className="manual-section-title">
                <FontAwesomeIcon icon={faUsers} style={{ color: '#0d9488' }} />
                <span>Módulo CRM & Cadastro de Clientes</span>
              </div>
              <p className="manual-section-subtitle">
                Central de informações sobre clientes, fornecedores e vendedores.
              </p>

              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faUsers} style={{ color: '#0284c7' }} />
                  <span>1. Cadastro de Clientes e Análise de Crédito</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    O cadastro de clientes possui suporte completo para Pessoa Física e Jurídica, incluindo consulta automática de CNPJ, limite de crédito e dados de cobrança.
                  </p>

                  {/* Mockup do Cliente */}
                  <div className="form-print-mockup">
                    <div className="mockup-header">
                      <div className="mockup-header-dots">
                        <span className="dot dot-red"></span>
                        <span className="dot dot-yellow"></span>
                        <span className="dot dot-green"></span>
                      </div>
                      <span>Cadastro de Cliente (Abas e Limite de Crédito)</span>
                    </div>
                    <div className="mockup-body">
                      <div className="mockup-grid">
                        <div className="mockup-field">
                          <label>Razão Social / Nome</label>
                          <input type="text" value="AGROPECUARIA BOM JESUS SA" readOnly />
                        </div>
                        <div className="mockup-field">
                          <label>CNPJ / CPF</label>
                          <input type="text" value="12.345.678/0001-90" readOnly />
                        </div>
                        <div className="mockup-field">
                          <label>Limite de Crédito (R$)</label>
                          <input type="text" value="50.000,00" readOnly />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ManualPage;
