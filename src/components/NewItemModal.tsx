import React, { useState } from 'react';
import { OrganizerItem, ItemType } from '../types/orchestrator';
import { 
  X, 
  Wrench, 
  AppWindow, 
  FolderGit2, 
  Database,
  Plus
} from 'lucide-react';

interface NewItemModalProps {
  isOpen: boolean;
  defaultType?: ItemType;
  onClose: () => void;
  onAddItem: (item: OrganizerItem) => void;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({
  isOpen,
  defaultType = 'tool',
  onClose,
  onAddItem,
}) => {
  const [type, setType] = useState<ItemType>(defaultType);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Core Utilities');
  const [description, setDescription] = useState('');
  const [command, setCommand] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'development' | 'local'>('development');
  const [tagsInput, setTagsInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    let icon = 'Code2';
    if (type === 'app') icon = 'Network';
    else if (type === 'project') icon = 'FolderGit2';
    else if (type === 'resource') icon = 'Database';
    else if (type === 'tool') icon = 'Wrench';

    const newItem: OrganizerItem = {
      id: `${type}-${Date.now()}`,
      name: name.trim(),
      type,
      category: category.trim() || 'General',
      description: description.trim() || 'Custom registered component',
      status: 'idle',
      icon,
      command: type === 'tool' ? command.trim() : undefined,
      endpoint: type === 'app' || type === 'resource' ? endpoint.trim() : undefined,
      environment,
      tags: tags.length > 0 ? tags : ['custom'],
    };

    onAddItem(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F3E22]/60 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-lg bg-[#F8EBE8] dark:bg-[#182E1A] rounded-2xl border border-[#AFD1C2]/60 dark:border-[#3B5D37] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#AFD1C2]/50 dark:border-[#3B5D37] flex items-center justify-between bg-[#F8EBE8]/90 dark:bg-[#1F3E22]/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#3B5D37]/15 dark:bg-[#3B5D37]/40 text-[#1F3E22] dark:text-[#AFD1C2]">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F3E22] dark:text-[#F8EBE8]">
                Register New Organizer Item
              </h3>
              <p className="text-[11px] text-[#709654] dark:text-[#AFD1C2]/70">
                Add to your hierarchical tree of tools, applications, projects and resources
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#709654] hover:text-[#1F3E22] dark:hover:text-[#F8EBE8] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Type Selector */}
          <div>
            <label className="text-[11px] font-semibold text-[#1F3E22] dark:text-[#F8EBE8] block mb-1.5">
              Item Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'tool', label: 'Tool', color: '#DF9C56', icon: <Wrench className="w-3.5 h-3.5" style={{ color: '#DF9C56' }} /> },
                { key: 'app', label: 'App', color: '#C61B31', icon: <AppWindow className="w-3.5 h-3.5" style={{ color: '#C61B31' }} /> },
                { key: 'project', label: 'Project', color: '#DB3A31', icon: <FolderGit2 className="w-3.5 h-3.5" style={{ color: '#DB3A31' }} /> },
                { key: 'resource', label: 'Resource', color: '#3B5D37', icon: <Database className="w-3.5 h-3.5" style={{ color: '#3B5D37' }} /> },
              ].map((t) => (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setType(t.key as ItemType)}
                  style={{
                    borderColor: type === t.key ? t.color : undefined,
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                    type === t.key
                      ? 'bg-white/80 dark:bg-[#1F3E22] font-semibold shadow-xs ring-1'
                      : 'border-[#AFD1C2]/60 dark:border-[#3B5D37]/60 text-[#1F3E22]/70 dark:text-[#AFD1C2] hover:bg-white/40 dark:hover:bg-[#1F3E22]/50'
                  }`}
                >
                  {t.icon}
                  <span className="text-[11px]" style={{ color: type === t.key ? t.color : undefined }}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Name & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#1F3E22] dark:text-[#F8EBE8] block mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Redis Cache Cluster"
                className="w-full px-3 py-2 bg-white dark:bg-[#152717] border border-[#AFD1C2] dark:border-[#3B5D37] rounded-lg text-[#1F3E22] dark:text-[#F8EBE8] focus:outline-none focus:border-[#3B5D37] dark:focus:border-[#AFD1C2]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#1F3E22] dark:text-[#F8EBE8] block mb-1">
                Tree Group Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Data Stores, Testing"
                className="w-full px-3 py-2 bg-white dark:bg-[#152717] border border-[#AFD1C2] dark:border-[#3B5D37] rounded-lg text-[#1F3E22] dark:text-[#F8EBE8] focus:outline-none focus:border-[#3B5D37] dark:focus:border-[#AFD1C2]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-[#1F3E22] dark:text-[#F8EBE8] block mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Operational role and purpose..."
              className="w-full px-3 py-2 bg-white dark:bg-[#152717] border border-[#AFD1C2] dark:border-[#3B5D37] rounded-lg text-[#1F3E22] dark:text-[#F8EBE8] focus:outline-none focus:border-[#3B5D37] dark:focus:border-[#AFD1C2]"
            />
          </div>

          {/* Command if Tool */}
          {type === 'tool' && (
            <div>
              <label className="text-[11px] font-semibold text-[#1F3E22] dark:text-[#F8EBE8] block mb-1">
                Command Line Script
              </label>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="e.g. npm run test:unit"
                className="w-full px-3 py-2 bg-[#1F3E22] text-[#AFD1C2] font-mono text-[11px] border border-[#3B5D37] rounded-lg focus:outline-none focus:border-[#DF9C56]"
              />
            </div>
          )}

          {/* Endpoint if App or Resource */}
          {(type === 'app' || type === 'resource') && (
            <div>
              <label className="text-[11px] font-semibold text-[#1F3E22] dark:text-[#F8EBE8] block mb-1">
                Target Endpoint or URI
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="e.g. https://api.internal or postgres://..."
                className="w-full px-3 py-2 bg-white dark:bg-[#152717] font-mono text-[11px] border border-[#AFD1C2] dark:border-[#3B5D37] rounded-lg text-[#1F3E22] dark:text-[#F8EBE8] focus:outline-none focus:border-[#3B5D37] dark:focus:border-[#AFD1C2]"
              />
            </div>
          )}

          {/* Environment & Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#1F3E22] dark:text-[#F8EBE8] block mb-1">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-[#152717] border border-[#AFD1C2] dark:border-[#3B5D37] rounded-lg text-[#1F3E22] dark:text-[#F8EBE8] focus:outline-none focus:border-[#3B5D37]"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
                <option value="local">Local</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#1F3E22] dark:text-[#F8EBE8] block mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="core, infra, v2"
                className="w-full px-3 py-2 bg-white dark:bg-[#152717] border border-[#AFD1C2] dark:border-[#3B5D37] rounded-lg text-[#1F3E22] dark:text-[#F8EBE8] focus:outline-none focus:border-[#3B5D37] dark:focus:border-[#AFD1C2]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#AFD1C2]/50 dark:border-[#3B5D37] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-[#709654] hover:text-[#1F3E22] dark:text-[#AFD1C2] dark:hover:text-[#F8EBE8] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-[#F8EBE8] bg-[#3B5D37] hover:bg-[#1F3E22] rounded-lg transition-colors shadow-xs"
            >
              Register Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
