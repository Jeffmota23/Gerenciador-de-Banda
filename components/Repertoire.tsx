
import React, { useState } from 'react';
import { RepertoireItem, UserRole, User, RepertoireCategory } from '../types';
import { Music, FileText, Star, Trash2, Wand2, BookOpen, Clock, Activity, FileDigit, Upload, FileLock, Unlock } from 'lucide-react';
import { generateRepertoireTips } from '../services/geminiService';

interface Props {
  items: RepertoireItem[];
  currentUser: User;
  onDelete: (id: string, reason: string) => void;
  onAdd: (item: any) => void;
}

export const Repertoire: React.FC<Props> = ({ items, currentUser, onDelete, onAdd }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<RepertoireCategory>(RepertoireCategory.PIECE);
  
  const [aiTips, setAiTips] = useState<Record<string, string>>({});
  const [loadingTips, setLoadingTips] = useState<string | null>(null);

  // Permission State
  const [hasFileAccess, setHasFileAccess] = useState(false);

  // Permission Request
  const requestAccess = () => {
      // Simulate OS Dialog
      const granted = window.confirm("O BandSocial Manager deseja acessar os arquivos do seu dispositivo para realizar uploads.\n\nPermitir?");
      if(granted) setHasFileAccess(true);
  };

  // Permission Check: Can this user manage repertoire?
  const canManage = [
    UserRole.GENERAL_MANAGER,
    UserRole.REPERTOIRE_MANAGER_1,
    UserRole.REPERTOIRE_MANAGER_2
  ].includes(currentUser.role);

  const handleDelete = (id: string) => {
    const reason = prompt("Motivo da exclusão (Obrigatório para Auditoria):");
    if (reason) onDelete(id, reason);
  };

  const handleAiAssist = async (item: RepertoireItem) => {
    setLoadingTips(item.id);
    const context = item.category === RepertoireCategory.PIECE 
       ? `"${item.title}" by ${item.composer}` 
       : `Exercise: "${item.title}" focusing on ${item.focus}`;
    
    const tips = await generateRepertoireTips(context, item.category, currentUser.instrument);
    setAiTips(prev => ({ ...prev, [item.id]: tips }));
    setLoadingTips(null);
  };

  // Form State
  const [newItem, setNewItem] = useState<Partial<RepertoireItem>>({ 
    difficulty: 'Medium',
    category: RepertoireCategory.PIECE 
  });

  const handleAddSubmit = () => {
     // Basic Validation
     if (!newItem.title) return alert("Título é obrigatório");
     
     onAdd({
       ...newItem,
       category: activeTab // Ensure correct category
     });
     setShowAddModal(false);
     setNewItem({ difficulty: 'Medium', category: activeTab });
  };

  const filteredItems = items.filter(i => i.category === activeTab);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-navy-700 pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-serif text-bege-50">Arquivo da Banda</h2>
          <p className="text-bege-200">Central de Músicas e Material de Estudo.</p>
        </div>
        
        {canManage && (
          <button 
            onClick={() => {
                setNewItem({ difficulty: 'Medium', category: activeTab });
                setShowAddModal(true);
            }}
            className="bg-ocre-600 hover:bg-ocre-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
          >
            {activeTab === RepertoireCategory.PIECE ? <Music className="w-4 h-4"/> : <BookOpen className="w-4 h-4"/>}
            Adicionar {activeTab === RepertoireCategory.PIECE ? 'Música' : 'Estudo'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        <button 
          onClick={() => setActiveTab(RepertoireCategory.PIECE)}
          className={`pb-2 px-4 font-bold transition-colors border-b-2 flex items-center gap-2 ${activeTab === RepertoireCategory.PIECE ? 'border-ocre-500 text-bege-50' : 'border-transparent text-bege-200/50 hover:text-bege-100'}`}
        >
          <Music className="w-5 h-5" /> Repertório
        </button>
        <button 
          onClick={() => setActiveTab(RepertoireCategory.STUDY)}
          className={`pb-2 px-4 font-bold transition-colors border-b-2 flex items-center gap-2 ${activeTab === RepertoireCategory.STUDY ? 'border-ocre-500 text-bege-50' : 'border-transparent text-bege-200/50 hover:text-bege-100'}`}
        >
          <BookOpen className="w-5 h-5" /> Material de Estudo
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden shadow-lg group hover:border-bege-200/30 transition-all flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg text-ocre-500 ${item.category === RepertoireCategory.PIECE ? 'bg-navy-900' : 'bg-navy-900/50 border border-ocre-900'}`}>
                  {item.category === RepertoireCategory.PIECE ? <Music className="w-8 h-8" /> : <Activity className="w-8 h-8" />}
                </div>
                <div className="flex gap-2">
                   <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                     item.difficulty === 'Virtuoso' ? 'bg-red-900/50 text-red-200' : 
                     item.difficulty === 'Hard' ? 'bg-orange-900/50 text-orange-200' :
                     'bg-green-900/50 text-green-200'
                   }`}>
                     {item.difficulty}
                   </span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-bege-50 mb-1">{item.title}</h3>
              
              {/* Conditional Sub-info */}
              {item.category === RepertoireCategory.PIECE ? (
                  <p className="text-bege-200 italic mb-4">{item.composer || 'Desconhecido'}</p>
              ) : (
                  <p className="text-bege-200 italic mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {item.estimatedTime} min
                  </p>
              )}

              <div className="space-y-2 mb-6">
                {item.category === RepertoireCategory.PIECE ? (
                    <>
                        <div className="flex items-center text-sm text-bege-100">
                        <span className="w-24 text-bege-200/60 uppercase text-xs font-bold">Tom</span>
                        {item.key}
                        </div>
                        <div className="flex items-center text-sm text-bege-100">
                        <span className="w-24 text-bege-200/60 uppercase text-xs font-bold">Arranjo</span>
                        Brass Band (Std)
                        </div>
                    </>
                ) : (
                    <div className="flex items-center text-sm text-bege-100">
                      <span className="w-24 text-bege-200/60 uppercase text-xs font-bold">Foco</span>
                      {item.focus}
                    </div>
                )}
              </div>

              {item.description && (
                <p className="text-sm text-bege-200/80 mb-4 border-l-2 border-ocre-500 pl-3">
                  {item.description}
                </p>
              )}
              
              {/* AI Section */}
              {aiTips[item.id] ? (
                <div className="mb-4 bg-navy-900/50 p-3 rounded text-sm text-bege-100 animate-fade-in">
                  <strong className="block text-ocre-500 mb-1 flex items-center gap-1"><Wand2 className="w-3 h-3"/> Dicas IA para {currentUser.instrument}:</strong>
                  {aiTips[item.id]}
                </div>
              ) : (
                <button 
                  onClick={() => handleAiAssist(item)}
                  disabled={loadingTips === item.id}
                  className="text-xs text-ocre-500 hover:text-ocre-400 mb-4 flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" /> 
                  {loadingTips === item.id ? 'Analisando...' : `Dicas para ${currentUser.instrument}`}
                </button>
              )}
            </div>

            <div className="flex gap-2 p-6 pt-0 mt-auto border-t border-navy-700 pt-4">
              <button className="flex-1 bg-navy-900 hover:bg-navy-700 py-2 rounded text-sm text-bege-100 font-bold transition-colors flex items-center justify-center gap-2">
                <FileDigit className="w-4 h-4" /> PDF
              </button>
              {canManage && (
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-400 hover:bg-red-900/20 rounded transition-colors" title="Deletar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-navy-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 p-8 rounded-xl max-w-md w-full border border-navy-600 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-serif text-bege-50 mb-4">
                Adicionar {activeTab === RepertoireCategory.PIECE ? 'Música' : 'Estudo'}
            </h3>
            
            {/* Common Field: Title */}
            <label className="block text-xs text-bege-200 mb-1 font-bold">Título</label>
            <input 
              className="w-full bg-navy-900 border border-navy-600 p-3 rounded text-bege-100 mb-3 focus:border-ocre-500 outline-none" 
              placeholder={activeTab === RepertoireCategory.PIECE ? "Ex: Cisne Branco" : "Ex: Arban - Lição 1"}
              value={newItem.title || ''}
              onChange={e => setNewItem({...newItem, title: e.target.value})}
            />

            {/* Fields Specific to PIECE */}
            {activeTab === RepertoireCategory.PIECE && (
                <>
                    <label className="block text-xs text-bege-200 mb-1 font-bold">Compositor/Arranjador</label>
                    <input 
                    className="w-full bg-navy-900 border border-navy-600 p-3 rounded text-bege-100 mb-3 focus:border-ocre-500 outline-none" 
                    placeholder="Ex: John Williams"
                    value={newItem.composer || ''}
                    onChange={e => setNewItem({...newItem, composer: e.target.value})}
                    />
                    <label className="block text-xs text-bege-200 mb-1 font-bold">Tonalidade</label>
                    <input 
                    className="w-full bg-navy-900 border border-navy-600 p-3 rounded text-bege-100 mb-3 focus:border-ocre-500 outline-none" 
                    placeholder="Ex: Bb Major"
                    value={newItem.key || ''}
                    onChange={e => setNewItem({...newItem, key: e.target.value})}
                    />
                </>
            )}

            {/* Fields Specific to STUDY */}
            {activeTab === RepertoireCategory.STUDY && (
                <>
                    <label className="block text-xs text-bege-200 mb-1 font-bold">Foco Técnico</label>
                    <input 
                    className="w-full bg-navy-900 border border-navy-600 p-3 rounded text-bege-100 mb-3 focus:border-ocre-500 outline-none" 
                    placeholder="Ex: Articulação Dupla"
                    value={newItem.focus || ''}
                    onChange={e => setNewItem({...newItem, focus: e.target.value})}
                    />
                    <label className="block text-xs text-bege-200 mb-1 font-bold">Duração Estimada (Minutos)</label>
                    <input 
                    type="number"
                    className="w-full bg-navy-900 border border-navy-600 p-3 rounded text-bege-100 mb-3 focus:border-ocre-500 outline-none" 
                    placeholder="Ex: 20"
                    value={newItem.estimatedTime || ''}
                    onChange={e => setNewItem({...newItem, estimatedTime: parseInt(e.target.value)})}
                    />
                </>
            )}

            <label className="block text-xs text-bege-200 mb-1 font-bold">Dificuldade</label>
            <select 
              className="w-full bg-navy-900 border border-navy-600 p-3 rounded text-bege-100 mb-4 focus:border-ocre-500 outline-none"
              value={newItem.difficulty}
              onChange={e => setNewItem({...newItem, difficulty: e.target.value as any})}
            >
              <option value="Easy">Fácil</option>
              <option value="Medium">Médio</option>
              <option value="Hard">Difícil</option>
              <option value="Virtuoso">Virtuoso</option>
            </select>

            <label className="block text-xs text-bege-200 mb-2 font-bold flex items-center justify-between">
               <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Upload de PDF (Naipes)</span>
               {!hasFileAccess && <span className="text-[10px] text-red-400 font-bold uppercase animate-pulse">Permissão Necessária</span>}
            </label>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all mb-6 relative ${hasFileAccess ? 'border-navy-600 bg-navy-900/50 hover:border-ocre-500 cursor-pointer group' : 'border-red-900 bg-red-900/10 cursor-not-allowed'}`}
            >
                {!hasFileAccess && (
                   <div className="absolute inset-0 z-10 flex items-center justify-center bg-navy-950/80 backdrop-blur-[1px]">
                       <button onClick={requestAccess} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2 shadow-lg">
                           <FileLock className="w-4 h-4" /> Conceder Acesso
                       </button>
                   </div>
                )}

                <FileText className={`w-8 h-8 mx-auto mb-2 ${hasFileAccess ? 'text-navy-500 group-hover:text-ocre-500' : 'text-red-900'}`} />
                <p className="text-sm text-bege-200">Clique para selecionar arquivos do seu dispositivo</p>
                {/* Native File Input for System Access */}
                <input 
                    type="file" 
                    multiple 
                    accept=".pdf" 
                    disabled={!hasFileAccess}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                    onChange={(e) => {
                        if (e.target.files?.length) {
                            alert(`${e.target.files.length} arquivo(s) selecionado(s) para upload.`);
                        }
                    }}
                />
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-bege-200 hover:text-white">Cancelar</button>
              <button onClick={handleAddSubmit} className="flex-1 bg-ocre-600 py-3 rounded font-bold text-white hover:bg-ocre-500">Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
