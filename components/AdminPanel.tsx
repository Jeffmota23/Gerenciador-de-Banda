
import React, { useState } from 'react';
import { User, UserRole, NewsSource, EventItem, AttendanceStatus } from '../types';
import { CheckSquare, Square, Trash2, Plus, Globe, Shield, ExternalLink, AlertTriangle, Calendar, ChevronDown, ChevronUp, Users, Check, X, UserCheck, Lock, Unlock, Save, PieChart, Clock, UserMinus, UserPlus, Briefcase, Search, AlertCircle } from 'lucide-react';

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
  // Local state for the form
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  
  // Role Management State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleForPromotion, setSelectedRoleForPromotion] = useState<UserRole | ''>('');
  
  // Fake "Saving" state for draft feedback
  const [isSaving, setIsSaving] = useState<string | null>(null);

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

  const handleUpdateRole = (userId: string, newRole: UserRole) => {
      if (onUpdateUserRole) {
          onUpdateUserRole(userId, newRole);
          // Clear search states to reset view
          setSearchQuery(''); 
          setSelectedRoleForPromotion('');
      } else {
          console.error("onUpdateUserRole function missing");
      }
  };

  const handleDemote = (e: React.MouseEvent, user: User) => {
      e.stopPropagation(); // Prevent card clicks if any
      
      const confirmMsg = `ATENÇÃO: Você está prestes a remover ${user.name} do cargo de gestor.\n\nA posição ficará VAGA imediatamente e poderá ser preenchida por outro membro.\n\nDeseja confirmar a destituição?`;
      
      if (window.confirm(confirmMsg)) {
          handleUpdateRole(user.id, UserRole.MEMBER);
      }
  };

  // Search logic for promotion
  const searchResults = searchQuery 
    ? allUsers.filter(u => 
        u.role !== UserRole.GENERAL_MANAGER && // Cannot edit GM here
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Identify Empty Slots for badge count
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
        alert("Rascunho salvo localmente. Você pode continuar a edição depois.");
     }, 800);
  };

  const handleFinalize = (event: EventItem) => {
     const confirm = window.confirm(`Finalizar Lista de Presença?\n\nATENÇÃO:\n1. A lista será bloqueada para Gestores de Pessoas imediatamente.\n2. Apenas o Gestor Geral poderá reabrir para correções nas próximas ${EDIT_WINDOW_HOURS} horas.`);
     if(confirm) {
        onFinalize(event.id);
        setExpandedEventId(null); // Close the list immediately upon finalizing
     }
  };

  const handleReopen = (event: EventItem) => {
     const confirm = window.confirm("Reabrir para edição?\n\nIsso permitirá ajustes de presença.");
     if(confirm) {
        onReopen(event.id);
        setExpandedEventId(event.id); // Auto-expand when reopening
     }
  };

  const handleBatchPresent = (event: EventItem) => {
      // Get all confirmed users who are not yet marked as present
      const targets = event.attendees
        .filter(a => a.status === AttendanceStatus.CONFIRMED)
        .map(a => a.userId);
      
      if (targets.length === 0) {
          alert("Todos os confirmados já estão marcados como presentes.");
          return;
      }

      const confirm = window.confirm(`Marcar ${targets.length} usuários como PRESENTES de uma vez?`);
      if (confirm) {
          onMarkBatch(event.id, targets, AttendanceStatus.PRESENT);
      }
  };

  // Sort events by date (newest first)
  const sortedEvents = [...events].sort((a, b) => b.date - a.date);

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-24 animate-fade-in">
      
      <div className="flex items-center gap-3 mb-6">
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

      {/* 1. Gestão de Cargos Card (GM ONLY - SLOT BASED) */}
      {isGeneralManager && (
        <div className="bg-bege-100 rounded-xl shadow-xl overflow-hidden border border-bege-200">
            <div className="p-6 border-b border-gray-200 bg-white/50">
                <h3 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                    Quadro de Gestores <span className="text-xs font-normal text-gray-500 uppercase tracking-wide">(Gestor Geral)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">Gerencie quem ocupa cada cadeira de liderança.</p>
            </div>
            
            {/* SLOTS GRID */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 max-h-[320px] overflow-y-auto custom-scrollbar border-b border-gray-200">
                {MANAGERIAL_ROLES.map(role => {
                    const occupant = allUsers.find(u => u.role === role.id);
                    
                    return (
                        <div key={role.id} className={`rounded-lg border p-3 flex flex-col justify-between transition-colors ${occupant ? 'bg-white border-gray-200' : 'bg-gray-100 border-dashed border-gray-300'}`}>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{role.label}</p>
                                {occupant ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                            {occupant.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-navy-900 text-sm leading-tight">{occupant.nickname}</p>
                                            <p className="text-[10px] text-gray-500">{occupant.name.split(' ')[0]}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-400 py-1">
                                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                                            <UserPlus className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wide">Cargo Vago</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                                {occupant ? (
                                    <button 
                                        onClick={(e) => handleDemote(e, occupant)}
                                        className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                    >
                                        <UserMinus className="w-3 h-3" /> Destituir
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            setSearchQuery('');
                                            document.getElementById('promo-search')?.focus();
                                        }}
                                        className="text-ocre-600 hover:text-ocre-700 text-xs font-bold flex items-center gap-1 hover:bg-ocre-50 px-2 py-1 rounded transition-colors"
                                    >
                                        <Plus className="w-3 h-3" /> Preencher
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* PROMOTION / SEARCH AREA */}
            <div className="p-4 bg-white">
                 <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Banco de Talentos</label>
                    <span className="text-[10px] text-ocre-600 bg-ocre-50 px-2 py-0.5 rounded-full border border-ocre-100 font-bold">
                        {emptyRoles.length} Vagas Abertas
                    </span>
                 </div>
                 
                 <div className="relative mb-4">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        id="promo-search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar membro para promover..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:border-ocre-500 text-navy-900 transition-colors focus:bg-white"
                    />
                 </div>

                 {/* SEARCH RESULTS */}
                 {searchQuery && (
                     <div className="max-h-48 overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg">
                        {searchResults.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-xs italic">Nenhum membro encontrado.</div>
                        ) : (
                            searchResults.map(user => {
                                const isManager = user.role !== UserRole.MEMBER;
                                return (
                                    <div key={user.id} className="p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-navy-900">{user.name}</span>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isManager ? 'bg-ocre-100 text-ocre-700' : 'bg-gray-200 text-gray-500'}`}>
                                                {isManager ? 'Já é Gestor' : 'Membro'}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <select 
                                                className="flex-1 bg-white border border-gray-300 text-xs rounded p-1.5 outline-none focus:border-ocre-500 text-navy-900"
                                                value={selectedRoleForPromotion}
                                                onChange={(e) => setSelectedRoleForPromotion(e.target.value as UserRole)}
                                            >
                                                <option value="">Selecione uma vaga...</option>
                                                {/* Show empty roles first, then others if we want to allow swapping (but swapping is complex, lets stick to filling) */}
                                                {emptyRoles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                                <option disabled>──────────</option>
                                                {/* Show occupied roles disabled or enabled for swap? Let's just show available for clarity as requested */}
                                                {MANAGERIAL_ROLES.filter(r => !emptyRoles.includes(r)).map(r => (
                                                    <option key={r.id} value={r.id} disabled>{r.label} (Ocupado)</option>
                                                ))}
                                            </select>
                                            <button 
                                                onClick={() => {
                                                    if(!selectedRoleForPromotion) return alert("Selecione um cargo para promover.");
                                                    handleUpdateRole(user.id, selectedRoleForPromotion as UserRole);
                                                }}
                                                disabled={!selectedRoleForPromotion}
                                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                                            >
                                                <Check className="w-3 h-3" /> Salvar
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                     </div>
                 )}
            </div>
        </div>
      )}

      {/* 2. Controle de Frequência (GM & PEOPLE MANAGER) */}
      <div className="bg-bege-100 rounded-xl shadow-xl overflow-hidden border border-bege-200">
          <div className="p-6 border-b border-gray-200 bg-white/50">
             <h3 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                 Listas de Presença <span className="text-xs font-normal text-gray-500 uppercase tracking-wide">(Gestão de Pessoas)</span>
             </h3>
             <p className="text-xs text-gray-500 mt-1">Gerencie a frequência de cada evento criado na agenda.</p>
          </div>

          <div className="divide-y divide-gray-200">
             {sortedEvents.length === 0 ? (
                 <div className="p-8 text-center text-gray-400 italic">Nenhum evento na agenda.</div>
             ) : (
                 sortedEvents.map(event => {
                     const isExpanded = expandedEventId === event.id;
                     const confirmedCount = event.attendees.filter(a => a.status === AttendanceStatus.CONFIRMED || a.status === AttendanceStatus.PRESENT).length;
                     const presentCount = event.attendees.filter(a => a.status === AttendanceStatus.PRESENT).length;
                     const eventDate = new Date(event.date);
                     const isPast = Date.now() > event.date;
                     const isFinalized = event.attendanceFinalized;
                     
                     // 48 Hours Edit Window Logic for General Manager
                     const timeSinceFinalized = isFinalized && event.attendanceFinalizedAt ? Date.now() - event.attendanceFinalizedAt : 0;
                     const isWithinTimeLimit = timeSinceFinalized < (EDIT_WINDOW_HOURS * 60 * 60 * 1000);
                     const hoursLeft = isFinalized ? Math.max(0, EDIT_WINDOW_HOURS - Math.floor(timeSinceFinalized / (1000 * 60 * 60))) : 0;

                     // Strict Rule: 
                     // 1. If finalized, ONLY General Manager can reopen.
                     // 2. AND only if within 48 hours.
                     const canReopen = isGeneralManager && isWithinTimeLimit;

                     return (
                         <div key={event.id} className="bg-white/30">
                             <div 
                                onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isFinalized ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-white'}`}
                             >
                                 <div className="flex items-center gap-3">
                                     <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${isFinalized ? 'bg-gray-200 border-gray-400 text-gray-500' : isPast ? 'bg-gray-100 border-gray-300 text-gray-500' : 'bg-navy-100 border-navy-200 text-navy-800'}`}>
                                         {isFinalized ? <Lock className="w-5 h-5"/> : (
                                            <>
                                                <span className="text-[10px] font-bold uppercase">{eventDate.toLocaleString('pt-BR', { month: 'short' }).replace('.','')}</span>
                                                <span className="text-lg font-bold leading-none">{eventDate.getDate()}</span>
                                            </>
                                         )}
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-navy-900 text-sm flex items-center gap-2">
                                            {event.title}
                                            {isFinalized && (
                                                <span className={`text-[9px] px-1.5 rounded uppercase border ${isWithinTimeLimit ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                                                    {isWithinTimeLimit 
                                                      ? (isGeneralManager ? `Editável (${hoursLeft}h)` : 'Fechado') 
                                                      : 'Permanente'}
                                                </span>
                                            )}
                                         </h4>
                                         <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                             <Calendar className="w-3 h-3"/> {event.timeStr} • {event.eventType}
                                         </p>
                                     </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-4">
                                     {isFinalized && canReopen && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReopen(event);
                                            }}
                                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-[10px] font-bold px-3 py-2 rounded border border-yellow-300 transition-colors flex items-center gap-1 shadow-sm animate-fade-in"
                                        >
                                            <Unlock className="w-3 h-3" />
                                            <span className="hidden sm:inline">Editar ({hoursLeft}h)</span>
                                            <span className="sm:hidden">Editar</span>
                                        </button>
                                     )}

                                     <div className="text-right hidden sm:block">
                                         <span className="text-lg font-bold text-navy-800">{presentCount}<span className="text-gray-400 text-sm">/{confirmedCount}</span></span>
                                         <p className="text-[9px] uppercase font-bold text-gray-400">Presentes</p>
                                     </div>
                                     {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                 </div>
                             </div>

                             {isExpanded && (
                                 <div className="bg-gray-50 p-4 border-t border-gray-200 shadow-inner">
                                     
                                     {/* Control Bar */}
                                     <div className="flex flex-wrap gap-2 mb-4 p-2 bg-white rounded border border-gray-200">
                                         {!isFinalized ? (
                                             <>
                                                <button 
                                                    onClick={() => handleSaveDraft(event.id)}
                                                    className="flex-1 py-2 px-3 bg-navy-100 hover:bg-navy-200 text-navy-800 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    {isSaving === event.id ? 'Salvando...' : <><Save className="w-3 h-3"/> Salvar Rascunho</>}
                                                </button>
                                                <button 
                                                    onClick={() => handleBatchPresent(event)}
                                                    className="flex-1 py-2 px-3 bg-ocre-100 hover:bg-ocre-200 text-ocre-800 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <CheckSquare className="w-3 h-3"/> Marcar Todos Presentes
                                                </button>
                                                <button 
                                                    onClick={() => handleFinalize(event)}
                                                    className="flex-1 py-2 px-3 bg-navy-800 hover:bg-navy-900 text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                                >
                                                    <Lock className="w-3 h-3"/> Finalizar Lista
                                                </button>
                                             </>
                                         ) : (
                                             canReopen ? (
                                                 <button 
                                                    onClick={() => handleReopen(event)}
                                                    className="w-full py-2 px-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-yellow-300"
                                                >
                                                    <Unlock className="w-3 h-3"/> Reabrir Edição (Restam {hoursLeft}h)
                                                </button>
                                             ) : (
                                                <div className="w-full text-center text-xs text-red-500 italic py-2 flex items-center justify-center gap-2 bg-red-50 rounded border border-red-100">
                                                    <Lock className="w-3 h-3"/> 
                                                    {isGeneralManager && !isWithinTimeLimit 
                                                        ? "Prazo de 48h para edição expirado."
                                                        : "Edição bloqueada. Apenas Gestor Geral pode reabrir."}
                                                </div>
                                             )
                                         )}
                                     </div>

                                     {/* Progress Bar */}
                                     <div className="mb-4">
                                         <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-bold uppercase">
                                             <span>Quórum</span>
                                             <span>{confirmedCount > 0 ? Math.round((presentCount / confirmedCount) * 100) : 0}%</span>
                                         </div>
                                         <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                             <div 
                                                className="h-full bg-green-500 transition-all duration-500"
                                                style={{ width: `${confirmedCount > 0 ? (presentCount / confirmedCount) * 100 : 0}%` }}
                                             ></div>
                                         </div>
                                     </div>

                                     <div className="grid grid-cols-1 gap-2">
                                         {event.attendees.filter(a => a.status !== AttendanceStatus.DECLINED).length === 0 ? (
                                             <p className="text-center text-xs text-gray-400 py-2">Nenhum membro confirmou presença ainda.</p>
                                         ) : (
                                             event.attendees
                                                .filter(a => a.status !== AttendanceStatus.DECLINED)
                                                .map(record => {
                                                 const user = allUsers.find(u => u.id === record.userId);
                                                 if (!user) return null;
                                                 
                                                 return (
                                                     <div key={record.userId} className={`flex items-center justify-between bg-white p-3 rounded border shadow-sm transition-opacity ${isFinalized ? 'opacity-70 border-gray-100' : 'border-gray-200'}`}>
                                                         <div className="flex items-center gap-3">
                                                             <div className={`w-2 h-2 rounded-full ${
                                                                 record.status === AttendanceStatus.PRESENT ? 'bg-green-500' : 
                                                                 record.status === AttendanceStatus.ABSENT ? 'bg-red-500' : 
                                                                 'bg-gray-300'
                                                             }`}></div>
                                                             <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-navy-900">{user.name}</span>
                                                                <span className="text-[10px] text-gray-500 uppercase">{user.instrument}</span>
                                                                {record.cancellationReason && (
                                                                    <span className="text-[10px] text-red-500 italic mt-0.5">Motivo: {record.cancellationReason}</span>
                                                                )}
                                                             </div>
                                                         </div>

                                                         <div className="flex gap-2">
                                                              <button 
                                                                disabled={isFinalized}
                                                                onClick={() => onMarkAttendance(event.id, user.id, AttendanceStatus.PRESENT)}
                                                                className={`p-1.5 rounded border transition-colors ${record.status === AttendanceStatus.PRESENT ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600'} ${isFinalized ? 'cursor-not-allowed' : ''}`}
                                                                title="Presente"
                                                              >
                                                                  <Check className="w-4 h-4" />
                                                              </button>
                                                              <button 
                                                                disabled={isFinalized}
                                                                onClick={() => onMarkAttendance(event.id, user.id, AttendanceStatus.ABSENT)}
                                                                className={`p-1.5 rounded border transition-colors ${record.status === AttendanceStatus.ABSENT ? 'bg-red-100 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600'} ${isFinalized ? 'cursor-not-allowed' : ''}`}
                                                                title="Marcar Falta"
                                                              >
                                                                  <X className="w-4 h-4" />
                                                              </button>
                                                         </div>
                                                     </div>
                                                 );
                                             })
                                         )}
                                     </div>
                                 </div>
                             )}
                         </div>
                     );
                 })
             )}
          </div>
      </div>

      {/* 3. Fontes de Notícias por IA Card (GM ONLY) */}
      {isGeneralManager && (
        <div className="bg-bege-100 rounded-xl shadow-xl overflow-hidden border border-bege-200">
            <div className="p-6 border-b border-gray-200 bg-white/50">
                <h3 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                    Fontes de Notícias por IA <span className="text-xs font-normal text-gray-500 uppercase tracking-wide">(Mural)</span>
                </h3>
            </div>

            <div className="p-6 space-y-4">
                <div className="flex gap-2">
                    <input 
                        value={sourceName}
                        onChange={(e) => setSourceName(e.target.value)}
                        placeholder="Nome da Fonte"
                        className="flex-1 bg-white border border-gray-300 p-3 rounded-lg text-navy-900 text-sm focus:border-ocre-500 outline-none placeholder-gray-400 font-bold"
                    />
                    <button 
                        onClick={handleAddSource}
                        className="bg-ocre-600 hover:bg-ocre-700 text-white font-bold px-6 py-2 rounded-lg text-xs tracking-widest uppercase shadow-lg transition-transform active:scale-95"
                    >
                        CADASTRAR
                    </button>
                </div>
                
                <input 
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="Link do Site/Perfil (ex: instagram.com/banda)"
                    className="w-full bg-white border border-gray-300 p-3 rounded-lg text-navy-900 text-sm focus:border-ocre-500 outline-none placeholder-gray-400"
                />

                {/* List */}
                <div className="space-y-2 mt-4">
                    {newsSources.map(source => (
                        <div key={source.id} className="grid grid-cols-12 gap-2 items-center text-sm p-2 hover:bg-white rounded transition-colors border-b border-gray-100 last:border-0">
                            <div className="col-span-8 font-bold text-navy-900 truncate flex items-center gap-2">
                                <Globe className="w-3 h-3 text-ocre-500" /> {source.name}
                            </div>
                            <div className="col-span-4 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    source.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700'
                                }`}>
                                    {source.status === 'ACTIVE' ? 'Ativo' : 'Erro'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
