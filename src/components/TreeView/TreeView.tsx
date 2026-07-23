import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  faChevronDown, 
  faChevronRight, 
  faFolder, 
  faFolderOpen,
  faFile,
  faMinus
} from '@fortawesome/free-solid-svg-icons';

export interface TreeNode {
  id: string;
  label: string;
  icon?: any;
  children?: TreeNode[];
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  data?: any;
}

interface TreeViewProps {
  data: TreeNode[];
  onSelectionChange?: (checkedNodes: string[]) => void;
  multiSelect?: boolean;
  showCheckboxes?: boolean;
  defaultExpandedNodes?: string[];
  className?: string;
}

const TreeContainer = styled.div`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  user-select: none;
`;

const TreeNodeContainer = styled.div<{ level: number }>`
  margin-left: ${props => props.level * 24}px;
`;

const NodeContent = styled.div<{ 
  isSelected: boolean; 
  isDisabled: boolean;
  isHovered: boolean;
}>`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: ${props => props.isDisabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.isDisabled ? 0.5 : 1};
  background: ${props => {
    if (props.isDisabled) return 'transparent';
    if (props.isSelected) return '#e0e7ff';
    if (props.isHovered) return '#f8fafc';
    return 'transparent';
  }};
  border: 1px solid ${props => {
    if (props.isSelected) return '#3b82f6';
    return 'transparent';
  }};
  transition: all 0.2s ease;
  margin-bottom: 2px;

  &:hover {
    background: ${props => props.isDisabled ? 'transparent' : '#f1f5f9'};
    border-color: ${props => props.isDisabled ? 'transparent' : '#cbd5e1'};
  }
`;

const ExpandIcon = styled.div<{ isExpanded: boolean }>`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  color: #6b7280;
  transition: transform 0.2s ease;
  transform: ${props => props.isExpanded ? 'rotate(0deg)' : 'rotate(0deg)'};
`;

const CheckboxContainer = styled.div`
  margin-right: 8px;
  position: relative;
`;

const StyledCheckbox = styled.input<{ indeterminate?: boolean }>`
  width: 16px;
  height: 16px;
  cursor: pointer;
  
  &:indeterminate {
    background: #3b82f6;
    border-color: #3b82f6;
  }
`;

const NodeIcon = styled.div`
  margin-right: 8px;
  color: #6b7280;
  font-size: 14px;
`;

const NodeLabel = styled.span<{ isDisabled: boolean }>`
  color: ${props => props.isDisabled ? '#9ca3af' : '#374151'};
  font-size: 14px;
  font-weight: 500;
  flex: 1;
`;

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  expandedNodes: Set<string>;
  selectedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onToggleSelect: (nodeId: string, checked: boolean) => void;
  showCheckboxes: boolean;
  multiSelect: boolean;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  level,
  expandedNodes,
  selectedNodes,
  onToggleExpand,
  onToggleSelect,
  showCheckboxes,
  multiSelect
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNodes.has(node.id);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  };

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node.disabled) {
      onToggleSelect(node.id, !node.checked);
    }
  };

  const handleNodeClick = () => {
    if (!node.disabled && showCheckboxes) {
      onToggleSelect(node.id, !node.checked);
    }
  };

  const getNodeIcon = () => {
    if (node.icon) {
      return <FontAwesomeIcon icon={node.icon} />;
    }
    
    if (hasChildren) {
      return <FontAwesomeIcon icon={isExpanded ? faFolderOpen : faFolder} />;
    }
    
    return <FontAwesomeIcon icon={faFile} />;
  };

  return (
    <>
      <TreeNodeContainer level={level}>
        <NodeContent
          isSelected={isSelected}
          isDisabled={!!node.disabled}
          isHovered={isHovered}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleNodeClick}
        >
          <ExpandIcon 
            isExpanded={isExpanded}
            onClick={handleExpandClick}
          >
            {hasChildren && (
              <FontAwesomeIcon 
                icon={isExpanded ? faChevronDown : faChevronRight}
                size="sm"
              />
            )}
          </ExpandIcon>

          {showCheckboxes && (
            <CheckboxContainer onClick={handleCheckboxChange}>
              <StyledCheckbox
                type="checkbox"
                checked={node.checked || false}
                indeterminate={node.indeterminate}
                disabled={node.disabled}
                onChange={() => {}} // Controlled by onClick
              />
              {node.indeterminate && (
                <FontAwesomeIcon 
                  icon={faMinus} 
                  style={{
                    position: 'absolute',
                    top: '1px',
                    left: '1px',
                    fontSize: '12px',
                    color: 'white',
                    pointerEvents: 'none'
                  }}
                />
              )}
            </CheckboxContainer>
          )}

          <NodeIcon>
            {getNodeIcon()}
          </NodeIcon>

          <NodeLabel isDisabled={!!node.disabled}>
            {node.label}
          </NodeLabel>
        </NodeContent>
      </TreeNodeContainer>

      {hasChildren && isExpanded && (
        <>
          {node.children!.map(child => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              selectedNodes={selectedNodes}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
              showCheckboxes={showCheckboxes}
              multiSelect={multiSelect}
            />
          ))}
        </>
      )}
    </>
  );
};

