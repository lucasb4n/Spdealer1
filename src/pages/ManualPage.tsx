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
  faArrowRight
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
            placeholder="Pesquisar lógica, teclas (ex: F4, NFe)..."
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
          {/* SEÇÃO 1: INTRODUÇÃO */}
          {activeSection === 'introducao' && (
            <div className="manual-section">
              <div className="manual-section-title">
                <FontAwesomeIcon icon={faBookOpen} style={{ color: '#0d9488' }} />
                <span>Introdução e Navegação do Sistema</span>
              </div>
              <p className="manual-section-subtitle">
                Bem-vindo ao Manual Oficial do SPDealer Web! Esta seção descreve a estrutura base de acesso, segurança, navegação e os atalhos essenciais para agilizar sua rotina.
              </p>

              {/* Card 1: Login Dinâmico e Controle de Sessão */}
              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faKey} style={{ color: '#0284c7' }} />
                  <span>1. Sistema de Login Dinâmico & Autenticação</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    O acesso ao SPDealer é protegido por autenticação centralizada. O sistema aceita seu nome de usuário ou e-mail cadastrado.
                  </p>
                  <ul className="step-list">
                    <li className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-text">
                        <strong>Autenticação Criptografada:</strong> Ao informar usuário e senha na tela de login, o sistema gera um token JWT de sessão de alta segurança.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-text">
                        <strong>Persistência de Sessão:</strong> Suas preferências e perfil permanecem ativos enquanto estiver navegando. Caso fique inativo por segurança, a sessão expirará automaticamente.
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
                      <span>Formulário de Acesso • Login SPDealer</span>
                    </div>
                    <div className="mockup-body">
                      <div className="mockup-grid">
                        <div className="mockup-field">
                          <label>Usuário / Operador</label>
                          <input type="text" value="admin.vendas" readOnly />
                        </div>
                        <div className="mockup-field">
                          <label>Senha de Acesso</label>
                          <input type="password" value="••••••••••••" readOnly />
                        </div>
                      </div>
                      <div className="mockup-footer-actions">
                        <button className="mockup-btn mockup-btn-primary">Entrar no Sistema</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Sidebar Dinâmico e Permissões */}
              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#0d9488' }} />
                  <span>2. Menu Sidebar Dinâmico e Controle de Acesso às Funções</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    O menu lateral do SPDealer adapta-se automaticamente conforme o grupo de usuário e os programas que o operador possui acesso.
                  </p>
                  <ul className="step-list">
                    <li className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-text">
                        <strong>Filtragem Inteligente de Telas:</strong> Se o seu usuário não tiver permissão para um módulo específico (ex: Parâmetros Fiscais Avançados), a opção fica ocultada no menu para simplificar seu fluxo visual.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-text">
                        <strong>Atalhos Rápido de Menu:</strong> O menu lateral permite recolhimento para ampliar a área útil de trabalho na tela.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 3: Lógica do F4 no Orçamento / Pedido */}
              <div className="manual-card" style={{ borderLeft: '4px solid #0284c7' }}>
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faKeyboard} style={{ color: '#0284c7' }} />
                  <span>3. Lógica do Atalho <span className="key-badge">F4</span> no Orçamento e Pedido de Venda</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    A tecla <span className="key-badge">F4</span> é a ferramenta mais produtiva do vendedor durante a digitação de orçamentos e pedidos.
                  </p>

                  <div className="shortcut-box">
                    <h4>
                      <FontAwesomeIcon icon={faLightbulb} />
                      Como Funciona a Lógica da Tecla F4:
                    </h4>
                    <p>
                      No campo <strong>Código da Peça / Produto</strong> da grade de itens, ao pressionar <span className="key-badge">F4</span>, o sistema abre instantaneamente a janela de <strong>Pesquisa Avançada de Peças</strong> com saldo em estoque em tempo real, aplicação, substitutos e tabela de preços.
                    </p>
                  </div>

                  <ul className="step-list">
                    <li className="step-item">
                      <div className="step-number">1</div>
                      <div className="step-text">
                        <strong>Acionamento no Campo de Código:</strong> Posicione o cursor no campo do item do orçamento e pressione <span className="key-badge">F4</span> (ou clique no ícone da lupa ao lado).
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">2</div>
                      <div className="step-text">
                        <strong>Pesquisa por Código ou Descrição:</strong> Digite parte do nome da peça ou número do fabricante. O sistema filtra com agilidade o saldo físico e disponível.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">3</div>
                      <div className="step-text">
                        <strong>Preenchimento Automático:</strong> Ao selecionar a peça desejada teclando <span className="key-badge">Enter</span> na lista, o código, descrição, unidade e preço unitário padrão são transportados diretamente para o formulário.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">4</div>
                      <div className="step-text">
                        <strong>Lógica de Virar Pedido:</strong> Após concluir a inclusão dos itens no orçamento, clique em <strong>Virar Pedido</strong>. O sistema valida se há pendências no cadastro de pecfal (peças faltantes), grava o código `TIPO_ORP` e gera a movimentação comercial automaticamente.
                      </div>
                    </li>
                  </ul>

                  {/* Mockup do Orçamento com Destaque no F4 */}
                  <div className="form-print-mockup">
                    <div className="mockup-header">
                      <div className="mockup-header-dots">
                        <span className="dot dot-red"></span>
                        <span className="dot dot-yellow"></span>
                        <span className="dot dot-green"></span>
                      </div>
                      <span>Formulário de Orçamento / Pedido de Venda (Uso da Tecla F4)</span>
                    </div>
                    <div className="mockup-body">
                      <div className="mockup-grid">
                        <div className="mockup-field">
                          <label>Cliente (F4 / Busca)</label>
                          <input type="text" value="00124 - AGRO SERVICOS LTDA" readOnly />
                        </div>
                        <div className="mockup-field">
                          <label>Código da Peça [ Pressione F4 ]</label>
                          <input type="text" className="highlight" value="1010-09 (F10 / F4 ativo)" readOnly />
                        </div>
                        <div className="mockup-field">
                          <label>Quantidade</label>
                          <input type="text" value="2.00" readOnly />
                        </div>
                      </div>

                      <table className="mockup-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Código Peça</th>
                            <th>Descrição</th>
                            <th>Qtd</th>
                            <th>Vlr Unit. (R$)</th>
                            <th>Total (R$)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>01</td>
                            <td>1010-09</td>
                            <td>FILTRO DE OLEO MOTOR DIESEL</td>
                            <td>2</td>
                            <td>145,00</td>
                            <td>290,00</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="mockup-footer-actions">
                        <button className="mockup-btn mockup-btn-secondary">Consultar F4</button>
                        <button className="mockup-btn mockup-btn-primary">Virar Pedido</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 2: PEÇAS */}
          {activeSection === 'pecas' && (
            <div className="manual-section">
              <div className="manual-section-title">
                <FontAwesomeIcon icon={faBoxes} style={{ color: '#0d9488' }} />
                <span>Módulo de Peças e Estoque</span>
              </div>
              <p className="manual-section-subtitle">
                Gerencie todo o fluxo de almoxarifado, catálogo de itens, entradas de notas e contagem de inventário.
              </p>

              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#0284c7' }} />
                  <span>1. Consulta & Cadastro de Estoque</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    Permite manter informações detalhadas sobre as peças e componentes:
                  </p>
                  <ul className="step-list">
                    <li className="step-item">
                      <div className="step-number">•</div>
                      <div className="step-text">
                        <strong>Código de Fabricante & Aplicação:</strong> Cadastre referências cruzadas e modelos compatíveis.
                      </div>
                    </li>
                    <li className="step-item">
                      <div className="step-number">•</div>
                      <div className="step-text">
                        <strong>Níveis de Preço & Custo:</strong> Mantenha preço de venda balcão, custo médio e margens por categoria.
                      </div>
                    </li>
                  </ul>

                  {/* Mockup Cadastro de Estoque */}
                  <div className="form-print-mockup">
                    <div className="mockup-header">
                      <div className="mockup-header-dots">
                        <span className="dot dot-red"></span>
                        <span className="dot dot-yellow"></span>
                        <span className="dot dot-green"></span>
                      </div>
                      <span>Cadastro de Item de Estoque</span>
                    </div>
                    <div className="mockup-body">
                      <div className="mockup-grid">
                        <div className="mockup-field">
                          <label>Código do Prod.</label>
                          <input type="text" value="P-5500" readOnly />
                        </div>
                        <div className="mockup-field">
                          <label>Descrição do Item</label>
                          <input type="text" value="CORREIA DENTADA INDUSTRIAL 10PK" readOnly />
                        </div>
                        <div className="mockup-field">
                          <label>Preço Balcão (R$)</label>
                          <input type="text" value="380,00" readOnly />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#0d9488' }} />
                  <span>2. Entrada de Mercadorias (Importação XML)</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    Receba notas de fornecedores automaticamente importando o arquivo XML da NF-e, associando os itens ao cadastro interno e atualizando o custo e estoque automaticamente.
                  </p>
                </div>
              </div>

              <div className="manual-card">
                <div className="manual-card-title">
                  <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#0284c7' }} />
                  <span>3. Manutenção de Ordem de Compra e Inventário</span>
                </div>
                <div className="manual-card-content">
                  <p>
                    Controle os pedidos pendentes junto aos fornecedores e realize ajustes de balanço de inventário periódico com relatórios de divergência.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 3: FISCAL */}
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

          {/* SEÇÃO 4: SERVIÇO */}
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

          {/* SEÇÃO 5: FINANCEIRO */}
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

          {/* SEÇÃO 6: CRM */}
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
