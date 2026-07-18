import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Trash2, Edit2, Save, Plus, Code, BookOpen, Briefcase, Dumbbell, Monitor, Cpu, PenTool, Coffee, Layout, Terminal, Activity } from 'lucide-react';

// Static mapping of available icons (Exported for Timer and Analytics)
export const ICON_MAP = {
  Code, BookOpen, Briefcase, Dumbbell, Monitor, Cpu, PenTool, Coffee, Layout, Terminal, Activity
};

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
];

const ManageCategoriesModal = ({ user, onClose, onUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState('Terminal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advanced Editing State
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "categories"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(fetched);
    } catch (error) {
      console.error("Failed to load categories", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user.uid]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "categories"), {
        uid: user.uid,
        name: newCatName.trim(),
        color: newCatColor,
        icon: newCatIcon,
        createdAt: serverTimestamp()
      });
      setNewCatName('');
      await fetchCategories();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? (Past sessions using this name will be kept)")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      await fetchCategories();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      await updateDoc(doc(db, "categories", id), { 
        name: editName.trim(),
        color: editColor,
        icon: editIcon
      });
      setEditingId(null);
      await fetchCategories();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4" onClick={onClose}>
      <div className="bg-[#030712] border border-emerald-500/30 p-6 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.1)] w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-emerald-700 hover:text-emerald-400 transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-6 border-b border-emerald-900/30 pb-4">
          <SettingsIcon className="text-emerald-400 w-5 h-5" />
          <h2 className="text-lg font-bold text-white uppercase tracking-widest font-mono">Category Engine</h2>
        </div>

        {/* Create New Category Form */}
        <form onSubmit={handleAdd} className="bg-[#0f1117] border border-emerald-900/50 p-4 rounded-xl mb-6">
          <h3 className="text-[10px] text-emerald-700 font-mono tracking-widest uppercase mb-3">Define New Node</h3>
          
          <input 
            type="text" 
            placeholder="CATEGORY NAME"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="w-full bg-[#030712] border border-emerald-900/50 rounded-lg px-3 py-2 text-emerald-400 font-mono text-xs focus:border-emerald-500 outline-none mb-4 uppercase"
            maxLength={20}
          />

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-[9px] text-emerald-700 font-mono uppercase mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCatColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${newCatColor === color ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <label className="block text-[9px] text-emerald-700 font-mono uppercase mb-2">Icon</label>
              <select 
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                className="w-full bg-[#030712] border border-emerald-900/50 rounded-lg px-2 py-1.5 text-emerald-400 font-mono text-xs outline-none cursor-pointer"
              >
                {Object.keys(ICON_MAP).map(iconName => (
                  <option key={iconName} value={iconName}>{iconName}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!newCatName.trim() || isSubmitting}
            className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-2 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> ADD TO SYSTEM
          </button>
        </form>

        {/* Existing Categories List */}
        <h3 className="text-[10px] text-emerald-700 font-mono tracking-widest uppercase mb-3">Active Nodes</h3>
        <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-2">
          {isLoading ? (
            <div className="text-emerald-700 font-mono text-xs text-center py-4">LOADING...</div>
          ) : categories.length === 0 ? (
            <div className="text-emerald-700 font-mono text-xs text-center py-4">NO CATEGORIES DETECTED</div>
          ) : (
            categories.map(cat => {
              const IconComp = ICON_MAP[cat.icon] || Activity;
              return (
                <div key={cat.id} className="bg-[#0f1117] border border-emerald-900/30 p-3 rounded-lg">
                  
                  {editingId === cat.id ? (
                    /* --- ADVANCED EDIT MODE --- */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <input 
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-[#030712] text-emerald-400 font-mono text-xs border border-emerald-500/50 rounded px-2 py-1.5 w-full outline-none uppercase"
                          placeholder="NAME"
                        />
                        <button onClick={() => handleUpdate(cat.id)} className="text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 p-1.5 rounded transition-all cursor-pointer shrink-0">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded transition-all cursor-pointer shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Compact Color Picker */}
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {PRESET_COLORS.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setEditColor(color)}
                              className={`w-4 h-4 rounded-full border border-transparent transition-all cursor-pointer ${editColor === color ? 'ring-1 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        {/* Compact Icon Picker */}
                        <select 
                          value={editIcon}
                          onChange={(e) => setEditIcon(e.target.value)}
                          className="bg-[#030712] border border-emerald-900/50 rounded px-1.5 py-1 text-emerald-400 font-mono text-[10px] outline-none cursor-pointer w-24 shrink-0"
                        >
                          {Object.keys(ICON_MAP).map(iconName => (
                            <option key={iconName} value={iconName}>{iconName}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    /* --- STANDARD VIEW MODE --- */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 truncate">
                        <div className="p-1.5 rounded-md bg-[#030712] shrink-0" style={{ color: cat.color || '#10b981' }}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-emerald-100 font-mono text-xs font-bold uppercase truncate">{cat.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => { 
                            setEditingId(cat.id); 
                            setEditName(cat.name); 
                            setEditColor(cat.color || PRESET_COLORS[0]);
                            setEditIcon(cat.icon || 'Activity');
                          }} 
                          className="text-slate-500 hover:text-emerald-400 p-1.5 hover:bg-emerald-500/10 rounded transition-all cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  );
};

// Helper for the modal header icon
const SettingsIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

export default ManageCategoriesModal;