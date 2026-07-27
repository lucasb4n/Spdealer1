import styled from 'styled-components';

export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background: var(--bg-page, #f6f7fb);
`;

export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color, #e9ecef);
`;

export const PageContent = styled.div`
  flex: 1;
  overflow: auto;
  padding-top: 12px;
`;

// Aliases/exports esperados por várias páginas
export const DynamicPageContainer = PageContainer;
export const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color-dark, #2c3e50);
`;
export const PageSubtitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  color: var(--text-color-muted, #6c757d);
`;

export default PageContainer;













