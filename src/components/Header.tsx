import React, { useState } from 'react';
import { 
  Plus, 
  Layers, 
  ChevronDown, 
  Download, 
  Upload, 
  Moon, 
  Sun, 
  FolderPlus,
  Trash2,
  Copy,
  Kanban,
  Network,
  GitBranch
} from 'lucide-react';
import { CanvasBoard } from '../types/orchestrator';

interface HeaderProps {
  boards: CanvasBoard[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onNewBoard: () => void;
  onDuplicateBoard: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onExportBoards: () => void;
  onImportBoards: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddQuickNode: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  boards,
  activeBoardId,
  onSelectBoard,
  onNewBoard,
  onDuplicateBoard,
  onDeleteBoard,
  onExportBoards,
  onImportBoards,
  onAddQuickNode,
  darkMode,
  onToggleTheme,
}) => {
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];

  const getBoardIcon = (iconName: string) => {
    switch (iconName) {
      case 'Kanban':
        return <Kanban className="w-3.5 h-3.5" />;
      case 'Layers':
        return <Layers className="w-3.5 h-3.5" />;
      case 'GitBranch':
        return <GitBranch className="w-3.5 h-3.5" />;
      default:
        return <Network className="w-3.5 h-3.5" />;
    }
  };

  return (
    <header 
      className="h-13 bg-[#F8EBE8] dark:bg-[#1A331C] border-b border-[#709654]/25 dark:border-[#3B5D37]/60 px-4 flex items-center justify-between gap-8 shrink-0 relative z-50 overflow-visible select-none"
    >
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#871201] text-[#F8EBE8] flex items-center justify-center font-bold text-sm shadow-xs">
          MO
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-[#1F3E22] dark:text-[#F8EBE8] whitespace-nowrap">
            Master Orchestrator
          </span>
        </div>
      </div>

      {/* Zone 2: Canvas List / Boards Switcher (Area D) */}
      <div className="flex-1 min-w-0 w-full flex items-center gap-2 py-1 overflow-visible relative">
        {/* Quick Board Selector Tabs */}
        <div className="flex-1 min-w-0 w-full flex items-center p-1 bg-[#EEDFD8] dark:bg-[#152816] rounded-xl border border-[#709654]/30 dark:border-[#3B5D37]/50 gap-1 overflow-x-auto">
          {boards.map((b, idx) => {
            const isActive = b.id === activeBoardId;
            // Alternating signature color for each board
            const boardColors = ['#C61B31', '#709654', '#3B5D37', '#DF9C56', '#DB3A31', '#871201'];
            const boardColor = boardColors[idx % boardColors.length];

            return (
              <button
                key={b.id}
                onClick={() => onSelectBoard(b.id)}
                style={{
                  borderColor: isActive ? boardColor : 'transparent',
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'bg-white dark:bg-[#1F3E22] text-[#1F3E22] dark:text-[#F8EBE8] shadow-sm'
                    : 'text-[#1F3E22]/70 dark:text-[#AFD1C2]/80 hover:text-[#1F3E22] dark:hover:text-[#F8EBE8] hover:bg-white/50 dark:hover:bg-[#1F3E22]/50'
                }`}
                title={b.description}
              >
                <span
                  style={{
                    backgroundColor: isActive ? boardColor : `${boardColor}25`,
                    color: isActive ? '#F8EBE8' : boardColor,
                  }}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 font-bold transition-colors"
                >
                  {getBoardIcon(b.icon)}
                </span>
                <span>{b.name}</span>
                <span 
                  style={{ color: isActive ? boardColor : undefined }}
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10"
                >
                  {b.nodes.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Board Dropdown / Management Menu - placed outside the horizontal scroll container */}
        <div className="relative shrink-0 overflow-visible">
          <button
            onClick={() => setBoardMenuOpen(!boardMenuOpen)}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-colors border border-[#709654]/30 bg-white/60 dark:bg-[#152816]"
            title="Board Management & Templates"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {boardMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => setBoardMenuOpen(false)}
              />
              <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[101] py-1.5 text-xs text-[#1F3E22] dark:text-[#F8EBE8]">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Workspace Boards ({boards.length})
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {boards.map((b) => (
                    <div
                      key={b.id}
                      className={`flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer ${
                        b.id === activeBoardId ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'
                      }`}
                      onClick={() => {
                        onSelectBoard(b.id);
                        setBoardMenuOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {getBoardIcon(b.icon)}
                        <div className="truncate">
                          <div className="font-medium truncate">{b.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{b.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDuplicateBoard(b.id)}
                          className="p-1 hover:text-indigo-600 rounded text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                          title="Duplicate board"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {boards.length > 1 && (
                          <button
                            onClick={() => onDeleteBoard(b.id)}
                            className="p-1 hover:text-rose-600 rounded text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                            title="Delete board"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1 px-1">
                  <button
                    onClick={() => {
                      setBoardMenuOpen(false);
                      onNewBoard();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-medium"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Create New Visual Board</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Zone 3: Primary Action & Utilities */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Import / Export JSON */}
        <label
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          title="Import Workspace JSON"
        >
          <Upload className="w-4 h-4" />
          <input
            type="file"
            accept=".json"
            onChange={onImportBoards}
            className="hidden"
          />
        </label>
        <button
          onClick={onExportBoards}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Export Workspace JSON"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Primary Action Button: Add Canvas Node */}
        <button
          onClick={onAddQuickNode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#F8EBE8] bg-[#3B5D37] hover:bg-[#1F3E22] active:scale-98 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Node</span>
        </button>
      </div>
    </header>
  );
};
