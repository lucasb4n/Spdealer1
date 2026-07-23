import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExternalLinkAlt, faPlus } from '@fortawesome/free-solid-svg-icons'; 

interface Tab {
  id: string;
  title: string;
  component: React.ReactNode;
  closable: boolean;
  detachable: boolean;
  icon?: any;
}

interface TabContainerProps {
  defaultTab?: Tab;
  onTabDetach?: (tab: Tab) => void;
  onNewTab?: () => void;
}

const TabsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
`;

const TabsHeader = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 16px;
  min-height: 48px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TabsNav = styled.div`
  display: flex;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  background: ${props => props.isActive ? '#3b82f6' : 'transparent'};
  color: ${props => props.isActive ? '#fff' : '#6b7280'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  white-space: nowrap;
  position: relative;
  transition: all 0.2s ease;
  margin-right: 2px;

  &:hover {
    background: ${props => props.isActive ? '#3b82f6' : '#f3f4f6'};
    color: ${props => props.isActive ? '#fff' : '#374151'};
  }

  &:before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.isActive ? '#3b82f6' : 'transparent'};
  }
`;

const TabActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const NewTabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  margin-left: 8px;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }
`;

const TabContent = styled.div`
  flex: 1;
  overflow: hidden;
  background: #fff;
`;

const TabContainer: React.FC<TabContainerProps> = ({ 
  defaultTab, 
  onTabDetach, 
  onNewTab 
}) => {
  const [tabs, setTabs] = useState<Tab[]>(defaultTab ? [defaultTab] : []);
  const [activeTab, setActiveTab] = useState<string>(defaultTab?.id || '');

  const closeTab = (tabId: string) => {
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(updatedTabs);
    
    if (activeTab === tabId && updatedTabs.length > 0) {
      setActiveTab(updatedTabs[0].id);
    } else if (updatedTabs.length === 0) {
      setActiveTab('');
    }
  };

  const detachTab = (tab: Tab) => {
    closeTab(tab.id);
    if (onTabDetach) {
      onTabDetach(tab);
    }
  };

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const addTab = (tab: Tab) => {
    setTabs(prev => [...prev, tab]);
    setActiveTab(tab.id);
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <TabsWrapper>
      <TabsHeader>
        <TabsNav>
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon && <FontAwesomeIcon icon={tab.icon} size="sm" />}
              <span>{tab.title}</span>
              
              <TabActions>
                {tab.detachable && (
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      detachTab(tab);
                    }}
                    title="Destacar em nova janela"
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} size="xs" />
                  </ActionButton>
                )}
                
                {tab.closable && (
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    title="Fechar aba"
                  >
                    <FontAwesomeIcon icon={faTimes} size="xs" />
                  </ActionButton>
                )}
              </TabActions>
            </TabButton>
          ))}
        </TabsNav>
        
        {onNewTab && (
          <NewTabButton onClick={onNewTab} title="Nova aba">
            <FontAwesomeIcon icon={faPlus} size="xs" />
            Nova
          </NewTabButton>
        )}
      </TabsHeader>

      <TabContent>
        {currentTab ? currentTab.component : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Nenhuma aba aberta
          </div>
        )}
      </TabContent>
    </TabsWrapper>
  );
};

export { TabContainer };
export type { Tab };













