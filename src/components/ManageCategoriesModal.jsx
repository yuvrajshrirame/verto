import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Edit2, Trash2, Save } from 'lucide-react';

const ManageCategoriesModal = ({ user, onClose, onUpdate }) => {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchCategories();
  }, [user.uid]);

  const fetchCategories = async () => {
    const q = query(collection(db, "categories"), where("uid", "==", user.uid));
    const snapshot = await getDocs(q);
    setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? (Past sessions using this name will be kept)")) return;
    await deleteDoc(doc(db, "categories", id));
    fetchCategories();
    onUpdate(); // Tell Timer to refresh
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    await updateDoc(doc(db, "categories", id), { name: editName.trim() });
    setEditingId(null);
    fetchCategories();
    onUpdate(); // Tell Timer to refresh
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-fade-in">
      <div className="bg-[#0a0f16] border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-white mb-6">Manage Nodes</h2>
        
        {categories.length === 0 ? (
          <p className="text-slate-500 text-sm font-mono text-center py-4">No categories found.</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-lg">
                {editingId === cat.id ? (
                  <input 
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-slate-950 text-emerald-400 font-mono text-sm border border-emerald-500/50 rounded px-2 py-1 w-full mr-2 outline-none"
                  />
                ) : (
                  <span className="text-slate-300 font-mono text-sm uppercase tracking-wider">_{cat.name}</span>
                )}
                
                <div className="flex space-x-2">
                  {editingId === cat.id ? (
                    <button onClick={() => handleUpdate(cat.id)} className="text-emerald-400 hover:text-emerald-300"><Save className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} className="text-slate-500 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => handleDelete(cat.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCategoriesModal;