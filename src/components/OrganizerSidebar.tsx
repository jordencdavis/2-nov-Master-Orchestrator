import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wrench, 
  AppWindow, 
  FolderGit2, 
  Database, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Search, 
  X,
  GripVertical,
  CheckCircle2,
  Package,
  Code2,
  Network,
  ShieldCheck,
  Layout,
  Send,
  Smartphone,
  Lock,
  Zap,
  HardDrive,
  Layers,
  SlidersHorizontal,
  ChevronLeft,
  Trash2,
  Maximize2,
  Minimize2,
  Columns3,
  LayoutList
} from 'lucide-react';
import { OrganizerItem, ItemType } from '../types/orchestrator';

interface OrganizerSidebarProps {
  items: OrganizerItem[];
  onAddToCanvas: (item: OrganizerItem) => void;
  onOpenNewItemModal: (defaultType?: ItemType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClearAllItems?: () => void;
  onClearCategoryItems?: (type: ItemType) => void;
  onDeleteItem?: (itemId: string) => void;
  onSelectItem?: (item: OrganizerItem) => void;
  onUpdateItemName?: (itemId: string, newName: string) => void;
  onUpdateItemDescription?: (itemId: string, newDesc: string) => void;
  onUpdateItemCategory?: (itemId: string, newCategory: string) => void;
  selectedItemId?: string | null;
  activeCanvasItemIds?: string[];
}

export const OrganizerSidebar: React.FC<OrganizerSidebarProps> = ({
  items,
  onAddToCanvas,
  onOpenNewItemModal,
  isCollapsed,
  onToggleCollapse,
  onClearAllItems,
  onClearCategoryItems,
  onDeleteItem,
  onSelectItem,
  onUpdateItemName,
  onUpdateItemDescription,
  onUpdateItemCategory,
  selectedItemId,
  activeCanvasItemIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState<'standard' | 'cards-stack'>('standard');

  // Dismiss full screen on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Editable Category Headings (Selector 5)
  const [categoryTitles, setCategoryTitles] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('mo_category_titles');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      tools: 'Tools & Utilities',
      apps: 'Applications & Services',
      projects: 'Projects & Initiatives',
      resources: 'Resources & Storage',
    };
  });
  const [editingCategoryKey, setEditingCategoryKey] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState('');

  const handleSaveCategoryTitle = (key: string) => {
    const trimmed = categoryDraft.trim();
    if (trimmed) {
      setCategoryTitles((prev) => {
        const next = { ...prev, [key]: trimmed };
        try {
          localStorage.setItem('mo_category_titles', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
    }
    setEditingCategoryKey(null);
  };

  // Double click name editing for items
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemDraftName, setItemDraftName] = useState('');

  // Double click sub-text (description) editing for items
  const [editingItemDescId, setEditingItemDescId] = useState<string | null>(null);
  const [itemDraftDesc, setItemDraftDesc] = useState('');

  // Double click category editing for items
  const [editingItemCatId, setEditingItemCatId] = useState<string | null>(null);
  const [itemDraftCat, setItemDraftCat] = useState('');

  const handleStartEditItem = (item: OrganizerItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItemId(item.id);
    setItemDraftName(item.name);
  };

  const handleSaveItemName = (itemId: string) => {
    const trimmed = itemDraftName.trim();
    if (trimmed && onUpdateItemName) {
      onUpdateItemName(itemId, trimmed);
    }
    setEditingItemId(null);
  };

  const handleSaveItemDesc = (itemId: string) => {
    const trimmed = itemDraftDesc.trim();
    if (onUpdateItemDescription) {
      onUpdateItemDescription(itemId, trimmed);
    }
    setEditingItemDescId(null);
  };

  const handleSaveItemCategory = (itemId: string) => {
    const trimmed = itemDraftCat.trim();
    if (trimmed && onUpdateItemCategory) {
      onUpdateItemCategory(itemId, trimmed);
    }
    setEditingItemCatId(null);
  };

  const handleSelectFilter = (type: string) => {
    setSelectedTypeFilter(type);
    if (type !== 'all') {
      const keyMap: Record<string, string> = {
        tool: 'tools',
        app: 'apps',
        project: 'projects',
        resource: 'resources',
      };
      if (keyMap[type]) {
        setCollapsedGroups((prev) => ({ ...prev, [keyMap[type]]: false }));
      }
    }
  };

  const handleCategoryHeaderClick = (sectionKey: string, sectionType: ItemType) => {
    toggleGroup(sectionKey);
    // Sync filter corresponding to the clicked category
    if (selectedTypeFilter === sectionType) {
      setSelectedTypeFilter('all');
    } else {
      setSelectedTypeFilter(sectionType);
      setCollapsedGroups((prev) => ({ ...prev, [sectionKey]: false }));
    }
  };
  
  // Clear Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    targetType: 'all' | ItemType | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    targetType: null,
  });

  const handleOpenClearAllModal = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Organizer Items?',
      message: 'Are you sure you want to clear all items across all categories in the organizer tree? This action cannot be undone.',
      targetType: 'all',
    });
  };

  const handleOpenClearCategoryModal = (type: ItemType, categoryTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: `Clear ${categoryTitle}?`,
      message: `Are you sure you want to remove all items under ${categoryTitle}?`,
      targetType: type,
    });
  };

  const handleConfirmClear = () => {
    if (confirmModal.targetType === 'all') {
      onClearAllItems?.();
    } else if (confirmModal.targetType) {
      onClearCategoryItems?.(confirmModal.targetType);
    }
    setConfirmModal({ isOpen: false, title: '', message: '', targetType: null });
  };
  
  // Track collapsed status of each category group
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    tools: false,
    apps: false,
    projects: false,
    resources: false,
  });

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    setCollapsedGroups({
      tools: false,
      apps: false,
      projects: false,
      resources: false,
    });
  };

  const collapseAll = () => {
    setCollapsedGroups({
      tools: true,
      apps: true,
      projects: true,
      resources: true,
    });
  };

  const getItemIcon = (iconName: string, type: ItemType) => {
    const className = "w-4 h-4 shrink-0";
    switch (iconName) {
      case 'CheckCircle2': return <CheckCircle2 className={`${className} text-[#3B5D37] dark:text-[#AFD1C2]`} />;
      case 'Package': return <Package className={`${className} text-[#DF9C56]`} />;
      case 'Code2': return <Code2 className={`${className} text-[#709654]`} />;
      case 'Network': return <Network className={`${className} text-[#C61B31]`} />;
      case 'ShieldCheck': return <ShieldCheck className={`${className} text-[#709654]`} />;
      case 'Layout': return <Layout className={`${className} text-[#C61B31]`} />;
      case 'Send': return <Send className={`${className} text-[#DF9C56]`} />;
      case 'FolderGit2': return <FolderGit2 className={`${className} text-[#DB3A31]`} />;
      case 'Smartphone': return <Smartphone className={`${className} text-[#DB3A31]`} />;
      case 'Lock': return <Lock className={`${className} text-[#871201]`} />;
      case 'Database': return <Database className={`${className} text-[#3B5D37] dark:text-[#AFD1C2]`} />;
      case 'Zap': return <Zap className={`${className} text-[#DF9C56]`} />;
      case 'HardDrive': return <HardDrive className={`${className} text-[#709654]`} />;
      case 'Layers': return <Layers className={`${className} text-[#3B5D37] dark:text-[#AFD1C2]`} />;
      default:
        if (type === 'tool') return <Wrench className={`${className} text-[#DF9C56]`} />;
        if (type === 'app') return <AppWindow className={`${className} text-[#C61B31]`} />;
        if (type === 'project') return <FolderGit2 className={`${className} text-[#DB3A31]`} />;
        return <Database className={`${className} text-[#3B5D37] dark:text-[#AFD1C2]`} />;
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedTypeFilter === 'all' || item.type === selectedTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [items, searchQuery, selectedTypeFilter]);

  // Group by primary category
  const grouped = useMemo(() => {
    return {
      tools: filteredItems.filter((i) => i.type === 'tool'),
      apps: filteredItems.filter((i) => i.type === 'app'),
      projects: filteredItems.filter((i) => i.type === 'project'),
      resources: filteredItems.filter((i) => i.type === 'resource'),
    };
  }, [filteredItems]);

  const getTypeTheme = (type: ItemType) => {
    switch (type) {
      case 'tool':
        return {
          treeBorder: 'border-l-2 border-[#DF9C56]',
          card: 'bg-[#DF9C56]/10 dark:bg-[#DF9C56]/15 border-[#DF9C56]/40 hover:border-[#DF9C56]',
          iconWrapper: 'p-1.5 rounded-lg bg-[#DF9C56]/20 border border-[#DF9C56]/40 text-[#871201] dark:text-[#DF9C56] shrink-0',
          addBtn: 'text-[#871201] dark:text-[#DF9C56] bg-[#DF9C56]/20 hover:bg-[#DF9C56]/35 border border-[#DF9C56]/40',
          badge: 'text-[#871201] dark:text-[#DF9C56]',
        };
      case 'app':
        return {
          treeBorder: 'border-l-2 border-[#C61B31]',
          card: 'bg-[#C61B31]/10 dark:bg-[#C61B31]/15 border-[#C61B31]/40 hover:border-[#C61B31]',
          iconWrapper: 'p-1.5 rounded-lg bg-[#C61B31]/20 border border-[#C61B31]/40 text-[#C61B31] shrink-0',
          addBtn: 'text-[#C61B31] bg-[#C61B31]/20 hover:bg-[#C61B31]/35 border border-[#C61B31]/40',
          badge: 'text-[#C61B31]',
        };
      case 'project':
        return {
          treeBorder: 'border-l-2 border-[#DB3A31]',
          card: 'bg-[#DB3A31]/10 dark:bg-[#DB3A31]/15 border-[#DB3A31]/40 hover:border-[#DB3A31]',
          iconWrapper: 'p-1.5 rounded-lg bg-[#DB3A31]/20 border border-[#DB3A31]/40 text-[#DB3A31] shrink-0',
          addBtn: 'text-[#871201] dark:text-[#DB3A31] bg-[#DB3A31]/20 hover:bg-[#DB3A31]/35 border border-[#DB3A31]/40',
          badge: 'text-[#DB3A31]',
        };
      case 'resource':
        return {
          treeBorder: 'border-l-2 border-[#3B5D37]',
          card: 'bg-[#3B5D37]/10 dark:bg-[#3B5D37]/15 border-[#3B5D37]/40 hover:border-[#3B5D37]',
          iconWrapper: 'p-1.5 rounded-lg bg-[#3B5D37]/20 border border-[#3B5D37]/40 text-[#3B5D37] dark:text-[#AFD1C2] shrink-0',
          addBtn: 'text-[#3B5D37] dark:text-[#AFD1C2] bg-[#3B5D37]/20 hover:bg-[#3B5D37]/35 border border-[#3B5D37]/40',
          badge: 'text-[#3B5D37] dark:text-[#AFD1C2]',
        };
    }
  };

  const sections = [
    { 
      key: 'tools', 
      title: categoryTitles.tools || 'Tools & Utilities', 
      type: 'tool' as ItemType, 
      color: '#DF9C56',
      headerBg: 'bg-[#DF9C56]/25 dark:bg-[#DF9C56]/20 border-2 border-[#DF9C56]',
      headerText: 'text-[#871201] dark:text-[#DF9C56]',
      badgeBg: 'bg-[#DF9C56] text-[#871201]',
      iconBg: 'bg-[#DF9C56] text-[#871201]',
      icon: <Wrench className="w-3.5 h-3.5 text-[#871201]" />, 
      items: grouped.tools 
    },
    { 
      key: 'apps', 
      title: categoryTitles.apps || 'Applications & Services', 
      type: 'app' as ItemType, 
      color: '#C61B31',
      headerBg: 'bg-[#C61B31]/20 dark:bg-[#C61B31]/25 border-2 border-[#C61B31]',
      headerText: 'text-[#C61B31] dark:text-[#F8EBE8]',
      badgeBg: 'bg-[#C61B31] text-[#F8EBE8]',
      iconBg: 'bg-[#C61B31] text-[#F8EBE8]',
      icon: <AppWindow className="w-3.5 h-3.5 text-[#F8EBE8]" />, 
      items: grouped.apps 
    },
    { 
      key: 'projects', 
      title: categoryTitles.projects || 'Projects & Initiatives', 
      type: 'project' as ItemType, 
      color: '#DB3A31',
      headerBg: 'bg-[#DB3A31]/20 dark:bg-[#DB3A31]/25 border-2 border-[#DB3A31]',
      headerText: 'text-[#DB3A31] dark:text-[#F8EBE8]',
      badgeBg: 'bg-[#DB3A31] text-[#F8EBE8]',
      iconBg: 'bg-[#DB3A31] text-[#F8EBE8]',
      icon: <FolderGit2 className="w-3.5 h-3.5 text-[#F8EBE8]" />, 
      items: grouped.projects 
    },
    { 
      key: 'resources', 
      title: categoryTitles.resources || 'Resources & Storage', 
      type: 'resource' as ItemType, 
      color: '#3B5D37',
      headerBg: 'bg-[#3B5D37]/25 dark:bg-[#3B5D37]/35 border-2 border-[#3B5D37]',
      headerText: 'text-[#1F3E22] dark:text-[#AFD1C2]',
      badgeBg: 'bg-[#3B5D37] text-[#AFD1C2]',
      iconBg: 'bg-[#3B5D37] text-[#AFD1C2]',
      icon: <Database className="w-3.5 h-3.5 text-[#AFD1C2]" />, 
      items: grouped.resources 
    },
  ];

  if (isCollapsed) {
    return (
      <aside className="w-14 border-r border-[#709654]/30 dark:border-[#3B5D37]/60 bg-[#F8EBE8]/90 dark:bg-[#152717] flex flex-col items-center py-3 select-none shrink-0 transition-all">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-[#709654] hover:text-[#1F3E22] dark:hover:text-[#F8EBE8] hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors mb-4"
          title="Expand Organizer Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex flex-col gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#DF9C56] text-[#871201] flex items-center justify-center shadow-xs font-bold" title="Tools">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#C61B31] text-[#F8EBE8] flex items-center justify-center shadow-xs font-bold" title="Applications">
            <AppWindow className="w-4 h-4" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#DB3A31] text-[#F8EBE8] flex items-center justify-center shadow-xs font-bold" title="Projects">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#3B5D37] text-[#AFD1C2] flex items-center justify-center shadow-xs font-bold" title="Resources">
            <Database className="w-4 h-4" />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`border-r border-[#709654]/30 dark:border-[#3B5D37]/60 bg-[#F8EBE8] dark:bg-[#152717] flex flex-col select-none shrink-0 transition-all ${
      isFullScreen ? 'fixed inset-0 z-50 w-full h-full' : 'w-76 h-full relative'
    }`}>
      {/* Sidebar Header */}
      <div className="p-3 border-b border-[#709654]/25 dark:border-[#3B5D37]/60 flex items-center justify-between" style={{ backgroundColor: '#c2c2c2' }}>
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[#1F3E22] text-[#AFD1C2]">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1F3E22] dark:text-[#F8EBE8]">
            Organizer
          </h2>
          <span className="text-[10px] text-[#709654] font-mono font-bold">
            ({filteredItems.length})
          </span>
          {isFullScreen && (
            <div className="flex items-center gap-1 ml-2 bg-[#1F3E22]/15 dark:bg-black/30 p-0.5 rounded-lg border border-[#709654]/30">
              <button
                onClick={() => setFullScreenMode('standard')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                  fullScreenMode === 'standard'
                    ? 'bg-[#1F3E22] text-[#F8EBE8] shadow-xs'
                    : 'text-[#1F3E22] dark:text-[#AFD1C2] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title="Standard Full Screen (Hierarchy Tree)"
              >
                <LayoutList className="w-3 h-3" />
                <span>Standard Full Screen</span>
              </button>
              <button
                onClick={() => setFullScreenMode('cards-stack')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                  fullScreenMode === 'cards-stack'
                    ? 'bg-[#DF9C56] text-[#871201] shadow-xs'
                    : 'text-[#1F3E22] dark:text-[#AFD1C2] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title="Cards Stack Side-by-Side Full Screen"
              >
                <Columns3 className="w-3 h-3" />
                <span>Cards Stack Side-by-Side</span>
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Option 1: Standard Full Screen (keeps current full screen) */}
          <button
            onClick={() => {
              if (isFullScreen && fullScreenMode === 'standard') {
                setIsFullScreen(false);
              } else {
                setIsFullScreen(true);
                setFullScreenMode('standard');
              }
            }}
            className={`p-1 rounded transition-colors ${
              isFullScreen && fullScreenMode === 'standard'
                ? 'bg-[#1F3E22] text-[#AFD1C2] font-bold'
                : 'text-[#1F3E22] hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title={isFullScreen && fullScreenMode === 'standard' ? "Exit Standard Full Screen" : "Standard Full Screen"}
          >
            {isFullScreen && fullScreenMode === 'standard' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {/* Option 2: Cards Stack Side by Side Full Screen */}
          <button
            onClick={() => {
              if (isFullScreen && fullScreenMode === 'cards-stack') {
                setIsFullScreen(false);
              } else {
                setIsFullScreen(true);
                setFullScreenMode('cards-stack');
              }
            }}
            className={`p-1 rounded transition-colors ${
              isFullScreen && fullScreenMode === 'cards-stack'
                ? 'bg-[#DF9C56] text-[#871201] font-bold shadow-xs'
                : 'text-[#1F3E22] hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title={isFullScreen && fullScreenMode === 'cards-stack' ? "Exit Cards Stack Full Screen" : "Cards Stack Side-by-Side (Full Screen)"}
          >
            <Columns3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenClearAllModal}
            className="p-1 text-[#DB3A31] hover:text-[#871201] hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
            title="Clear All Organizer Items (with confirmation)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onOpenNewItemModal()}
            className="p-1 text-[#709654] hover:text-[#1F3E22] dark:hover:text-[#F8EBE8] hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
            title="Create Custom Item"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1 text-[#709654] hover:text-[#1F3E22] dark:hover:text-[#F8EBE8] hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-2.5 border-b border-[#709654]/25 dark:border-[#3B5D37]/60 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#709654]" />
          <input
            type="text"
            placeholder="Filter hierarchy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ backgroundColor: '#ffffff', borderColor: '#f32f2f', color: '#358b3c', paddingLeft: '43px' }}
            className="w-full pr-7 py-1.5 text-xs bg-white dark:bg-[#1A331C] border border-[#709654]/40 dark:border-[#3B5D37] rounded-lg text-[#1F3E22] dark:text-[#F8EBE8] placeholder-[#709654]/70 focus:outline-none focus:border-[#3B5D37] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 p-0.5 text-[#709654] hover:text-[#1F3E22]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Alternating Color Filter Buttons */}
        <div className="flex items-center justify-between gap-1 text-[11px]" style={{ color: '#da4aff', backgroundColor: '#ffffff' }}>
          <div className="flex items-center gap-1 overflow-x-auto py-0.5" style={{ backgroundColor: '#ffd5f1' }}>
            {[
              { type: 'all', label: 'All', color: '#1F3E22', activeText: '#F8EBE8' },
              { type: 'tool', label: 'Tools', color: '#DF9C56', activeText: '#871201' },
              { type: 'app', label: 'Apps', color: '#C61B31', activeText: '#F8EBE8' },
              { type: 'project', label: 'Projects', color: '#DB3A31', activeText: '#F8EBE8' },
              { type: 'resource', label: 'Resources', color: '#3B5D37', activeText: '#AFD1C2' },
            ].map((f) => {
              const isSelected = selectedTypeFilter === f.type;
              return (
                <button
                  key={f.type}
                  onClick={() => handleSelectFilter(f.type)}
                  style={{
                    backgroundColor: isSelected ? f.color : 'transparent',
                    color: isSelected ? f.activeText : undefined,
                    borderColor: isSelected ? f.color : `${f.color}50`,
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    isSelected
                      ? 'shadow-xs'
                      : 'text-[#1F3E22]/80 dark:text-[#AFD1C2]/80 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={collapsedGroups.tools && collapsedGroups.apps ? expandAll : collapseAll}
            className="text-[10px] font-bold text-[#709654] hover:text-[#1F3E22] dark:hover:text-[#AFD1C2] whitespace-nowrap pl-1"
          >
            {collapsedGroups.tools && collapsedGroups.apps ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>

      {/* Main Content: Either Side-by-Side Cards Stack or Tree Content */}
      {isFullScreen && fullScreenMode === 'cards-stack' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-slate-100/80 dark:bg-[#0c180e]">
          <div className="flex gap-4 h-full min-w-max pb-1">
            {sections.map((section) => {
              const theme = getTypeTheme(section.type);
              const isFilteredOut = selectedTypeFilter !== 'all' && selectedTypeFilter !== section.type;

              return (
                <div
                  key={section.key}
                  className={`w-84 flex flex-col h-full rounded-2xl bg-[#F8EBE8] dark:bg-[#152717] border-2 shadow-md transition-all ${
                    isFilteredOut ? 'opacity-35 grayscale-[30%]' : ''
                  }`}
                  style={{ borderColor: section.color }}
                >
                  {/* Column Header Card */}
                  <div className={`p-3 rounded-t-xl flex items-center justify-between border-b ${section.headerBg}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${section.iconBg}`}>
                        {section.icon}
                      </div>
                      <div className="min-w-0">
                        {editingCategoryKey === section.key ? (
                          <input
                            type="text"
                            value={categoryDraft}
                            onChange={(e) => setCategoryDraft(e.target.value)}
                            onBlur={() => handleSaveCategoryTitle(section.key)}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') handleSaveCategoryTitle(section.key);
                              if (e.key === 'Escape') setEditingCategoryKey(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-1 py-0.2 rounded border border-[#DF9C56] focus:outline-none w-36"
                          />
                        ) : (
                          <h3 
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingCategoryKey(section.key);
                              setCategoryDraft(section.title);
                            }}
                            className={`font-bold text-xs truncate cursor-text hover:underline decoration-dashed ${section.headerText}`}
                            title="Double click to edit column heading"
                          >
                            {section.title}
                          </h3>
                        )}
                        <span className="text-[10px] text-[#709654] font-medium">
                          {section.items.length} {section.items.length === 1 ? 'card' : 'cards'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onOpenNewItemModal(section.type)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${theme.addBtn}`}
                        title={`Add new ${section.type}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {section.items.length > 0 && (
                        <button
                          onClick={() => handleOpenClearCategoryModal(section.type, section.title)}
                          className="p-1.5 rounded-lg text-[#DB3A31] hover:bg-[#DB3A31]/15 transition-colors"
                          title={`Clear all ${section.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Column Stack Cards Container */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {section.items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[#709654]/30 rounded-xl p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[#709654] mb-2">
                          {section.icon}
                        </div>
                        <p className="text-xs font-semibold text-[#1F3E22] dark:text-[#AFD1C2]">
                          No items in this column
                        </p>
                        <p className="text-[10px] text-[#709654] mt-1 mb-3">
                          Click + Add to create a new {section.type}
                        </p>
                        <button
                          onClick={() => onOpenNewItemModal(section.type)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg shadow-2xs ${theme.addBtn}`}
                        >
                          + Add Item
                        </button>
                      </div>
                    ) : (
                      section.items.map((item) => {
                        const isSelectedOnCanvas = selectedItemId === item.id;
                        const isOnActiveCanvas = activeCanvasItemIds.includes(item.id);

                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify(item));
                              e.dataTransfer.setData('text/plain', item.id);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            onClick={() => onSelectItem?.(item)}
                            className={`group/card relative flex flex-col p-3 rounded-xl border bg-white dark:bg-[#1A331C] shadow-xs hover:shadow-md transition-all cursor-pointer ${
                              isSelectedOnCanvas
                                ? 'ring-2 ring-[#DF9C56] border-[#DF9C56] bg-amber-500/5'
                                : isOnActiveCanvas
                                ? 'border-[#709654]/70'
                                : 'border-[#709654]/30 dark:border-[#3B5D37]/50'
                            }`}
                          >
                            {/* Card Top: Drag handle, Icon, Editable Title & Description */}
                            <div className="flex items-start gap-2.5">
                              <div className="cursor-grab active:cursor-grabbing text-[#709654]/50 group-hover/card:text-[#1F3E22] mt-0.5">
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>
                              <div className={theme.iconWrapper}>
                                {getItemIcon(item.icon, item.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                {editingItemId === item.id ? (
                                  <input
                                    type="text"
                                    value={itemDraftName}
                                    onChange={(e) => setItemDraftName(e.target.value)}
                                    onBlur={() => handleSaveItemName(item.id)}
                                    onKeyDown={(e) => {
                                      e.stopPropagation();
                                      if (e.key === 'Enter') handleSaveItemName(item.id);
                                      if (e.key === 'Escape') setEditingItemId(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-1.5 py-0.5 rounded border-2 border-[#DF9C56] shadow-inner focus:outline-none w-full"
                                  />
                                ) : (
                                  <h4
                                    onDoubleClick={(e) => handleStartEditItem(item, e)}
                                    className="text-xs font-bold text-[#1F3E22] dark:text-[#F8EBE8] truncate cursor-text hover:underline decoration-dashed"
                                    title="Double click to edit item name"
                                  >
                                    {item.name}
                                  </h4>
                                )}

                                {/* Sub-text: Description */}
                                {editingItemDescId === item.id ? (
                                  <input
                                    type="text"
                                    value={itemDraftDesc}
                                    onChange={(e) => setItemDraftDesc(e.target.value)}
                                    onBlur={() => handleSaveItemDesc(item.id)}
                                    onKeyDown={(e) => {
                                      e.stopPropagation();
                                      if (e.key === 'Enter') handleSaveItemDesc(item.id);
                                      if (e.key === 'Escape') setEditingItemDescId(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="text-[11px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-1 py-0.2 rounded border border-[#DF9C56] focus:outline-none w-full mt-0.5"
                                  />
                                ) : (
                                  <p 
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      setEditingItemDescId(item.id);
                                      setItemDraftDesc(item.description);
                                    }}
                                    className="text-[11px] text-[#709654] dark:text-[#AFD1C2]/80 line-clamp-2 mt-0.5 cursor-text hover:underline decoration-dashed"
                                    title="Double click to edit description"
                                  >
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Card Metadata: Category pill & Tags */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-[#709654]/15">
                              {editingItemCatId === item.id ? (
                                <input
                                  type="text"
                                  value={itemDraftCat}
                                  onChange={(e) => setItemDraftCat(e.target.value)}
                                  onBlur={() => handleSaveItemCategory(item.id)}
                                  onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'Enter') handleSaveItemCategory(item.id);
                                    if (e.key === 'Escape') setEditingItemCatId(null);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onDoubleClick={(e) => e.stopPropagation()}
                                  autoFocus
                                  className="text-[9px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-1 py-0.2 rounded border border-[#DF9C56] focus:outline-none w-20"
                                />
                              ) : (
                                <span 
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setEditingItemCatId(item.id);
                                    setItemDraftCat(item.category);
                                  }}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${theme.badge} bg-black/5 dark:bg-white/5 cursor-text hover:underline decoration-dashed`}
                                  title="Double click to edit category"
                                >
                                  {item.category}
                                </span>
                              )}
                              {isOnActiveCanvas && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                  On Canvas
                                </span>
                              )}
                              {item.tags.map((tag) => (
                                <span key={tag} className="text-[9px] text-[#709654] dark:text-[#AFD1C2]/70 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>

                            {/* Card Action Buttons */}
                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#709654]/15">
                              <span className="text-[9px] text-[#709654]/70 font-mono">
                                Drag to canvas
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteItem?.(item.id);
                                  }}
                                  className="p-1 text-[#DB3A31]/70 hover:text-[#871201] hover:bg-[#DB3A31]/10 rounded-md transition-colors"
                                  title="Delete card"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCanvas(item);
                                  }}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shadow-2xs transition-all ${theme.addBtn}`}
                                  title="Place onto canvas"
                                >
                                  + Add to Canvas
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Tree Content with Visually Distinguishable Headers */
        <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-3" style={{ backgroundColor: '#ffffff' }}>
          {sections.map((section, sectionIdx) => {
            const isCollapsed = collapsedGroups[section.key];
            const theme = getTypeTheme(section.type);
            return (
              <div 
                key={section.key} 
                className="space-y-1.5"
                style={sectionIdx === 0 ? { backgroundColor: '#ffffff' } : undefined}
              >
                {/* Category Header Card with Bold Alternating Colors & Clear Button */}
                <div 
                  onClick={() => handleCategoryHeaderClick(section.key, section.type)}
                  style={sectionIdx === 3 ? { fontSize: '14px' } : undefined}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer font-bold text-xs shadow-xs transition-all ${section.headerBg} ${
                    selectedTypeFilter === section.type ? 'ring-2 ring-offset-1 ring-[#871201] dark:ring-white scale-[1.01]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-2xs ${section.iconBg}`}>
                      {section.icon}
                    </div>
                    {editingCategoryKey === section.key ? (
                      <input
                        type="text"
                        value={categoryDraft}
                        onChange={(e) => setCategoryDraft(e.target.value)}
                        onBlur={() => handleSaveCategoryTitle(section.key)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') handleSaveCategoryTitle(section.key);
                          if (e.key === 'Escape') setEditingCategoryKey(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-1 py-0.2 rounded border border-[#DF9C56] focus:outline-none w-36"
                      />
                    ) : (
                      <span 
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingCategoryKey(section.key);
                          setCategoryDraft(section.title);
                        }}
                        className={`truncate cursor-text hover:underline decoration-dashed ${section.headerText}`}
                        title="Double click to edit category heading"
                      >
                        {section.title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold shadow-2xs ${section.badgeBg}`}>
                      {section.items.length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNewItemModal(section.type);
                      }}
                      className="p-0.5 opacity-80 hover:opacity-100 rounded transition-opacity"
                      title={`Add new ${section.type}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {section.items.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenClearCategoryModal(section.type, section.title);
                        }}
                        className="p-0.5 opacity-80 hover:opacity-100 hover:text-red-500 rounded transition-opacity"
                        title={`Clear all ${section.title}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <span className={section.headerText}>
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                </div>

                {/* Items Tree */}
                {!isCollapsed && (
                  <div 
                    className={`pl-3 pr-1 space-y-2 ml-3.5 ${theme.treeBorder}`}
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    {section.items.length === 0 ? (
                      <div className="px-2 py-2 text-[11px] text-[#709654] italic">
                        No matching {section.title.toLowerCase()}
                      </div>
                    ) : (
                      section.items.map((item, itemIdx) => {
                        const isAlternateRow = itemIdx % 2 === 1;
                        const isSelectedOnCanvas = selectedItemId === item.id;
                        const isOnActiveCanvas = activeCanvasItemIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify(item));
                              e.dataTransfer.setData('text/plain', item.id);
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            onClick={() => onSelectItem?.(item)}
                            style={{
                              backgroundColor: '#ffffff',
                              borderColor: '#ffffff',
                            }}
                            className={`group/item flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer text-left shadow-2xs ${theme.card} ${
                              isSelectedOnCanvas
                                ? 'ring-2 ring-[#DF9C56] shadow-md bg-amber-500/10 dark:bg-amber-500/20'
                                : isOnActiveCanvas
                                ? 'border-[#709654]/70 bg-emerald-500/5'
                                : ''
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              <GripVertical className="w-3.5 h-3.5 text-[#709654]/50 group-hover/item:text-[#1F3E22] dark:group-hover/item:text-[#F8EBE8] shrink-0 mt-0.5" />
                              <div className={theme.iconWrapper}>
                                {getItemIcon(item.icon, item.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                {editingItemId === item.id ? (
                                  <input
                                    type="text"
                                    value={itemDraftName}
                                    onChange={(e) => setItemDraftName(e.target.value)}
                                    onBlur={() => handleSaveItemName(item.id)}
                                    onKeyDown={(e) => {
                                      e.stopPropagation();
                                      if (e.key === 'Enter') handleSaveItemName(item.id);
                                      if (e.key === 'Escape') setEditingItemId(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-1 py-0.5 rounded border-2 border-[#DF9C56] shadow-inner focus:outline-none w-full"
                                  />
                                ) : (
                                  <div 
                                    className="text-xs font-bold text-[#1F3E22] dark:text-[#F8EBE8] truncate cursor-text hover:underline decoration-dashed"
                                    style={sectionIdx === 2 && itemIdx === 1 ? { fontSize: '12px' } : undefined}
                                    onDoubleClick={(e) => handleStartEditItem(item, e)}
                                    title="Double click to edit item name"
                                  >
                                    {item.name}
                                  </div>
                                )}

                                {/* Sub-text: Description */}
                                {editingItemDescId === item.id ? (
                                  <input
                                    type="text"
                                    value={itemDraftDesc}
                                    onChange={(e) => setItemDraftDesc(e.target.value)}
                                    onBlur={() => handleSaveItemDesc(item.id)}
                                    onKeyDown={(e) => {
                                      e.stopPropagation();
                                      if (e.key === 'Enter') handleSaveItemDesc(item.id);
                                      if (e.key === 'Escape') setEditingItemDescId(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="text-[11px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-1 py-0.2 rounded border border-[#DF9C56] focus:outline-none w-full mt-0.5"
                                  />
                                ) : (
                                  <div 
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      setEditingItemDescId(item.id);
                                      setItemDraftDesc(item.description);
                                    }}
                                    className="text-[11px] text-[#709654] dark:text-[#AFD1C2]/80 truncate cursor-text hover:underline decoration-dashed"
                                    title="Double click to edit description"
                                  >
                                    {item.description}
                                  </div>
                                )}

                                <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                                  {editingItemCatId === item.id ? (
                                    <input
                                      type="text"
                                      value={itemDraftCat}
                                      onChange={(e) => setItemDraftCat(e.target.value)}
                                      onBlur={() => handleSaveItemCategory(item.id)}
                                      onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === 'Enter') handleSaveItemCategory(item.id);
                                        if (e.key === 'Escape') setEditingItemCatId(null);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onDoubleClick={(e) => e.stopPropagation()}
                                      autoFocus
                                      className="text-[10px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-1 py-0.2 rounded border border-[#DF9C56] focus:outline-none w-20"
                                    />
                                  ) : (
                                    <span 
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setEditingItemCatId(item.id);
                                        setItemDraftCat(item.category);
                                      }}
                                      className={`font-semibold cursor-text hover:underline decoration-dashed ${theme.badge}`}
                                      title="Double click to edit category"
                                    >
                                      {item.category}
                                    </span>
                                  )}
                                  {isOnActiveCanvas && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#709654]/20 text-[#3B5D37] dark:text-[#AFD1C2]">
                                      On Canvas
                                    </span>
                                  )}
                                  {item.tags.length > 0 && (
                                    <>
                                      <span className="text-[#709654]">·</span>
                                      <span className="text-[#709654] dark:text-[#AFD1C2]/60 truncate">#{item.tags[0]}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Item Action buttons */}
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                onClick={() => onAddToCanvas(item)}
                                className={`opacity-0 group-hover/item:opacity-100 px-2.5 py-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap shadow-xs ${theme.addBtn}`}
                                title="Place on active canvas"
                              >
                                + Add
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteItem?.(item.id);
                                }}
                                className="opacity-0 group-hover/item:opacity-100 p-1 text-[#DB3A31] hover:text-[#871201] hover:bg-[#DB3A31]/15 rounded transition-all"
                                title="Delete item from organizer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info / Drag helper */}
      <div className="p-2.5 border-t border-[#709654]/25 dark:border-[#3B5D37]/60 bg-[#EEDFD8]/60 dark:bg-[#122214] text-[11px] text-[#709654] dark:text-[#AFD1C2]/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{isFullScreen && fullScreenMode === 'cards-stack' ? 'Cards Stack: Categories side-by-side' : 'Drag item or click + Add'}</span>
          {isFullScreen && (
            <span className="hidden sm:inline text-[10px] text-[#709654] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
              Press [Esc] to exit
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFullScreen && (
            <button
              onClick={() => setIsFullScreen(false)}
              className="text-xs px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#1F3E22] dark:text-[#F8EBE8] font-semibold transition-colors"
            >
              Exit Full Screen
            </button>
          )}
          <button
            onClick={() => onOpenNewItemModal()}
            style={{ fontSize: '14px' }}
            className="text-[#871201] dark:text-[#DF9C56] hover:underline font-bold"
          >
            + Custom Item
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal Overlay */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#F8EBE8] dark:bg-[#1A331C] border-2 border-[#DB3A31] rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 select-none">
            <div className="flex items-center gap-2.5 text-[#DB3A31]">
              <div className="p-2 rounded-xl bg-[#DB3A31]/15 text-[#DB3A31]">
                <Trash2 className="w-5 h-5 shrink-0" />
              </div>
              <h3 className="font-bold text-sm text-[#1F3E22] dark:text-[#F8EBE8]">
                {confirmModal.title}
              </h3>
            </div>
            <p className="text-xs text-[#709654] dark:text-[#AFD1C2] leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#709654]/20">
              <button
                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', targetType: null })}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#1F3E22] dark:text-[#F8EBE8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#DB3A31] hover:bg-[#871201] text-white shadow-xs transition-colors"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
