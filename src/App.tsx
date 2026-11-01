import React, { useState, useEffect, useCallback } from 'react';
import { 
  CanvasBoard, 
  CanvasNode, 
  Connector, 
  OrganizerItem, 
  ItemType, 
  ExecutionLog, 
  NodeStatus 
} from './types/orchestrator';
import { INITIAL_ORGANIZER_ITEMS, INITIAL_BOARDS } from './data/initialData';
import { Header } from './components/Header';
import { OrganizerSidebar } from './components/OrganizerSidebar';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { OverheadActionBar } from './components/OverheadActionBar';
import { NodeInspectorModal } from './components/NodeInspectorModal';
import { ExecutionConsoleDrawer } from './components/ExecutionConsoleDrawer';
import { NewItemModal } from './components/NewItemModal';
import { BoardModal } from './components/BoardModal';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Boards state (Area D)
  const [boards, setBoards] = useState<CanvasBoard[]>(() => {
    try {
      const resetDone = localStorage.getItem('mo_workspace_cleared_defaults_v4');
      if (!resetDone) {
        localStorage.setItem('mo_workspace_cleared_defaults_v4', 'true');
        localStorage.setItem('mo_workspace_boards', JSON.stringify(INITIAL_BOARDS));
        return INITIAL_BOARDS;
      }
      const saved = localStorage.getItem('mo_workspace_boards');
      if (saved) {
        const parsed: CanvasBoard[] = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved boards', e);
    }
    return INITIAL_BOARDS;
  });

  const [activeBoardId, setActiveBoardId] = useState<string>(() => {
    return boards[0]?.id || INITIAL_BOARDS[0].id;
  });

  // Organizer Items state (Area A)
  const [organizerItems, setOrganizerItems] = useState<OrganizerItem[]>(() => {
    try {
      const saved = localStorage.getItem('mo_organizer_items');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load saved items', e);
    }
    return INITIAL_ORGANIZER_ITEMS;
  });

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [connectingFromNodeId, setConnectingFromNodeId] = useState<string | null>(null);

  // Inspector modal state (Area C "Open" action)
  const [inspectingNode, setInspectingNode] = useState<CanvasNode | null>(null);

  // Modals state
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [newItemDefaultType, setNewItemDefaultType] = useState<ItemType>('tool');
  const [newBoardModalOpen, setNewBoardModalOpen] = useState(false);

  // Execution Console Drawer & Logs state
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);

  // Sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Active Board helper
  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('mo_workspace_boards', JSON.stringify(boards));
    } catch (e) {
      console.error('Failed to persist boards', e);
    }
  }, [boards]);

  useEffect(() => {
    try {
      localStorage.setItem('mo_organizer_items', JSON.stringify(organizerItems));
    } catch (e) {
      console.error('Failed to persist organizer items', e);
    }
  }, [organizerItems]);

  // Update active board utility
  const updateActiveBoard = useCallback(
    (updater: (current: CanvasBoard) => CanvasBoard) => {
      setBoards((prev) =>
        prev.map((b) => (b.id === activeBoardId ? updater(b) : b))
      );
    },
    [activeBoardId]
  );

  // Undo / Redo history state for canvas
  const [history, setHistory] = useState<{
    past: { nodes: CanvasNode[]; connectors: Connector[] }[];
    future: { nodes: CanvasNode[]; connectors: Connector[] }[];
  }>({ past: [], future: [] });

  // Reset history on board switch
  useEffect(() => {
    setHistory({ past: [], future: [] });
  }, [activeBoardId]);

  const pushSnapshot = useCallback(() => {
    if (!activeBoard) return;
    setHistory((prev) => ({
      past: [
        ...prev.past.slice(-30),
        {
          nodes: JSON.parse(JSON.stringify(activeBoard.nodes)),
          connectors: JSON.parse(JSON.stringify(activeBoard.connectors)),
        },
      ],
      future: [],
    }));
  }, [activeBoard]);

  const handleUndo = useCallback(() => {
    if (!activeBoard || history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    const currentSnapshot = {
      nodes: JSON.parse(JSON.stringify(activeBoard.nodes)),
      connectors: JSON.parse(JSON.stringify(activeBoard.connectors)),
    };

    setHistory({
      past: newPast,
      future: [currentSnapshot, ...history.future],
    });

    updateActiveBoard((b) => ({
      ...b,
      nodes: previous.nodes,
      connectors: previous.connectors,
    }));
  }, [activeBoard, history, updateActiveBoard]);

  const handleRedo = useCallback(() => {
    if (!activeBoard || history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    const currentSnapshot = {
      nodes: JSON.parse(JSON.stringify(activeBoard.nodes)),
      connectors: JSON.parse(JSON.stringify(activeBoard.connectors)),
    };

    setHistory({
      past: [...history.past, currentSnapshot],
      future: newFuture,
    });

    updateActiveBoard((b) => ({
      ...b,
      nodes: next.nodes,
      connectors: next.connectors,
    }));
  }, [activeBoard, history, updateActiveBoard]);

  // Clear Canvas for Active Board
  const handleClearCanvas = useCallback(() => {
    if (!activeBoard) return;
    pushSnapshot();
    updateActiveBoard((b) => ({
      ...b,
      nodes: [],
      connectors: [],
    }));
    setSelectedNodeId(null);
    setSelectedConnectorId(null);
  }, [activeBoard, pushSnapshot, updateActiveBoard]);

  // Canvas Node Operations
  const handleAddNode = useCallback(
    (newNode: CanvasNode) => {
      pushSnapshot();
      updateActiveBoard((board) => ({
        ...board,
        nodes: [...board.nodes, newNode],
      }));
    },
    [pushSnapshot, updateActiveBoard]
  );

  const handleUpdateNode = useCallback(
    (updatedNode: CanvasNode) => {
      const oldNode = activeBoard?.nodes.find((n) => n.id === updatedNode.id);
      if (
        oldNode &&
        (oldNode.customColor !== updatedNode.customColor ||
          oldNode.fontSize !== updatedNode.fontSize ||
          oldNode.title !== updatedNode.title ||
          oldNode.noteContent !== updatedNode.noteContent ||
          oldNode.kanbanColumns !== updatedNode.kanbanColumns)
      ) {
        pushSnapshot();
      }

      updateActiveBoard((board) => ({
        ...board,
        nodes: board.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)),
      }));

      // Keep inspecting node in sync if currently open
      if (inspectingNode && inspectingNode.id === updatedNode.id) {
        setInspectingNode(updatedNode);
      }
    },
    [activeBoard, pushSnapshot, updateActiveBoard, inspectingNode]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      pushSnapshot();
      updateActiveBoard((board) => ({
        ...board,
        nodes: board.nodes.filter((n) => n.id !== nodeId),
        connectors: board.connectors.filter(
          (c) => c.sourceId !== nodeId && c.targetId !== nodeId
        ),
      }));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      if (inspectingNode?.id === nodeId) setInspectingNode(null);
    },
    [pushSnapshot, updateActiveBoard, selectedNodeId, inspectingNode]
  );

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const nodeToDup = activeBoard?.nodes.find((n) => n.id === nodeId);
      if (!nodeToDup) return;

      pushSnapshot();
      const duplicated: CanvasNode = {
        ...nodeToDup,
        id: `node-${Date.now()}`,
        title: `${nodeToDup.title} (Copy)`,
        x: nodeToDup.x + 30,
        y: nodeToDup.y + 30,
        status: 'idle',
      };

      handleAddNode(duplicated);
      setSelectedNodeId(duplicated.id);
    },
    [activeBoard, pushSnapshot, handleAddNode]
  );

  // Connector Operations
  const handleAddConnector = useCallback(
    (newConnector: Connector) => {
      pushSnapshot();
      updateActiveBoard((board) => ({
        ...board,
        connectors: [...board.connectors, newConnector],
      }));
      setSelectedConnectorId(newConnector.id);
    },
    [pushSnapshot, updateActiveBoard]
  );

  const handleUpdateConnector = useCallback(
    (updatedConnector: Connector) => {
      pushSnapshot();
      updateActiveBoard((board) => ({
        ...board,
        connectors: board.connectors.map((c) =>
          c.id === updatedConnector.id ? updatedConnector : c
        ),
      }));
    },
    [pushSnapshot, updateActiveBoard]
  );

  const handleDeleteConnector = useCallback(
    (connectorId: string) => {
      pushSnapshot();
      updateActiveBoard((board) => ({
        ...board,
        connectors: board.connectors.filter((c) => c.id !== connectorId),
      }));
      if (selectedConnectorId === connectorId) setSelectedConnectorId(null);
    },
    [pushSnapshot, updateActiveBoard, selectedConnectorId]
  );

  // Pan & Zoom
  const handlePanZoomChange = useCallback(
    (newPan: { x: number; y: number }, newZoom: number) => {
      updateActiveBoard((board) => ({
        ...board,
        pan: newPan,
        zoom: newZoom,
      }));
    },
    [updateActiveBoard]
  );

  // Area A: Add Organizer Item to Canvas
  const handleAddOrganizerItemToCanvas = useCallback(
    (item: OrganizerItem) => {
      if (!activeBoard) return;
      // Smart positioning: staggered offset near viewport center or next free space
      const baseX = Math.round((-activeBoard.pan.x + 300) / 20) * 20;
      const baseY = Math.round((-activeBoard.pan.y + 200) / 20) * 20;
      const count = activeBoard.nodes.length;
      const posX = baseX + (count % 4) * 30;
      const posY = baseY + (count % 4) * 30;

      const newNode: CanvasNode = {
        id: `node-${Date.now()}`,
        title: item.name,
        type: item.type as any,
        x: posX,
        y: posY,
        width: item.type === 'tool' ? 280 : 270,
        status: item.status || 'idle',
        description: item.description,
        sourceOrganizerId: item.id,
        command: item.command,
        endpoint: item.endpoint,
        environment: item.environment,
        tags: item.tags,
      };

      handleAddNode(newNode);
      setSelectedNodeId(newNode.id);
    },
    [activeBoard, handleAddNode]
  );

  // Area C: Run / Execute Action with real simulation
  const handleRunNode = useCallback(
    (nodeId: string) => {
      const targetNode = activeBoard?.nodes.find((n) => n.id === nodeId);
      if (!targetNode) return;

      const now = new Date().toLocaleTimeString();
      const nodeTitle = targetNode.title;

      // 1. Set node to running
      handleUpdateNode({
        ...targetNode,
        status: 'running',
        lastExecutedAt: now,
      });

      // 2. Open console drawer & append start log
      setConsoleOpen(true);
      const startLog: ExecutionLog = {
        id: `log-${Date.now()}-1`,
        timestamp: now,
        nodeId,
        nodeTitle,
        level: 'info',
        message: targetNode.command 
          ? `Dispatched runner for command: "${targetNode.command}"`
          : targetNode.endpoint
          ? `Initiated health check & status probe against: ${targetNode.endpoint}`
          : `Initiated orchestration workflow sequence...`,
      };

      setExecutionLogs((prev) => [startLog, ...prev]);

      // Check downstream connected nodes
      const downstreamConnectors = activeBoard.connectors.filter((c) => c.sourceId === nodeId);
      if (downstreamConnectors.length > 0) {
        setTimeout(() => {
          const downstreamTitles = downstreamConnectors
            .map((c) => activeBoard.nodes.find((n) => n.id === c.targetId)?.title)
            .filter(Boolean)
            .join(', ');

          setExecutionLogs((prev) => [
            {
              id: `log-${Date.now()}-2`,
              timestamp: new Date().toLocaleTimeString(),
              nodeId,
              nodeTitle,
              level: 'info',
              message: `Pulsing payload downstream to [${downstreamTitles}] across ${downstreamConnectors.length} connection link(s).`,
            },
            ...prev,
          ]);
        }, 600);
      }

      // 3. Settle after 1.4 seconds with success
      setTimeout(() => {
        const finishTime = new Date().toLocaleTimeString();
        handleUpdateNode({
          ...targetNode,
          status: 'success',
          lastExecutedAt: finishTime,
        });

        setExecutionLogs((prev) => [
          {
            id: `log-${Date.now()}-3`,
            timestamp: finishTime,
            nodeId,
            nodeTitle,
            level: 'success',
            message: `Execution settled successfully with exit code 0. Status: NOMINAL (duration: 1.42s).`,
          },
          ...prev,
        ]);
      }, 1400);
    },
    [activeBoard, handleUpdateNode]
  );

  // Area C: Open Inspector Action
  const handleOpenInspector = useCallback((node: CanvasNode) => {
    setInspectingNode(node);
  }, []);

  // Area D: Canvas List / Boards Operations
  const handleNewBoard = () => {
    setNewBoardModalOpen(true);
  };

  const handleCreateBoardFromModal = (newBoard: CanvasBoard) => {
    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
  };

  const handleDuplicateBoard = (boardId: string) => {
    const boardToDup = boards.find((b) => b.id === boardId);
    if (!boardToDup) return;

    const dupBoard: CanvasBoard = {
      ...boardToDup,
      id: `board-${Date.now()}`,
      name: `${boardToDup.name} (Copy)`,
      updatedAt: 'Just now',
    };

    setBoards((prev) => [...prev, dupBoard]);
    setActiveBoardId(dupBoard.id);
  };

  const handleDeleteBoard = (boardId: string) => {
    if (boards.length <= 1) return;
    const remaining = boards.filter((b) => b.id !== boardId);
    setBoards(remaining);
    if (activeBoardId === boardId) {
      setActiveBoardId(remaining[0].id);
    }
  };

  // Export / Import Workspace (Area D)
  const handleExportWorkspace = () => {
    const data = {
      boards,
      organizerItems,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `master-orchestrator-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportWorkspace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.boards && Array.isArray(parsed.boards)) {
          setBoards(parsed.boards);
          if (parsed.boards[0]) setActiveBoardId(parsed.boards[0].id);
        }
        if (parsed.organizerItems && Array.isArray(parsed.organizerItems)) {
          setOrganizerItems(parsed.organizerItems);
        }
      } catch (err) {
        console.error('Invalid workspace JSON file', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Quick Node Add from Header
  const handleAddQuickNode = () => {
    if (!activeBoard) return;
    const posX = Math.round((-activeBoard.pan.x + 350) / 20) * 20;
    const posY = Math.round((-activeBoard.pan.y + 220) / 20) * 20;

    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      title: 'New Service Node',
      type: 'app',
      x: posX,
      y: posY,
      width: 270,
      status: 'idle',
      description: 'Custom canvas node created via quick adder',
      environment: 'development',
      tags: ['service'],
    };

    handleAddNode(newNode);
    setSelectedNodeId(newNode.id);
  };

  // Currently selected node object
  const selectedNode = activeBoard?.nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8EBE8] dark:bg-[#1F3E22] text-[#1F3E22] dark:text-[#F8EBE8] font-sans antialiased">
      {/* Top Header Bar (Includes Area D: Canvas List & Top Bar Contract) */}
      <Header
        boards={boards}
        activeBoardId={activeBoardId}
        onSelectBoard={(id) => {
          setActiveBoardId(id);
          setSelectedNodeId(null);
          setSelectedConnectorId(null);
        }}
        onNewBoard={handleNewBoard}
        onDuplicateBoard={handleDuplicateBoard}
        onDeleteBoard={handleDeleteBoard}
        onExportBoards={handleExportWorkspace}
        onImportBoards={handleImportWorkspace}
        onAddQuickNode={handleAddQuickNode}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Area A: Left Sidebar – Organizer */}
        <OrganizerSidebar
          items={organizerItems}
          onAddToCanvas={handleAddOrganizerItemToCanvas}
          onOpenNewItemModal={(type) => {
            if (type) setNewItemDefaultType(type);
            setNewItemModalOpen(true);
          }}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onClearAllItems={() => setOrganizerItems([])}
          onClearCategoryItems={(type) =>
            setOrganizerItems((prev) => prev.filter((item) => item.type !== type))
          }
          onDeleteItem={(itemId) =>
            setOrganizerItems((prev) => prev.filter((item) => item.id !== itemId))
          }
          selectedItemId={
            selectedNode?.sourceOrganizerId ||
            organizerItems.find((i) => i.name.toLowerCase() === selectedNode?.title.toLowerCase())?.id ||
            null
          }
          activeCanvasItemIds={
            activeBoard?.nodes
              .map((n) => n.sourceOrganizerId || organizerItems.find((i) => i.name.toLowerCase() === n.title.toLowerCase())?.id)
              .filter(Boolean) as string[]
          }
          onSelectItem={(item) => {
            const existingNode = activeBoard?.nodes.find(
              (n) => n.sourceOrganizerId === item.id || n.title.toLowerCase() === item.name.toLowerCase()
            );
            if (existingNode) {
              setSelectedNodeId(existingNode.id);
              setSelectedConnectorId(null);
              if (activeBoard) {
                const targetPanX = Math.round(-existingNode.x * activeBoard.zoom + 400);
                const targetPanY = Math.round(-existingNode.y * activeBoard.zoom + 250);
                handlePanZoomChange({ x: targetPanX, y: targetPanY }, activeBoard.zoom);
              }
            } else {
              handleAddOrganizerItemToCanvas(item);
            }
          }}
          onUpdateItemName={(itemId, newName) => {
            setOrganizerItems((prev) =>
              prev.map((i) => (i.id === itemId ? { ...i, name: newName } : i))
            );
            updateActiveBoard((b) => ({
              ...b,
              nodes: b.nodes.map((n) =>
                n.sourceOrganizerId === itemId ? { ...n, title: newName } : n
              ),
            }));
          }}
          onUpdateItemDescription={(itemId, newDesc) => {
            setOrganizerItems((prev) =>
              prev.map((i) => (i.id === itemId ? { ...i, description: newDesc } : i))
            );
            updateActiveBoard((b) => ({
              ...b,
              nodes: b.nodes.map((n) =>
                n.sourceOrganizerId === itemId ? { ...n, description: newDesc } : n
              ),
            }));
          }}
          onUpdateItemCategory={(itemId, newCat) => {
            setOrganizerItems((prev) =>
              prev.map((i) => (i.id === itemId ? { ...i, category: newCat } : i))
            );
          }}
        />

        {/* Area B: Right Workspace – Canvas */}
        <main className="flex-1 h-full relative overflow-hidden flex flex-col">
          {/* Area C: Overhead Panel – Action Bar (Appears when a canvas node is selected) */}
          <OverheadActionBar
            selectedNode={selectedNode}
            onRunNode={handleRunNode}
            onOpenNodeInspector={handleOpenInspector}
            onDuplicateNode={handleDuplicateNode}
            onDeleteNode={handleDeleteNode}
            onDeselect={() => {
              setSelectedNodeId(null);
              setConnectingFromNodeId(null);
            }}
            onUpdateNode={handleUpdateNode}
            onStartConnectFromNode={(nodeId) => {
              setConnectingFromNodeId(nodeId);
            }}
          />

          {/* Interactive Canvas */}
          {activeBoard ? (
            <CanvasWorkspace
              nodes={activeBoard.nodes}
              connectors={activeBoard.connectors}
              groups={activeBoard.groups || []}
              selectedNodeId={selectedNodeId}
              selectedConnectorId={selectedConnectorId}
              onSelectNode={(id) => setSelectedNodeId(id)}
              onSelectConnector={(id) => setSelectedConnectorId(id)}
              onUpdateNode={handleUpdateNode}
              onAddNode={handleAddNode}
              onDeleteNode={handleDeleteNode}
              onAddConnector={handleAddConnector}
              onUpdateConnector={handleUpdateConnector}
              onDeleteConnector={handleDeleteConnector}
              onRunNode={handleRunNode}
              onOpenInspector={handleOpenInspector}
              pan={activeBoard.pan}
              zoom={activeBoard.zoom}
              onPanZoomChange={handlePanZoomChange}
              onClearCanvas={handleClearCanvas}
              activeBoardName={activeBoard.name}
              canUndo={history.past.length > 0}
              canRedo={history.future.length > 0}
              onUndo={handleUndo}
              onRedo={handleRedo}
              connectingFromNodeId={connectingFromNodeId}
              onCancelConnecting={() => setConnectingFromNodeId(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              No active board. Create one to begin.
            </div>
          )}
        </main>
      </div>

      {/* Execution Console Output Drawer */}
      <ExecutionConsoleDrawer
        logs={executionLogs}
        isOpen={consoleOpen}
        onClose={() => setConsoleOpen(false)}
        onClearLogs={() => setExecutionLogs([])}
      />

      {/* Node Inspector Modal (opened by Overhead Action Bar 'Open' action) */}
      <NodeInspectorModal
        node={inspectingNode}
        connectors={activeBoard?.connectors || []}
        allNodes={activeBoard?.nodes || []}
        onClose={() => setInspectingNode(null)}
        onUpdateNode={handleUpdateNode}
        onRunNode={handleRunNode}
        onDeleteNode={handleDeleteNode}
        onSelectNode={(id) => {
          setSelectedNodeId(id);
          const found = activeBoard?.nodes.find((n) => n.id === id);
          if (found) setInspectingNode(found);
        }}
      />

      {/* Register New Organizer Item Modal */}
      <NewItemModal
        isOpen={newItemModalOpen}
        defaultType={newItemDefaultType}
        onClose={() => setNewItemModalOpen(false)}
        onAddItem={(newItem) => {
          setOrganizerItems((prev) => [newItem, ...prev]);
        }}
      />

      {/* Create New Visual Board Modal */}
      <BoardModal
        isOpen={newBoardModalOpen}
        onClose={() => setNewBoardModalOpen(false)}
        onCreateBoard={handleCreateBoardFromModal}
      />
    </div>
  );
}
