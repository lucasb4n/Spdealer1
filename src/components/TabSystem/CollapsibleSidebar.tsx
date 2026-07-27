import type { MenuItem as MenuItemType, MenuGroup as MenuGroupType } from 'menu';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import styled, { keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import {
  faCogs, faWrench, faMoneyBill, faHandshake, faLayerGroup,
  faBars, faSignOutAlt, faSlidersH, faUser, faUsersCog, faChartBar,
  faSearch, faTimes, faChevronRight, faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { AssetService, LogoKey } from 'services/AssetService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

function getFaIcon(iconName?: string): IconDefinition {
  switch (iconName) {
    case 'fa-cogs': return faCogs;
    case 'fa-wrench': return faWrench;
    case 'fa-money-bill': return faMoneyBill;
    case 'fa-handshake': return faHandshake;
    case 'fa-layer-group': return faLayerGroup;
    case 'fa-sliders-h': return faSlidersH;
    case 'fa-user': return faUser;
    case 'fa-users-cog': return faUsersCog;
    case 'fa-chart-bar': return faChartBar;
    default: return faLayerGroup;
  }
}

type MenuItem = MenuItemType & { action?: () => void; };
type MenuGroup = MenuGroupType;

interface CollapsibleSidebarProps {
  onMenuItemClick: (item: MenuItem) => void;
  onLogout?: () => void;
  sidebarCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// ============================================================
// STYLED COMPONENTS — Dark Premium Sidebar
// ============================================================

const SidebarContainer = styled.div<{ $isCollapsed: boolean }>`
  position: fixed;
  left: 0;
  top: 0;
  bottom: 48px;
  width: ${props => props.$isCollapsed ? 'var(--sidebar-width-collapsed, 68px)' : 'var(--sidebar-width, 260px)'};
  background: var(--sidebar-bg, #0F172A);
  transition: width var(--transition-slow, 300ms ease);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(15, 23, 42, 0.2);
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
`;

const SidebarLogo = styled.img`
  max-width: 140px;
  max-height: 80px;
  margin: 10px 0;
  object-fit: contain;
  user-select: none;
  transition: all 0.3s ease;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
`;

const SidebarHeaderRow = styled.div<{ $isCollapsed?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: ${props => props.$isCollapsed ? 'center' : 'flex-start'};
  gap: 8px;
`;

const CollapseButton = styled.button`
  background: none;
  border: none;
  color: var(--sidebar-text, #CBD5E1);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 200ms ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #F8FAFC;
  }
`;

// Search box
const SearchBox = styled.div<{ $isCollapsed: boolean }>`
  padding: ${props => props.$isCollapsed ? '8px 6px' : '8px 14px'};
  flex-shrink: 0;
  display: ${props => props.$isCollapsed ? 'none' : 'block'};
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInputField = styled.input`
  width: 100%;
  padding: 8px 32px 8px 34px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #E2E8F0;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  transition: all 200ms ease;

  &::placeholder { color: rgba(148, 163, 184, 0.5); }
  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--sidebar-accent, #0D9488);
    box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.15);
  }
`;

const SearchIconStyled = styled.span`
  position: absolute;
  left: 10px;
  color: rgba(148, 163, 184, 0.5);
  font-size: 11px;
  pointer-events: none;
`;

const SearchClear = styled.button`
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  color: rgba(148, 163, 184, 0.5);
  cursor: pointer;
  padding: 4px;
  font-size: 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { color: #E2E8F0; background: rgba(255,255,255,0.08); }
`;

// Menu section
const MenuSection = styled.div`
  flex: 1;
  padding: 4px 0;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
`;

const MenuGroupItem = styled.div`
  margin-bottom: 2px;
`;

const MenuGroupButton = styled.button<{ $isActive?: boolean; $isCollapsed?: boolean }>`
  background: ${props => props.$isActive ? 'rgba(13, 148, 136, 0.12)' : 'transparent'};
  border: none;
  color: ${props => props.$isActive ? '#5EEAD4' : 'var(--sidebar-text, #CBD5E1)'};
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: ${props => props.$isCollapsed ? 'center' : 'flex-start'};
  gap: ${props => props.$isCollapsed ? '0' : '12px'};
  padding: ${props => props.$isCollapsed ? '0 8px' : '0 16px'};
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 200ms ease;
  border-left: 3px solid ${props => props.$isActive ? 'var(--sidebar-accent, #0D9488)' : 'transparent'};
  position: relative;

  &:hover {
    background: var(--sidebar-bg-hover, #1E293B);
    color: #F8FAFC;
  }

  svg:first-child {
    font-size: ${props => props.$isCollapsed ? '18px' : '14px'};
    min-width: 20px;
    color: ${props => props.$isActive ? '#5EEAD4' : 'var(--sidebar-text, #CBD5E1)'};
    transition: color 200ms ease;
  }
`;

const MenuGroupLabel = styled.span`
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MenuGroupChevron = styled.span<{ $isOpen?: boolean }>`
  font-size: 10px;
  color: rgba(148, 163, 184, 0.5);
  transition: transform 200ms ease;
  transform: ${props => props.$isOpen ? 'rotate(90deg)' : 'rotate(0)'};
`;

// Submenu items (inline)
const SubMenuContainer = styled.div<{ $isOpen: boolean }>`
  overflow: hidden;
  max-height: ${props => props.$isOpen ? '500px' : '0'};
  transition: max-height 300ms ease;
`;

const SubMenuItem = styled.button<{ $isCollapsed?: boolean }>`
  background: transparent;
  border: none;
  color: rgba(203, 213, 225, 0.7);
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px 0 44px;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 150ms ease;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: rgba(13, 148, 136, 0.08);
    color: #5EEAD4;
    padding-left: 48px;
  }

  svg {
    font-size: 11px;
    color: rgba(148, 163, 184, 0.4);
    min-width: 14px;
  }
`;

// Sub-sub items
const SubSubItem = styled.button`
  background: transparent;
  border: none;
  color: rgba(203, 213, 225, 0.55);
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 0 60px;
  font-size: 11px;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 150ms ease;
  text-align: left;

  &:hover {
    background: rgba(13, 148, 136, 0.06);
    color: #5EEAD4;
    padding-left: 64px;
  }
`;

const SidebarFooter = styled.div`
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  position: relative;
`;

const LogoutButton = styled.button<{ $isCollapsed: boolean }>`
  background: transparent;
  border: none;
  color: var(--sidebar-text, #CBD5E1);
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: ${props => props.$isCollapsed ? 'center' : 'flex-start'};
  gap: 10px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  border-radius: 8px;
  transition: all 200ms ease;

  &:hover {
    background: rgba(220, 38, 38, 0.12);
    color: #FCA5A5;
  }

  svg { font-size: 14px; }
`;

const Tooltip = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  left: calc(var(--sidebar-width-collapsed, 68px) + 4px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--slate-800, #1E293B);
  color: #F8FAFC;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  opacity: ${props => props.$isVisible ? 1 : 0};
  pointer-events: none;
  transition: opacity 150ms ease;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 1001;
`;

const CollapsedPopover = styled.div`
  position: absolute;
  left: calc(var(--sidebar-width-collapsed, 68px) + 2px);
  top: 0;
  width: 220px;
  background: var(--sidebar-bg, #0F172A);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  box-shadow: 8px 0 24px rgba(0, 0, 0, 0.3);
  z-index: 1002;
  overflow: hidden;
  animation: ${slideIn} 0.2s ease-out;
`;

const PopoverHeader = styled.div`
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  color: #F8FAFC;
  font-size: 13px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const PopoverItem = styled.button`
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(203, 213, 225, 0.8);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
  text-align: left;

  &:hover {
    background: rgba(13, 148, 136, 0.1);
    color: #5EEAD4;
  }

  svg {
    font-size: 11px;
    width: 14px;
    color: rgba(148, 163, 184, 0.5);
  }
`;

const PopoverSubItem = styled.button`
  width: 100%;
  padding: 8px 16px 8px 36px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(203, 213, 225, 0.6);
  font-size: 11px;
  font-weight: 400;
  cursor: pointer;
  transition: all 150ms ease;
  text-align: left;

  &:hover {
    background: rgba(13, 148, 136, 0.06);
    color: #5EEAD4;
  }
`;

// Admin tools
const AdminFab = styled.button`
  position: absolute;
  right: 8px;
  top: 8px;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255,255,255,0.08);
  color: var(--sidebar-text, #CBD5E1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 200ms ease;
  &:hover { background: rgba(255,255,255,0.15); color: #F8FAFC; }
`;

const AdminMenu = styled.div`
  position: absolute;
  right: 8px;
  bottom: 52px;
  width: 220px;
  background: #1E293B;
  color: #E2E8F0;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  padding: 8px;
  z-index: 5;
  animation: ${fadeIn} 0.2s ease-out;
`;

const AdminMenuTitle = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: rgba(148, 163, 184, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 4px 8px;
`;

const AdminMenuRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  &:hover { background: rgba(255,255,255,0.05); }
`;

const AdminActionBtn = styled.button`
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: #CBD5E1;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  &:hover { background: rgba(255,255,255,0.08); color: #F8FAFC; }
`;

const NoResults = styled.div`
  padding: 24px 16px;
  text-align: center;
  color: rgba(148, 163, 184, 0.5);
  font-size: 12px;
  font-family: 'Inter', sans-serif;
`;

// ============================================================
// COMPONENT
// ============================================================

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ onMenuItemClick, onLogout, sidebarCollapsed, onCollapseChange }) => {
  const { menuGroups, isLoading } = useNavigation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [activePopoverGroupId, setActivePopoverGroupId] = useState<number | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [pendingUploadKey, setPendingUploadKey] = useState<LogoKey | null>(null);
  const [logoVersion, setLogoVersion] = useState(0);

  const isAdmin = useMemo(() => {
    const role = user?.role || '';
    return role.toLowerCase().includes('admin');
  }, [user?.role]);

  const sidebarLogoUrl = useMemo(() => `${AssetService.getLogoUrl('sidebar')}?v=${logoVersion}`, [logoVersion]);

  useEffect(() => {
    if (typeof sidebarCollapsed === 'boolean') setIsCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    try {
      const width = isCollapsed ? 'var(--sidebar-width-collapsed, 68px)' : 'var(--sidebar-width, 260px)';
      document.body.style.setProperty('--sidebar-width', isCollapsed ? '68px' : '260px');
      document.body.classList.toggle('sidebar-collapsed', isCollapsed);
    } catch (e) { /* noop */ }
  }, [isCollapsed]);

  const toggleCollapse = () => {
    if (onCollapseChange) onCollapseChange(!isCollapsed);
  };

  const handleToggleGroup = (groupId: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleItemClick = useCallback((item: any) => {
    const path = item.route || item.path || item.rota;
    if (path) {
      navigate(path);
      setSearchQuery('');
    } else {
      onMenuItemClick(item);
    }
  }, [navigate, onMenuItemClick]);

  // Filter menu groups by search
  const filteredMenuGroups = useMemo(() => {
    if (!searchQuery.trim()) return menuGroups;
    const q = searchQuery.toLowerCase();
    return menuGroups
      .map(group => {
        const filteredItems = (group.items || []).filter(item => {
          const nameMatch = (item.name || item.descricao || '').toLowerCase().includes(q);
          const childMatch = item.filhos?.some(f => (f.name || f.descricao || '').toLowerCase().includes(q));
          return nameMatch || childMatch;
        });
        if (filteredItems.length > 0 || group.name.toLowerCase().includes(q)) {
          return { ...group, items: filteredItems.length > 0 ? filteredItems : group.items };
        }
        return null;
      })
      .filter(Boolean) as MenuGroup[];
  }, [menuGroups, searchQuery]);

  // Auto-expand groups when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      const ids = new Set(filteredMenuGroups.map(g => g.id));
      setExpandedGroups(ids);
    }
  }, [searchQuery, filteredMenuGroups]);

  // Admin handlers
  const handleDownload = async (key: LogoKey) => {
    try { await AssetService.downloadLogo(key); notify('success', `Logo ${key} baixada!`); }
    catch { notify('error', `Erro ao baixar logo ${key}`); }
  };

  const triggerUpload = (key: LogoKey) => {
    setPendingUploadKey(key);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const onFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !pendingUploadKey) return;
    try {
      await AssetService.uploadLogo(pendingUploadKey, file);
      if (pendingUploadKey === 'sidebar') setLogoVersion(v => v + 1);
      notify('success', `Logo ${pendingUploadKey} enviada!`);
    } catch { notify('error', `Erro ao enviar logo ${pendingUploadKey}`); }
    finally { setPendingUploadKey(null); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  // ESC to clear search or close admin
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (searchQuery) setSearchQuery('');
        if (showAdminMenu) setShowAdminMenu(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [searchQuery, showAdminMenu]);

  // Handle clicking outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activePopoverGroupId !== null) {
        const target = e.target as HTMLElement;
        if (!target.closest(`#popover-${activePopoverGroupId}`) && !target.closest('button')) {
          setActivePopoverGroupId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePopoverGroupId]);

  return (
    <SidebarContainer $isCollapsed={isCollapsed}>
      <SidebarHeader>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <CollapseButton onClick={toggleCollapse}>
            <FontAwesomeIcon icon={faBars} size="lg" />
          </CollapseButton>
          
          {!isCollapsed && (
            <>
              <SidebarLogo 
                src={`${process.env.PUBLIC_URL || ''}/LogoEmpresa.png`} 
                alt="L&S Logo"
                style={{ maxWidth: '40px', maxHeight: '40px', margin: 0 }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#0D9488', letterSpacing: '2px', marginLeft: 'auto' }}>MENU</div>
            </>
          )}
        </div>
      </SidebarHeader>

      {/* Search */}
      <SearchBox $isCollapsed={isCollapsed}>
        <SearchInputWrapper>
          <SearchIconStyled><FontAwesomeIcon icon={faSearch} /></SearchIconStyled>
          <SearchInputField
            type="text"
            placeholder="Buscar no menu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <SearchClear onClick={() => setSearchQuery('')}>
              <FontAwesomeIcon icon={faTimes} />
            </SearchClear>
          )}
        </SearchInputWrapper>
      </SearchBox>

      <MenuSection>
        {isLoading ? (
          <NoResults>Carregando menu...</NoResults>
        ) : filteredMenuGroups.length === 0 ? (
          <NoResults>Nenhum item encontrado</NoResults>
        ) : (
          filteredMenuGroups.map((group: MenuGroup) => {
            const hasChildren = Array.isArray(group.items) && group.items.length > 0;
            const isExpanded = expandedGroups.has(group.id);
            const isPopoverOpen = activePopoverGroupId === group.id && isCollapsed;

            return (
              <MenuGroupItem key={group.id} style={{ position: 'relative' }}>
                <MenuGroupButton
                  $isActive={isExpanded || isPopoverOpen}
                  $isCollapsed={isCollapsed}
                  title={isCollapsed ? '' : group.name}
                  onClick={hasChildren ? (isCollapsed ? () => setActivePopoverGroupId(isPopoverOpen ? null : group.id) : () => handleToggleGroup(group.id)) : undefined}
                  onMouseEnter={() => isCollapsed && setHoveredItem(`group-${group.id}`)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <FontAwesomeIcon icon={getFaIcon(group.icon)} />
                  {!isCollapsed && (
                    <>
                      <MenuGroupLabel>{group.name}</MenuGroupLabel>
                      {hasChildren && (
                        <MenuGroupChevron $isOpen={isExpanded}>
                          <FontAwesomeIcon icon={faChevronRight} />
                        </MenuGroupChevron>
                      )}
                    </>
                  )}
                  {isCollapsed && hoveredItem === `group-${group.id}` && !isPopoverOpen && (
                    <Tooltip $isVisible={true}>
                      {group.name}
                    </Tooltip>
                  )}
                </MenuGroupButton>

                {/* Popover Submenu (for collapsed state) */}
                {isPopoverOpen && hasChildren && (
                  <CollapsedPopover id={`popover-${group.id}`}>
                    <PopoverHeader>{group.name}</PopoverHeader>
                    {group.items.map((item: any) => {
                      const hasSubChildren = Array.isArray(item.filhos) && item.filhos.length > 0;
                      return (
                        <React.Fragment key={item.id}>
                          <PopoverItem onClick={() => { handleItemClick(item); setActivePopoverGroupId(null); }}>
                            <FontAwesomeIcon icon={getFaIcon(item.icon)} />
                            <span>{item.name || item.descricao || ''}</span>
                          </PopoverItem>
                          {hasSubChildren && item.filhos.map((sub: any, idx: number) => (
                            <PopoverSubItem key={sub.id || idx} onClick={() => { handleItemClick(sub); setActivePopoverGroupId(null); }}>
                              <span>•</span>
                              {sub.name || sub.descricao || ''}
                            </PopoverSubItem>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </CollapsedPopover>
                )}

                {/* Inline submenu (for expanded state) */}
                {!isCollapsed && hasChildren && (
                  <SubMenuContainer $isOpen={isExpanded}>
                    {group.items.map((item: any) => {
                      const hasSubChildren = Array.isArray(item.filhos) && item.filhos.length > 0;
                      return (
                        <React.Fragment key={item.id}>
                          <SubMenuItem onClick={() => handleItemClick(item)}>
                            <FontAwesomeIcon icon={getFaIcon(item.icon)} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.name || item.descricao || ''}
                            </span>
                          </SubMenuItem>
                          {hasSubChildren && item.filhos.map((sub: any, idx: number) => (
                            <SubSubItem key={sub.id || idx} onClick={() => handleItemClick(sub)}>
                              <span>•</span>
                              {sub.name || sub.descricao || ''}
                            </SubSubItem>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </SubMenuContainer>
                )}
              </MenuGroupItem>
            );
          })
        )}
      </MenuSection>

      <SidebarFooter>
        {isAdmin && (
          <>
            <AdminFab onClick={() => setShowAdminMenu(v => !v)} title="Gerenciar logos">
              <FontAwesomeIcon icon={faCogs} />
            </AdminFab>
            {showAdminMenu && (
              <AdminMenu>
                <AdminMenuTitle>Logos</AdminMenuTitle>
                <AdminMenuRow>
                  <span>Login</span>
                  <div>
                    <AdminActionBtn onClick={() => handleDownload('login')}>Baixar</AdminActionBtn>
                    <AdminActionBtn onClick={() => triggerUpload('login')} style={{ marginLeft: 4 }}>Enviar</AdminActionBtn>
                  </div>
                </AdminMenuRow>
                <AdminMenuRow>
                  <span>Sidebar</span>
                  <div>
                    <AdminActionBtn onClick={() => handleDownload('sidebar')}>Baixar</AdminActionBtn>
                    <AdminActionBtn onClick={() => triggerUpload('sidebar')} style={{ marginLeft: 4 }}>Enviar</AdminActionBtn>
                  </div>
                </AdminMenuRow>
                <AdminMenuRow>
                  <span>Sistema</span>
                  <div>
                    <AdminActionBtn onClick={() => handleDownload('system')}>Baixar</AdminActionBtn>
                    <AdminActionBtn onClick={() => triggerUpload('system')} style={{ marginLeft: 4 }}>Enviar</AdminActionBtn>
                  </div>
                </AdminMenuRow>
              </AdminMenu>
            )}
          </>
        )}

        <LogoutButton $isCollapsed={isCollapsed} onClick={onLogout}
          onMouseEnter={() => setHoveredItem('logout')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
          {!isCollapsed && <span>Sair</span>}
          {isCollapsed && <Tooltip $isVisible={hoveredItem === 'logout'}>Sair do Sistema</Tooltip>}
        </LogoutButton>

        {isAdmin && (
          <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileSelected} style={{ display: 'none' }} />
        )}
      </SidebarFooter>
    </SidebarContainer>
  );
};

export { CollapsibleSidebar };













