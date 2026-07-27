
import React, { useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import type { MenuItem } from 'menu';
import './SidebarItem.css';

// Não acessar propriedades nomeadas de FaIcons diretamente (podem não existir
// na tipagem). Usaremos o `IconRenderer` para lookup dinâmico quando
// precisarmos renderizar ícones como chevrons.

function IconRenderer({ iconName }: { iconName?: string }) {
  if (!iconName) return null;
  // Suporte a múltiplos prefixos de ícones (ex: Fa, Md)
  const IconComponent = (FaIcons as any)[iconName] || (MdIcons as any)[iconName];
  if (IconComponent) {
    return <IconComponent className="menu-icon" />;
  }
  return null;
}


interface SidebarItemProps {
  item: MenuItem;
  isActive: boolean;
  onNavigate: (path: string) => void;
  onItemClick?: () => void; // Callback para fechar menu pai quando item é clicado
}


const SidebarItem: React.FC<SidebarItemProps> = ({ item, isActive, onNavigate, onItemClick }) => {
  const hasChildren = item.filhos && item.filhos.length > 0;
  // Expande automaticamente se for nível 1 (root)
  const [isExpanded, setIsExpanded] = useState(item.nivel === 1 && hasChildren);


  const handleClick = () => {
    // Prioriza 'route' (backend), depois 'path'
    const to = item.route || item.path;
    
    // Se tem filhos, apenas expande/colapse
    if (hasChildren) {
      setIsExpanded(exp => !exp);
    } else if (to) {
      // Se é uma ação (tem rota), navega e notifica para fechar o menu
      onNavigate(to);
      onItemClick?.(); // Chama callback para fechar menu pai
    }
  };

  return (
    <li className={`menu-item-wrapper${isActive ? ' active' : ''}`}>
      <div className="menu-item-content" onClick={handleClick} tabIndex={0} role="button">
        <IconRenderer iconName={item.icon} />
        <span className="menu-item-description">{item.name || item.descricao}</span>
        {hasChildren && (
          <span className="expand-icon">
            <IconRenderer iconName={isExpanded ? 'FaChevronUp' : 'FaChevronDown'} />
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <ul className="submenu">
          {item.filhos!.map(child => (
            <SidebarItem key={child.id} item={child} isActive={false} onNavigate={onNavigate} onItemClick={onItemClick} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default SidebarItem;













