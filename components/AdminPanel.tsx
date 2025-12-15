
import React, { useState } from 'react';
import { User, UserRole, NewsSource, EventItem, AttendanceStatus } from '../types';
import { CheckSquare, Square, Trash2, Plus, Globe, Shield, ExternalLink, AlertTriangle, Calendar, ChevronDown, ChevronUp, Users, Check, X, UserCheck, Lock, Unlock, Save, PieChart, Clock, UserMinus, UserPlus, Briefcase, Search, AlertCircle, Database, Download, Upload, RotateCcw, Edit } from 'lucide-react';

interface Props {
  currentUser: User;
  allUsers: User[];
  newsSources: NewsSource[];
  events: EventItem[];
  onAddNewsSource: (source: { name: string, url: string }) => void;
  onMarkAttendance: (eventId: string, userId: string, status: AttendanceStatus.PRESENT | AttendanceStatus.ABSENT) => void;
  onFinalize: (eventId: string) => void;
  onReopen: (eventId: string) => void;
  onMarkBatch: (eventId: string, userIds: string[], status: AttendanceStatus.PRESENT) => void;
  onToggleRole?: (userId: string) => void;
  onUpdateUserRole?: (userId: string, newRole: UserRole) => void;
}

type AdminTab = 'OPERATIONS' | 'DATABASE';

