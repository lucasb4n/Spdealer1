import styled from 'styled-components';

/**
 * PADRÃO PADRONIZADO PARA TODOS OS FORMULÁRIOS E PÁGINAS
 * 
 * Todos os formulários DEVEM usar estes containers para manter
 * consistência visual e evitar perda de espaço no workspace.
 * 
 * USO:
 * import { PageContainer, ContentWrapper } from 'styles/PageContainers';
 * 
 * <PageContainer>
 *   <ContentWrapper>
 *     conteudo aqui
 *   </ContentWrapper>
 * </PageContainer>
 */

/**
 * PÁGINA PRINCIPAL - Container que ocupa 100% da altura da viewport
 * - Altura total da página (100vh)
 * - Flex layout para distribuir espaço
 * - Overflow hidden no container (conteúdo controla o overflow)
 * - Padding: 0 (nenhum espaçamento externo)
 */
export const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
`;

/**
 * CONTEÚDO RESPONSIVO - Wrapper que contém o conteúdo real
 * - Flex: 1 para ocupar espaço disponível
 * - Overflow-y: auto para scroll vertical controlado
 * - Overflow-x: hidden para evitar scroll horizontal
 * - Padding: 20px para espaçamento interno
 * - Começa a renderizar no TOPO (nenhum padding-top)
 */
export const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
`;

/**
 * ALTERNATIVA SIMPLES - Para páginas que não precisam do layout completo
 * - Padding apenas no topo (após header)
 * - Deixa espaço natural para o conteúdo
 * 
 * USO: Para layouts mais simples (ex: FinanceiroConfig)
 */
export const SimplePageContainer = styled.div`
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

/**
 * CONTAINER COM ALTURA DINÂMICA - Para páginas que não ocupam 100% da viewport
 * - min-height em vez de height (permite crescer se necessário)
 * - Espaçamento controlado
 * 
 * USO: Para dashboards e páginas que podem expandir
 */
export const DynamicPageContainer = styled.div`
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  padding: 0;
  width: 100%;
`;

/**
 * CABEÇALHO DE PÁGINA - Para títulos e controles no topo
 * - Background branco para destacar
 * - Border-bottom para separação visual
 * - Shadow leve para profundidade
 * - Padding padrão para consistência
 */
export const PageHeader = styled.div`
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e1e5e9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

/**
 * TÍTULO DE PÁGINA - Padrão para h1/h2 em páginas
 */
export const PageTitle = styled.h1`
  color: #2c3e50;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
`;

/**
 * SUBTÍTULO DE PÁGINA
 */
export const PageSubtitle = styled.p`
  color: #6c757d;
  margin: 5px 0 0 0;
  font-size: 14px;
`;













