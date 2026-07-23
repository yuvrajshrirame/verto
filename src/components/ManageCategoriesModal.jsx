import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Trash2, Edit2, Save, Plus, Code, BookOpen, Briefcase, Dumbbell, Monitor, Cpu, PenTool, Coffee, Layout, Terminal, Activity } from 'lucide-react';

export const ICON_MAP = {
  Code, BookOpen, Briefcase, Dumbbell, Monitor, Cpu, PenTool, Coffee, Layout, Terminal, Activity
};

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#06b6d4'
];

const ManageCategoriesModal = ({ user, onClose, onUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState('Terminal');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4 py-8" onClick={onClose}>
      
      {/* METALLIC GLASS UPGRADE + OVERFLOW FIX */}
      <div 
        className="bg-gradient-to-br from-[#1a1d24]/95 to-[#090a0f]/95 backdrop-blur-3xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.1)] w-full max-w-md relative overflow-hidden flex flex-col max-h-[85vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent z-50" />

        {/* Fixed Header */}
        <div className="shrink-0 p-8 pb-5 border-b border-emerald-900/40 relative z-20 bg-[#090a0f]/40 backdrop-blur-md">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl bg-[#030712]/50 border border-emerald-900/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                <X className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#030712]/50 rounded-lg shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-emerald-900/30">
                    <SettingsIcon className="text-emerald-400 w-5 h-5 drop-shadow-sm" />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-widest font-mono drop-shadow-md">Category Engine</h2>
            </div>
        </div>

        {/* Scrollable Body Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6 relative z-10 space-y-8">
            
            {/* Create New Category Form */}
            <form onSubmit={handleAdd} className="bg-[#030712]/40 backdrop-blur-md border border-emerald-900/50 border-t-emerald-500/10 border-l-emerald-500/10 shadow-[0_4px_15px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] p-6 rounded-2xl">
                <h3 className="text-[10px] text-emerald-500 font-mono tracking-widest uppercase mb-4 drop-shadow-sm">Define New Node</h3>
                
                <input 
                    type="text" 
                    placeholder="CATEGORY NAME"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-[#030712]/80 border border-emerald-900/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] rounded-xl px-4 py-3.5 text-emerald-300 font-mono text-xs focus:border-emerald-500/80 outline-none mb-5 uppercase placeholder-emerald-900/60 transition-colors"
                    maxLength={20}
                />

                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                    <div className="flex-1">
                        <label className="block text-[9px] text-emerald-600 font-mono uppercase tracking-widest mb-2.5">Color Core</label>
                        <div className="flex flex-wrap gap-3">
                            {PRESET_COLORS.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setNewCatColor(color)}
                                className={`w-6 h-6 rounded-full border border-transparent transition-all cursor-pointer shadow-[0_2px_5px_rgba(0,0,0,0.5)] ${newCatColor === color ? 'ring-2 ring-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)]' : 'opacity-50 hover:opacity-100 hover:scale-105'}`}
                                style={{ backgroundColor: color }}
                            />
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        <label className="block text-[9px] text-emerald-600 font-mono uppercase tracking-widest mb-2.5">Iconography</label>
                        <select 
                            value={newCatIcon}
                            onChange={(e) => setNewCatIcon(e.target.value)}
                            className="w-full bg-[#030712]/80 border border-emerald-900/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] rounded-xl px-3 py-2.5 text-emerald-300 font-mono text-xs outline-none cursor-pointer tracking-wider"
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
                    className="w-full bg-gradient-to-b from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 border-t-emerald-400/40 text-emerald-300 py-3.5 rounded-xl font-mono text-xs tracking-widest font-bold flex items-center justify-center gap-2 hover:from-emerald-500/30 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)] disabled:opacity-50 cursor-pointer uppercase"
                >
                    <Plus className="w-4 h-4 drop-shadow-md" /> ADD TO SYSTEM
                </button>
            </form>

            {/* Active Nodes List */}
            <div>
                <h3 className="text-[10px] text-emerald-500 font-mono tracking-widest uppercase mb-4 drop-shadow-sm px-1">Active Nodes</h3>
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="text-emerald-600 font-mono text-xs text-center py-6 tracking-widest animate-pulse">SCANNING PROTOCOLS...</div>
                    ) : categories.length === 0 ? (
                        <div className="text-emerald-700/60 font-mono text-xs text-center py-6 uppercase tracking-widest border border-emerald-900/30 border-dashed rounded-xl">No Categories Detected</div>
                    ) : (
                        categories.map(cat => {
                        const IconComp = ICON_MAP[cat.icon] || Activity;
                        return (
                            <div key={cat.id} className="bg-[#030712]/40 backdrop-blur-sm border border-emerald-900/40 border-t-emerald-500/10 border-l-emerald-500/10 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] p-5 rounded-2xl transition-all">
                            
                            {editingId === cat.id ? (
                                <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <input 
                                        autoFocus
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="bg-[#030712]/80 text-emerald-300 font-mono text-xs border border-emerald-900/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] rounded-xl px-4 py-3 w-full outline-none uppercase tracking-widest"
                                        placeholder="NAME"
                                    />
                                    <button onClick={() => handleUpdate(cat.id)} className="text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] p-3 rounded-xl transition-all cursor-pointer shrink-0">
                                        <Save className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="text-slate-400 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-3 rounded-xl transition-all cursor-pointer shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t border-emerald-900/30 pt-4 mt-1">
                                    <div className="flex flex-wrap gap-2.5 flex-1">
                                    {PRESET_COLORS.map(color => (
                                        <button
                                        key={color}
                                        type="button"
                                        onClick={() => setEditColor(color)}
                                        className={`w-5 h-5 rounded-full border border-transparent transition-all cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${editColor === color ? 'ring-2 ring-white scale-110' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
                                        style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    </div>
                                    <select 
                                        value={editIcon}
                                        onChange={(e) => setEditIcon(e.target.value)}
                                        className="bg-[#030712]/80 border border-emerald-900/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] rounded-xl px-3 py-2 text-emerald-300 font-mono text-[10px] uppercase tracking-wider outline-none cursor-pointer w-full sm:w-32 shrink-0"
                                    >
                                    {Object.keys(ICON_MAP).map(iconName => (
                                        <option key={iconName} value={iconName}>{iconName}</option>
                                    ))}
                                    </select>
                                </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 truncate">
                                    <div className="p-2.5 rounded-xl bg-[#090a0f]/80 border border-emerald-900/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] shrink-0" style={{ color: cat.color || '#10b981' }}>
                                        <IconComp className="w-4 h-4 drop-shadow-sm" />
                                    </div>
                                    <span className="text-emerald-100 font-mono text-xs font-bold uppercase tracking-widest truncate drop-shadow-sm">{cat.name}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <button 
                                        onClick={() => { 
                                            setEditingId(cat.id); 
                                            setEditName(cat.name); 
                                            setEditColor(cat.color || PRESET_COLORS[0]);
                                            setEditIcon(cat.icon || 'Activity');
                                        }} 
                                        className="text-slate-400 hover:text-emerald-400 p-2.5 hover:bg-[#030712]/60 hover:border-emerald-900/50 border border-transparent rounded-xl transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                                    >
                                    <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(cat.id)}
                                        className="text-red-900/70 hover:text-red-400 p-2.5 hover:bg-red-950/30 hover:border-red-900/50 border border-transparent rounded-xl transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
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
      </div>
    </div>
  );
};

const SettingsIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

export default ManageCategoriesModal;