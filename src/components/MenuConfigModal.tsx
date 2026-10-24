import React, { useState } from 'react';
import { MenuItem, INITIAL_MENU_ITEMS } from '../data/menu';
import { X, Save, RotateCcw, Download, Check, Plus, Trash2 } from 'lucide-react';

interface MenuConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onSaveMenuItems: (items: MenuItem[]) => void;
  onResetDefaults: () => void;
}

export const MenuConfigModal: React.FC<MenuConfigModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  onSaveMenuItems,
  onResetDefaults,
}) => {
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handlePriceChange = (id: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price: Math.max(1, newPrice) } : item))
    );
  };

  const handleAvailabilityToggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, available: !item.available } : item))
    );
  };

  const handleNameChange = (id: string, name: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name } : item))
    );
  };

  const handleDescriptionChange = (id: string, description: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, description } : item))
    );
  };

  const handleSave = () => {
    onSaveMenuItems(items);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1200);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'oru_tea_sollu_menu.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-[#151311] border border-[#C98242]/30 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden text-[#FFF3DF]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold font-serif-display text-[#FFF3DF]">
              Cafe Owner Menu & Price Manager
            </h3>
            <p className="text-xs text-[#FFF3DF]/60 mt-1">
              Update tea and snack prices, toggle item availability, and export live data.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-[#FFF3DF]/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-[#24150F] p-3 rounded-xl border border-white/5 text-xs text-[#FFF3DF]/70 flex items-center justify-between">
            <span>
              Changes save instantly to browser storage and update the live menu and WhatsApp links.
            </span>
            <button
              onClick={handleExportJson}
              className="text-[#C98242] hover:text-[#E78B45] font-semibold flex items-center gap-1 shrink-0 ml-3"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-[#24150F] rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleNameChange(item.id, e.target.value)}
                      className="px-2 py-1 bg-[#151311] border border-white/10 rounded text-xs font-semibold text-[#FFF3DF] focus:border-[#C98242] focus:outline-none flex-1 max-w-xs"
                    />
                    <span className="text-[11px] text-[#C98242] uppercase font-mono px-1.5 py-0.5 bg-[#151311] rounded">
                      {item.category}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                    className="w-full px-2 py-1 bg-[#151311] border border-white/10 rounded text-xs text-[#FFF3DF]/70 focus:border-[#C98242] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Price input */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#FFF3DF]/60">₹</span>
                    <input
                      type="number"
                      min={1}
                      value={item.price}
                      onChange={(e) => handlePriceChange(item.id, Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-[#151311] border border-white/10 rounded text-xs font-mono font-bold text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                    />
                  </div>

                  {/* Stock Toggle */}
                  <button
                    onClick={() => handleAvailabilityToggle(item.id)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      item.available
                        ? 'bg-[#506B45]/30 text-[#8ec07c] border border-[#506B45]/50'
                        : 'bg-red-950/30 text-red-300 border border-red-800/40'
                    }`}
                  >
                    {item.available ? 'In Stock' : 'Sold Out'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-[#151311] flex items-center justify-between gap-4">
          <button
            onClick={() => {
              if (window.confirm('Reset all prices and items to standard defaults?')) {
                onResetDefaults();
                setItems(INITIAL_MENU_ITEMS);
              }
            }}
            className="text-xs text-[#FFF3DF]/60 hover:text-red-400 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-xs font-medium rounded-xl text-[#FFF3DF]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              {savedNotice ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
