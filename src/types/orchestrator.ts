export type ItemType = 'tool' | 'app' | 'project' | 'resource';
export type NodeType = 'tool' | 'app' | 'project' | 'resource' | 'note' | 'kanban';
export type NodeStatus = 'idle' | 'running' | 'success' | 'warning' | 'error';
export type ConnectorType = 'dependency' | 'data_flow' | 'trigger' | 'reference';

export interface OrganizerItem {
  id: string;
  name: string;
  type: ItemType;
  category: string;
  description: string;
  status: NodeStatus;
  icon: string;
  version?: string;
  command?: string;
  endpoint?: string;
  environment?: 'production' | 'staging' | 'development' | 'local';
  tags: string[];
}

export interface KanbanCard {
  id: string;
  title: string;
  tag: string;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface CanvasNode {
  id: string;
  title: string;
  type: NodeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  status: NodeStatus;
  description?: string;
  sourceOrganizerId?: string;
  // Specialized properties
  noteColor?: 'yellow' | 'blue' | 'green' | 'purple' | 'slate' | 'rose' | 'amber' | 'white' | string;
  noteContent?: string;
  kanbanColumns?: KanbanColumn[];
  kanbanTheme?: 'toasted' | 'mint' | 'dusk' | 'teal' | 'basil' | 'purple' | 'slate' | string;
  command?: string;
  endpoint?: string;
  environment?: string;
  tags?: string[];
  metrics?: {
    label: string;
    value: string;
  }[];
  lastExecutedAt?: string;
  customColor?: string;
  fontSize?: number;
}

export interface Connector {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: 'top' | 'right' | 'bottom' | 'left';
  targetHandle?: 'top' | 'right' | 'bottom' | 'left';
  type: ConnectorType;
  label?: string;
  animated?: boolean;
}

export interface CanvasGroup {
  id: string;
  title: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  description?: string;
}

export interface CanvasBoard {
  id: string;
  name: string;
  description: string;
  icon: string;
  updatedAt: string;
  nodes: CanvasNode[];
  connectors: Connector[];
  groups?: CanvasGroup[];
  pan: { x: number; y: number };
  zoom: number;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeTitle: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}