export const AdminPanel: React.FC<Props> = ({ 
  currentUser, 
  allUsers, 
  newsSources, 
  events, 
  onAddNewsSource, 
  onMarkAttendance,
  onFinalize,
  onReopen,
  onMarkBatch,
  onUpdateUserRole
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState<AdminTab>('OPERATIONS');

  // Local state for operations
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  
  // Role Management State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleForPromotion, setSelectedRoleForPromotion] = useState<UserRole | ''>('');
  
  // Fake "Saving" state for draft feedback
  const [isSaving, setIsSaving] = useState<string | null>(null);

  // Database Management State
  const [userEditId, setUserEditId] = useState<string | null>(null);
  const [dbSearch, setDbSearch] = useState('');

  const isGeneralManager = currentUser.role === UserRole.GENERAL_MANAGER;
  const isPeopleManager = [UserRole.PEOPLE_MANAGER_1, UserRole.PEOPLE_MANAGER_2].includes(currentUser.role);

  // Permission Gate: Allow GM OR People Manager
  if (!isGeneralManager && !isPeopleManager) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-bege-200">
            <Shield className="w-16 h-16 text-navy-600 mb-4" />
            <h2 className="text-xl font-serif">Área Restrita</h2>
            <p>Apenas Gestores (Geral e Pessoas) têm acesso a estas configurações.</p>
        </div>
      );
  }

  const EDIT_WINDOW_HOURS = 48;

  // --- ROLE DEFINITIONS ---
  const MANAGERIAL_ROLES = [
      { id: UserRole.AGENDA_MANAGER_1, label: 'Gestor de Agenda 1', desc: 'Cria eventos e ensaios' },
      { id: UserRole.AGENDA_MANAGER_2, label: 'Gestor de Agenda 2', desc: 'Auxilia na agenda' },
      { id: UserRole.WALL_MANAGER_1, label: 'Gestor do Mural 1', desc: 'Posta avisos oficiais' },
      { id: UserRole.WALL_MANAGER_2, label: 'Gestor do Mural 2', desc: 'Modera comunidade' },
      { id: UserRole.REPERTOIRE_MANAGER_1, label: 'Gestor de Repertório 1', desc: 'Organiza partituras' },
      { id: UserRole.REPERTOIRE_MANAGER_2, label: 'Gestor de Repertório 2', desc: 'Auxilia no arquivo' },
      { id: UserRole.PEOPLE_MANAGER_1, label: 'Gestor de Pessoas 1', desc: 'Controla frequência' },
      { id: UserRole.PEOPLE_MANAGER_2, label: 'Gestor de Pessoas 2', desc: 'Auxilia RH' },
  ];

  // --- DATABASE HELPERS ---
  const handleExportDB = () => {
      const data = {
          users: localStorage.getItem('bandSocial_users'),
          events: localStorage.getItem('bandSocial_events'),
          posts: localStorage.getItem('bandSocial_posts'),
          repertoire: localStorage.getItem('bandSocial_repertoire'),
          finances: localStorage.getItem('bandSocial_finances'),
          timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `band_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
  };

  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const data = JSON.parse(ev.target?.result as string);
              if (confirm("ATENÇÃO: Isso irá sobrescrever TODOS os dados atuais com o backup. Continuar?")) {
                  if(data.users) localStorage.setItem('bandSocial_users', data.users);
                  if(data.events) localStorage.setItem('bandSocial_events', data.events);
                  if(data.posts) localStorage.setItem('bandSocial_posts', data.posts);
                  if(data.repertoire) localStorage.setItem('bandSocial_repertoire', data.repertoire);
                  if(data.finances) localStorage.setItem('bandSocial_finances', data.finances);
                  alert("Banco de dados restaurado. A página será recarregada.");
                  window.location.reload();
              }
          } catch (err) {
              alert("Erro ao ler arquivo de backup. Formato inválido.");
          }
      };
      reader.readAsText(file);
  };

  const handleFactoryReset = () => {
      const phrase = "DELETAR TUDO";
      const input = prompt(`PERIGO: Isso apaga todo o histórico e restaura os dados de fábrica.\n\nDigite "${phrase}" para confirmar:`);
      if (input === phrase) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleDeleteUser = (userId: string) => {
      if (confirm("Tem certeza que deseja excluir este usuário permanentemente?")) {
          // Direct localStorage manipulation for critical deletion (simulating backend)
          const newUsers = allUsers.filter(u => u.id !== userId);
          localStorage.setItem('bandSocial_users', JSON.stringify(newUsers));
          window.location.reload(); // Force refresh to sync
      }
  };

  // --- EXISTING HANDLERS ---
  const handleUpdateRole = (userId: string, newRole: UserRole) => {
      if (onUpdateUserRole) {
          onUpdateUserRole(userId, newRole);
          setSearchQuery(''); 
          setSelectedRoleForPromotion('');
      }
  };

  const handleDemote = (e: React.MouseEvent, user: User) => {
      e.stopPropagation(); 
      if (window.confirm(`Remover ${user.name} do cargo de gestor?`)) {
          handleUpdateRole(user.id, UserRole.MEMBER);
      }
  };

  const searchResults = searchQuery 
    ? allUsers.filter(u => 
        u.role !== UserRole.GENERAL_MANAGER && 
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const emptyRoles = MANAGERIAL_ROLES.filter(role => !allUsers.some(u => u.role === role.id));

  const handleAddSource = () => {
      if (!sourceName || !sourceUrl) return;
      onAddNewsSource({ name: sourceName, url: sourceUrl });
      setSourceName('');
      setSourceUrl('');
  };

  const handleSaveDraft = (eventId: string) => {
     setIsSaving(eventId);
     setTimeout(() => {
        setIsSaving(null);
        alert("Rascunho salvo localmente.");
     }, 800);
  };

  const handleFinalize = (event: EventItem) => {
     if(window.confirm(`Finalizar Lista de Presença?`)) {
        onFinalize(event.id);
        setExpandedEventId(null);
     }
  };

  const handleReopen = (event: EventItem) => {
     if(window.confirm("Reabrir para edição?")) {
        onReopen(event.id);
        setExpandedEventId(event.id);
     }
  };

  const handleBatchPresent = (event: EventItem) => {
      const targets = event.attendees.filter(a => a.status === AttendanceStatus.CONFIRMED).map(a => a.userId);
      if (targets.length === 0) return alert("Todos os confirmados já estão presentes.");
      if (window.confirm(`Marcar ${targets.length} usuários como PRESENTES?`)) {
          onMarkBatch(event.id, targets, AttendanceStatus.PRESENT);
      }
  };

  const sortedEvents = [...events].sort((a, b) => b.date - a.date);

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-24 animate-fade-in">
      
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-navy-800 rounded-lg shadow border border-navy-700">
                <Shield className="w-6 h-6 text-ocre-500" />
            </div>
            <div>
                <h2 className="text-2xl font-serif text-bege-50">Painel Administrativo</h2>
                <p className="text-xs text-bege-200 uppercase tracking-wide font-bold">
                    {isGeneralManager ? 'Acesso Total' : 'Gestão de Pessoas'}
                </p>
            </div>
          </div>
      </div>

      {/* ADMIN TABS */}
      <div className="flex bg-navy-800 p-1 rounded-xl border border-navy-700">
          <button 
            onClick={() => setActiveTab('OPERATIONS')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'OPERATIONS' ? 'bg-navy-900 text-ocre-500 shadow-md border border-navy-600' : 'text-bege-200 hover:text-white'}`}
          >
              <Briefcase className="w-4 h-4" /> Gestão Operacional
          </button>
          {isGeneralManager && (
            <button 
                onClick={() => setActiveTab('DATABASE')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'DATABASE' ? 'bg-navy-900 text-ocre-500 shadow-md border border-navy-600' : 'text-bege-200 hover:text-white'}`}
            >
                <Database className="w-4 h-4" /> Banco de Dados
            </button>
          )}
      </div>

      {/* --- TAB 1: OPERATIONS (EXISTING) --- */}
      {activeTab === 'OPERATIONS' && (
        <div className="space-y-8 animate-slide-up">
            {/* 1. Gestão de Cargos Card (GM ONLY) */}
            {isGeneralManager && (
                <div className="bg-bege-100 rounded-xl shadow-xl overflow-hidden border border-bege-200">
                    <div className="p-6 border-b border-gray-200 bg-white/50">
                        <h3 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                            Quadro de Gestores <span className="text-xs font-normal text-gray-500 uppercase tracking-wide">(Gestor Geral)</span>
                        </h3>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 max-h-[320px] overflow-y-auto custom-scrollbar border-b border-gray-200">
                        {MANAGERIAL_ROLES.map(role => {
                            const occupant = allUsers.find(u => u.role === role.id);
                            return (
                                <div key={role.id} className={`rounded-lg border p-3 flex flex-col justify-between ${occupant ? 'bg-white border-gray-200' : 'bg-gray-100 border-dashed border-gray-300'}`}>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{role.label}</p>
                                        {occupant ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold">
                                                    {occupant.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-navy-900 text-sm leading-tight">{occupant.nickname}</p>
                                                    <p className="text-[10px] text-gray-500">{occupant.name.split(' ')[0]}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-400 py-1">
                                                <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center"><UserPlus className="w-4 h-4" /></div>
                                                <span className="text-xs font-bold uppercase tracking-wide">Cargo Vago</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                                        {occupant ? (
                                            <button onClick={(e) => handleDemote(e, occupant)} className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded">
                                                <UserMinus className="w-3 h-3" /> Destituir
                                            </button>
                                        ) : (
                                            <button onClick={() => { setSearchQuery(''); document.getElementById('promo-search')?.focus(); }} className="text-ocre-600 hover:text-ocre-700 text-xs font-bold flex items-center gap-1 hover:bg-ocre-50 px-2 py-1 rounded">
                                                <Plus className="w-3 h-3" /> Preencher
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Banco de Talentos</label>
                            <span className="text-[10px] text-ocre-600 bg-ocre-50 px-2 py-0.5 rounded-full border border-ocre-100 font-bold">{emptyRoles.length} Vagas Abertas</span>
                        </div>
                        <div className="relative mb-4">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input id="promo-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar membro..." className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:border-ocre-500 text-navy-900" />
                        </div>
                        {searchQuery && (
                            <div className="max-h-48 overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg">
                                {searchResults.map(user => {
                                    const isManager = user.role !== UserRole.MEMBER;
                                    return (
                                        <div key={user.id} className="p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-bold">{user.name.charAt(0)}</div>
                                                    <span className="text-sm font-bold text-navy-900">{user.name}</span>
                                                </div>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isManager ? 'bg-ocre-100 text-ocre-700' : 'bg-gray-200 text-gray-500'}`}>{isManager ? 'Já é Gestor' : 'Membro'}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <select className="flex-1 bg-white border border-gray-300 text-xs rounded p-1.5 outline-none text-navy-900" value={selectedRoleForPromotion} onChange={(e) => setSelectedRoleForPromotion(e.target.value as UserRole)}>
                                                    <option value="">Selecione...</option>
                                                    {emptyRoles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                                </select>
                                                <button onClick={() => { if(!selectedRoleForPromotion) return; handleUpdateRole(user.id, selectedRoleForPromotion as UserRole); }} disabled={!selectedRoleForPromotion} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 disabled:bg-gray-300"><Check className="w-3 h-3" /> Salvar</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 2. Controle de Frequência */}
            <div className="bg-bege-100 rounded-xl shadow-xl overflow-hidden border border-bege-200">
                <div className="p-6 border-b border-gray-200 bg-white/50">
                    <h3 className="text-xl font-bold text-navy-900 flex items-center gap-2">Listas de Presença</h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {sortedEvents.map(event => {
                        const isExpanded = expandedEventId === event.id;
                        const confirmedCount = event.attendees.filter(a => a.status === AttendanceStatus.CONFIRMED || a.status === AttendanceStatus.PRESENT).length;
                        const presentCount = event.attendees.filter(a => a.status === AttendanceStatus.PRESENT).length;
                        const isFinalized = event.attendanceFinalized;
                        const canReopen = isGeneralManager; 

                        return (
                            <div key={event.id} className="bg-white/30">
                                <div onClick={() => setExpandedEventId(isExpanded ? null : event.id)} className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isFinalized ? 'bg-gray-50' : 'hover:bg-white'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${isFinalized ? 'bg-gray-200 border-gray-400 text-gray-500' : 'bg-navy-100 border-navy-200 text-navy-800'}`}>
                                            {isFinalized ? <Lock className="w-5 h-5"/> : <><span className="text-[10px] font-bold uppercase">{new Date(event.date).toLocaleString('pt-BR',{month:'short'}).replace('.','')}</span><span className="text-lg font-bold leading-none">{new Date(event.date).getDate()}</span></>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-navy-900 text-sm flex items-center gap-2">{event.title} {isFinalized && <span className="text-[9px] px-1.5 rounded uppercase border bg-red-100 text-red-800 border-red-200">Fechado</span>}</h4>
                                            <p className="text-[11px] text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3"/> {event.timeStr} • {event.eventType}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {isFinalized && canReopen && <button onClick={(e) => { e.stopPropagation(); handleReopen(event); }} className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-3 py-2 rounded border border-yellow-300 flex items-center gap-1"><Unlock className="w-3 h-3"/> Reabrir</button>}
                                        <div className="text-right hidden sm:block"><span className="text-lg font-bold text-navy-800">{presentCount}<span className="text-gray-400 text-sm">/{confirmedCount}</span></span></div>
                                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="bg-gray-50 p-4 border-t border-gray-200">
                                        <div className="flex flex-wrap gap-2 mb-4 p-2 bg-white rounded border border-gray-200">
                                            {!isFinalized ? (
                                                <>
                                                    <button onClick={() => handleSaveDraft(event.id)} className="flex-1 py-2 px-3 bg-navy-100 hover:bg-navy-200 text-navy-800 rounded text-xs font-bold flex items-center justify-center gap-2">{isSaving === event.id ? 'Salvando...' : <><Save className="w-3 h-3"/> Rascunho</>}</button>
                                                    <button onClick={() => handleBatchPresent(event)} className="flex-1 py-2 px-3 bg-ocre-100 hover:bg-ocre-200 text-ocre-800 rounded text-xs font-bold flex items-center justify-center gap-2"><CheckSquare className="w-3 h-3"/> Todos Presentes</button>
                                                    <button onClick={() => handleFinalize(event)} className="flex-1 py-2 px-3 bg-navy-800 hover:bg-navy-900 text-white rounded text-xs font-bold flex items-center justify-center gap-2"><Lock className="w-3 h-3"/> Finalizar</button>
                                                </>
                                            ) : (
                                                <div className="w-full text-center text-xs text-red-500 italic py-2 bg-red-50 rounded border border-red-100">Edição bloqueada.</div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {event.attendees.filter(a => a.status !== AttendanceStatus.DECLINED).map(record => {
                                                const user = allUsers.find(u => u.id === record.userId);
                                                if (!user) return null;
                                                return (
                                                    <div key={record.userId} className="flex items-center justify-between bg-white p-3 rounded border shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${record.status === AttendanceStatus.PRESENT ? 'bg-green-500' : record.status === AttendanceStatus.ABSENT ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                                            <div className="flex flex-col"><span className="text-sm font-bold text-navy-900">{user.name}</span><span className="text-[10px] text-gray-500 uppercase">{user.instrument}</span></div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button disabled={isFinalized} onClick={() => onMarkAttendance(event.id, user.id, AttendanceStatus.PRESENT)} className={`p-1.5 rounded border ${record.status === AttendanceStatus.PRESENT ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-green-50'}`}><Check className="w-4 h-4" /></button>
                                                            <button disabled={isFinalized} onClick={() => onMarkAttendance(event.id, user.id, AttendanceStatus.ABSENT)} className={`p-1.5 rounded border ${record.status === AttendanceStatus.ABSENT ? 'bg-red-100 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-red-50'}`}><X className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. Fontes de Notícias (GM ONLY) */}
            {isGeneralManager && (
                <div className="bg-bege-100 rounded-xl shadow-xl overflow-hidden border border-bege-200">
                    <div className="p-6 border-b border-gray-200 bg-white/50">
                        <h3 className="text-xl font-bold text-navy-900 flex items-center gap-2">Fontes de Notícias</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex gap-2">
                            <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="Nome" className="flex-1 bg-white border border-gray-300 p-3 rounded-lg text-navy-900 text-sm focus:border-ocre-500 outline-none placeholder-gray-400 font-bold" />
                            <button onClick={handleAddSource} className="bg-ocre-600 hover:bg-ocre-700 text-white font-bold px-6 py-2 rounded-lg text-xs tracking-widest uppercase shadow-lg">CADASTRAR</button>
                        </div>
                        <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="URL" className="w-full bg-white border border-gray-300 p-3 rounded-lg text-navy-900 text-sm focus:border-ocre-500 outline-none" />
                        <div className="space-y-2 mt-4">
                            {newsSources.map(source => (
                                <div key={source.id} className="grid grid-cols-12 gap-2 items-center text-sm p-2 hover:bg-white rounded transition-colors border-b border-gray-100">
                                    <div className="col-span-8 font-bold text-navy-900 truncate flex items-center gap-2"><Globe className="w-3 h-3 text-ocre-500" /> {source.name}</div>
                                    <div className="col-span-4 text-right"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${source.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700'}`}>{source.status}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* --- TAB 2: DATABASE (NEW) --- */}
      {activeTab === 'DATABASE' && (
          <div className="space-y-8 animate-slide-up">
              
              {/* BACKUP & RESTORE */}
              <div className="bg-navy-800 rounded-xl border border-navy-700 p-6 flex flex-col md:flex-row gap-6 justify-between items-center">
                  <div>
                      <h3 className="text-xl font-bold text-bege-50 flex items-center gap-2">
                          <Database className="w-5 h-5 text-ocre-500" /> Manutenção do Sistema
                      </h3>
                      <p className="text-sm text-bege-200/60 mt-1">
                          Faça backups regulares para garantir a segurança dos dados.
                      </p>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={handleExportDB} className="bg-navy-700 hover:bg-navy-600 text-bege-100 px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-navy-600 transition-colors">
                          <Download className="w-4 h-4" /> Backup (JSON)
                      </button>
                      <label className="bg-navy-700 hover:bg-navy-600 text-bege-100 px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-navy-600 transition-colors cursor-pointer">
                          <Upload className="w-4 h-4" /> Restaurar
                          <input type="file" accept=".json" className="hidden" onChange={handleImportDB} />
                      </label>
                      <button onClick={handleFactoryReset} className="bg-red-900/50 hover:bg-red-900 text-red-200 px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-red-800 transition-colors">
                          <RotateCcw className="w-4 h-4" /> Resetar Tudo
                      </button>
                  </div>
              </div>

              {/* USER DATABASE TABLE */}
              <div className="bg-bege-100 rounded-xl shadow-xl overflow-hidden border border-bege-200">
                  <div className="p-4 border-b border-gray-200 bg-white/50 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-navy-900">Banco de Dados: Usuários</h3>
                      <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            value={dbSearch}
                            onChange={(e) => setDbSearch(e.target.value)}
                            placeholder="Filtrar por nome..." 
                            className="w-full bg-white border border-gray-300 rounded-full py-1.5 pl-9 pr-4 text-sm text-navy-900 outline-none focus:border-ocre-500"
                          />
                      </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-600">
                          <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                              <tr>
                                  <th className="p-4">Nome / Nick</th>
                                  <th className="p-4">Cargo</th>
                                  <th className="p-4">Inst/XP</th>
                                  <th className="p-4">Docs</th>
                                  <th className="p-4 text-right">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {allUsers
                                .filter(u => u.name.toLowerCase().includes(dbSearch.toLowerCase()) || u.nickname.toLowerCase().includes(dbSearch.toLowerCase()))
                                .map(user => (
                                  <tr key={user.id} className="hover:bg-white transition-colors">
                                      <td className="p-4">
                                          <p className="font-bold text-navy-900">{user.name}</p>
                                          <p className="text-xs text-ocre-600">@{user.nickname}</p>
                                          <p className="text-[10px] text-gray-400">{user.email || 'Sem email'}</p>
                                      </td>
                                      <td className="p-4">
                                          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-[10px] font-bold uppercase">{user.role.replace('MANAGER', 'MGR')}</span>
                                      </td>
                                      <td className="p-4">
                                          <p>{user.instrument}</p>
                                          <p className="text-xs font-mono text-gray-400">Lvl {user.level} ({user.xp} XP)</p>
                                      </td>
                                      <td className="p-4 text-xs font-mono text-gray-500">
                                          <p>CPF: {user.cpf}</p>
                                          <p>RG: {user.rg}</p>
                                      </td>
                                      <td className="p-4 text-right space-x-2">
                                          <button 
                                            onClick={() => alert("Funcionalidade de edição detalhada virá na próxima atualização.")}
                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                                            title="Editar Dados"
                                          >
                                              <Edit className="w-4 h-4" />
                                          </button>
                                          {user.role !== UserRole.GENERAL_MANAGER && (
                                              <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-red-600 hover:bg-red-50 p-2 rounded"
                                                title="Deletar Usuário"
                                              >
                                                  <Trash2 className="w-4 h-4" />
                                              </button>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

          </div>
      )}

    </div>
  );
};
