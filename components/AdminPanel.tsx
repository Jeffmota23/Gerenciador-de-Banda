
import React, { useState } from 'react';
import { User, UserRole, NewsSource, EventItem, AttendanceStatus } from '../types';
import { CheckSquare, Square, Trash2, Plus, Globe, Shield, ExternalLink, AlertTriangle, Calendar, ChevronDown, ChevronUp, Users, Check, X, UserCheck } from 'lucide-react';

interface Props {
  currentUser: User;
  allUsers: User[];
  newsSources: NewsSource[];
  events: EventItem[];
  onAddNewsSource: (source: { name: string, url: string }) => void;
  onMarkAttendance: (eventId: string, userId: string, status: AttendanceStatus.PRESENT | AttendanceStatus.ABSENT) => void;
  onToggleRole?: (userId: string) => void;
}

export const AdminPanel: React.FC<Props> = ({ 
  currentUser, 
  allUsers, 
  newsSources, 
  events, 
  onAddNewsSource, 
  onMarkAttendance,
  onToggleRole 
}) => {
  // Local state for the form
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

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

  const handleAddSource = () => {
      if (!sourceName || !sourceUrl) return;
      onAddNewsSource({ name: sourceName, url: sourceUrl });
      setSourceName('');
      setSourceUrl('');
  };

  // Sort users to put Managers first
  const sortedUsers = [...allUsers].sort((a, b) => {
      const roleScore = (role: string) => role === UserRole.MEMBER ? 0 : 1;
      return roleScore(b.role) - roleScore(a.role);
  });

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

      {/* 1. Gestão de Cargos Card (GM ONLY) */}
      {isGeneralManager && (
        <div className="bg-bege-100 rounded-xl shadow-xl overflow-hidden border border-bege-200">
            <div className="p-6 border-b border-gray-200 bg-white/50">
                <h3 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                    Gestão de Cargos <span className="text-xs font-normal text-gray-500 uppercase tracking-wide">(Apenas Gestor Geral)</span>
                </h3>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {sortedUsers.map(user => {
                    const isManager = user.role !== UserRole.MEMBER;
                    return (
                        <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-white transition-colors border-b border-gray-100 last:border-0">
                            <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-bege-50 font-bold text-sm shadow-md">
                                {user.name.charAt(0)}
                            </div>

                            <div className="flex-1">
                                <p className="font-bold text-navy-900 text-sm">{user.name}</p>
                                <p className="text-[10px] uppercase tracking-wide font-bold text-gray-400">
                                    {user.role.replace(/_/g, ' ')}
                                </p>
                            </div>
                            
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${isManager ? 'bg-ocre-100 text-ocre-700 border-ocre-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                {isManager ? 'Gestor' : 'Membro'}
                            </div>
                        </div>
                    )
                })}
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
                     const eventDate = new Date(event.date);
                     const isPast = Date.now() > event.date;

                     return (
                         <div key={event.id} className="bg-white/30">
                             <div 
                                onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white transition-colors"
                             >
                                 <div className="flex items-center gap-3">
                                     <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${isPast ? 'bg-gray-100 border-gray-300 text-gray-500' : 'bg-navy-100 border-navy-200 text-navy-800'}`}>
                                         <span className="text-[10px] font-bold uppercase">{eventDate.toLocaleString('pt-BR', { month: 'short' }).replace('.','')}</span>
                                         <span className="text-lg font-bold leading-none">{eventDate.getDate()}</span>
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-navy-900 text-sm">{event.title}</h4>
                                         <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                             <Calendar className="w-3 h-3"/> {event.timeStr} • {event.eventType}
                                         </p>
                                     </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-4">
                                     <div className="text-right hidden sm:block">
                                         <span className="text-lg font-bold text-navy-800">{confirmedCount}</span>
                                         <p className="text-[9px] uppercase font-bold text-gray-400">Confirmados</p>
                                     </div>
                                     {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                 </div>
                             </div>

                             {isExpanded && (
                                 <div className="bg-gray-50 p-4 border-t border-gray-200 shadow-inner">
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
                                                     <div key={record.userId} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm">
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
                                                                onClick={() => onMarkAttendance(event.id, user.id, AttendanceStatus.PRESENT)}
                                                                className={`p-1.5 rounded border transition-colors ${record.status === AttendanceStatus.PRESENT ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                                                                title="Marcar Presente"
                                                              >
                                                                  <Check className="w-4 h-4" />
                                                              </button>
                                                              <button 
                                                                onClick={() => onMarkAttendance(event.id, user.id, AttendanceStatus.ABSENT)}
                                                                className={`p-1.5 rounded border transition-colors ${record.status === AttendanceStatus.ABSENT ? 'bg-red-100 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
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