export const TreeView: React.FC<TreeViewProps> = ({
  data,
  onSelectionChange,
  multiSelect = true,
  showCheckboxes = true,
  defaultExpandedNodes = [],
  className
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(defaultExpandedNodes)
  );
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [treeData, setTreeData] = useState<TreeNode[]>(data);

  useEffect(() => {
    setTreeData(data);
  }, [data]);

  const updateNodeCheckedState = (nodes: TreeNode[], nodeId: string, checked: boolean): TreeNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        const updatedNode = { ...node, checked };
        
        // Atualizar filhos se existirem
        if (updatedNode.children) {
          updatedNode.children = updateAllChildren(updatedNode.children, checked);
        }
        
        return updatedNode;
      } else if (node.children) {
        const updatedChildren = updateNodeCheckedState(node.children, nodeId, checked);
        const updatedNode = { ...node, children: updatedChildren };
        
        // Atualizar estado do pai baseado nos filhos
        const checkedChildren = updatedChildren.filter(child => child.checked);
        const hasIndeterminate = updatedChildren.some(child => child.indeterminate);
        
        if (checkedChildren.length === updatedChildren.length) {
          updatedNode.checked = true;
          updatedNode.indeterminate = false;
        } else if (checkedChildren.length > 0 || hasIndeterminate) {
          updatedNode.checked = false;
          updatedNode.indeterminate = true;
        } else {
          updatedNode.checked = false;
          updatedNode.indeterminate = false;
        }
        
        return updatedNode;
      }
      
      return node;
    });
  };

  const updateAllChildren = (children: TreeNode[], checked: boolean): TreeNode[] => {
    return children.map(child => ({
      ...child,
      checked,
      indeterminate: false,
      children: child.children ? updateAllChildren(child.children, checked) : child.children
    }));
  };

  const getCheckedNodes = (nodes: TreeNode[]): string[] => {
    const checked: string[] = [];
    
    const traverse = (nodeList: TreeNode[]) => {
      nodeList.forEach(node => {
        if (node.checked) {
          checked.push(node.id);
        }
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    
    traverse(nodes);
    return checked;
  };

  const handleToggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleToggleSelect = (nodeId: string, checked: boolean) => {
    const updatedData = updateNodeCheckedState(treeData, nodeId, checked);
    setTreeData(updatedData);
    
    const checkedNodeIds = getCheckedNodes(updatedData);
    setSelectedNodes(new Set(checkedNodeIds));
    
    if (onSelectionChange) {
      onSelectionChange(checkedNodeIds);
    }
  };

  return (
    <TreeContainer className={className}>
      {treeData.map(node => (
        <TreeNodeItem
          key={node.id}
          node={node}
          level={0}
          expandedNodes={expandedNodes}
          selectedNodes={selectedNodes}
          onToggleExpand={handleToggleExpand}
          onToggleSelect={handleToggleSelect}
          showCheckboxes={showCheckboxes}
          multiSelect={multiSelect}
        />
      ))}
    </TreeContainer>
  );
};

export default TreeView;













