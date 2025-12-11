
import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { LogOut, Award, TrendingUp, Music, Mail, Shield, Star, Bell, BellOff, BellRing, Users, Search, X, UserCheck, UserPlus, ChevronRight, MapPin } from 'lucide-react';
import { useApp } from '../App';

interface Props {
  user: User;
  allUsers: User[]; // Added to calculate followers/following details
  onToggleFollow: (id: string) => void; // Added for interaction within the modal
  onLogout: () => void;
}

type ModalTab = 'FOLLOWERS' | 'FOLLOWING';

export const Profile: React.FC<Props> = ({ user, allUsers, onToggleFollow, onLogout }) => {
  const { notificationPermission, requestNotificationPermission } = useApp();
  
  // Modal State
  const [activeModalTab, setActiveModalTab] = useState<ModalTab | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null); // For viewing detailed public profile of others
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate XP Progress
  const xpForNextLevel = (user.level + 1) * 200;
  const currentLevelBaseXp = user.level * 200;
  const progressPercent = Math.min(100, Math.max(0, ((user.xp - currentLevelBaseXp) / 200) * 100));

  // --- NETWORK LOGIC ---
  const followingList = useMemo(() => {
    return allUsers.filter(u => user.following.includes(u.id));
  }, [allUsers, user.following]);

  const followersList = useMemo(() => {
    return allUsers.filter(u => u.following.includes(user.id));
  }, [allUsers, user.id]);

  // Filtered List for Modal
  const displayedUsers = useMemo(() => {
    const sourceList = activeModalTab === 'FOLLOWERS' ? followersList : followingList;
    if (!searchQuery.trim()) return sourceList;
    return sourceList.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.instrument.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeModalTab, followersList, followingList, searchQuery]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in mb-20 relative">
      
      {/* --- NETWORK LIST MODAL --- */}
      {activeModalTab && !viewingUser && (
        <div className="fixed inset-0 z-[100] bg-navy-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-navy-900 w-full max-w-md rounded-2xl border border-navy-700 shadow-2xl overflow-hidden flex flex-col h-[70vh]">
              
              {/* Modal Header */}
              <div className="p-4 border-b border-navy-700 bg-navy-950 flex justify-between items-center">
                  <div className="flex gap-4 text-sm font-bold">
                      <button 
                        onClick={() => setActiveModalTab('FOLLOWERS')}
                        className={`pb-1 border-b-2 transition-colors ${activeModalTab === 'FOLLOWERS' ? 'border-ocre-500 text-bege-50' : 'border-transparent text-bege-200/50'}`}
                      >
                          {followersList.length} Seguidores
                      </button>
                      <button 
                        onClick={() => setActiveModalTab('FOLLOWING')}
                        className={`pb-1 border-b-2 transition-colors ${activeModalTab === 'FOLLOWING' ? 'border-ocre-500 text-bege-50' : 'border-transparent text-bege-200/50'}`}
                      >
                          {followingList.length} Seguindo
                      </button>
                  </div>
                  <button onClick={() => { setActiveModalTab(null); setSearchQuery(''); }} className="text-bege-200 hover:text-white">
                      <X className="w-5 h-5" />
                  </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 bg-navy-800 border-b border-navy-700">
                  <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar perfil..."
                        className="w-full bg-navy-900 border border-navy-600 rounded-lg py-2 pl-9 pr-4 text-sm text-bege-100 outline-none focus:border-ocre-500"
                        autoFocus
                      />
                  </div>
              </div>

              {/* Users List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {displayedUsers.length === 0 ? (
                      <div className="text-center py-10 text-bege-200/40 text-sm">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          Nenhum usuário encontrado.
                      </div>
                  ) : (
                      <div className="space-y-1">
                          {displayedUsers.map(u => {
                              const isFollowing = user.following.includes(u.id);
                              const isMe = u.id === user.id;

                              return (
                                  <div key={u.id} className="flex items-center justify-between p-3 hover:bg-navy-800 rounded-lg transition-colors group cursor-pointer" onClick={() => setViewingUser(u)}>
                                      <div className="flex items-center gap-3">
                                          {u.avatarUrl ? (
                                              <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full border border-navy-600 object-cover" />
                                          ) : (
                                              <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center font-bold text-bege-200 border border-navy-600">
                                                  {u.name.charAt(0)}
                                              </div>
                                          )}
                                          <div>
                                              <p className="font-bold text-sm text-bege-50">{u.nickname}</p>
                                              <p className="text-[10px] text-bege-200/50 uppercase">{u.instrument}</p>
                                          </div>
                                      </div>
                                      
                                      {!isMe && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); onToggleFollow(u.id); }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 transition-all ${
                                                isFollowing 
                                                ? 'bg-navy-950 border-navy-700 text-bege-200/70 hover:border-red-500/50 hover:text-red-400' 
                                                : 'bg-ocre-600 border-ocre-500 text-white hover:bg-ocre-500'
                                            }`}
                                          >
                                              {isFollowing ? (
                                                  <>Seguindo</>
                                              ) : (
                                                  <><UserPlus className="w-3 h-3" /> Seguir</>
                                              )}
                                          </button>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </div>
           </div>
        </div>
      )}

      {/* --- PUBLIC PROFILE VIEW MODAL (VIEWING OTHER USER) --- */}
      {viewingUser && (
          <div className="fixed inset-0 z-[110] bg-navy-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-navy-900 w-full max-w-sm rounded-2xl border border-navy-600 shadow-2xl overflow-hidden relative">
                  <button onClick={() => setViewingUser(null)} className="absolute top-4 right-4 z-10 bg-black/20 p-2 rounded-full text-white hover:bg-black/40"><X className="w-5 h-5"/></button>
                  
                  {/* Public Header */}
                  <div className="h-24 bg-gradient-to-b from-ocre-600/30 to-navy-900 relative"></div>
                  <div className="px-6 pb-6 relative -top-12 flex flex-col items-center text-center">
                      {viewingUser.avatarUrl ? (
                          <img src={viewingUser.avatarUrl} alt={viewingUser.name} className="w-24 h-24 rounded-full border-4 border-navy-900 object-cover shadow-lg mb-3" />
                      ) : (
                          <div className="w-24 h-24 rounded-full bg-navy-700 border-4 border-navy-900 flex items-center justify-center font-bold text-3xl text-bege-200 shadow-lg mb-3">
                              {viewingUser.name.charAt(0)}
                          </div>
                      )}
                      
                      <h2 className="text-2xl font-serif text-bege-50 font-bold">{viewingUser.nickname}</h2>
                      <p className="text-sm text-bege-200">{viewingUser.name}</p>
                      
                      <div className="flex items-center gap-2 mt-2 text-xs text-ocre-500 font-bold bg-navy-950 px-3 py-1 rounded-full border border-navy-700">
                          <MapPin className="w-3 h-3" /> {viewingUser.address.city} - {viewingUser.address.state}
                      </div>

                      <div className="w-full mt-6 space-y-3">
                          <div className="bg-navy-800 p-3 rounded-lg border border-navy-700 flex justify-between items-center">
                              <span className="text-xs text-bege-200/60 uppercase font-bold">Instrumento</span>
                              <span className="text-bege-50 font-bold flex items-center gap-2"><Music className="w-4 h-4 text-ocre-500"/> {viewingUser.instrument}</span>
                          </div>
                          <div className="bg-navy-800 p-3 rounded-lg border border-navy-700 flex justify-between items-center">
                              <span className="text-xs text-bege-200/60 uppercase font-bold">Nível</span>
                              <span className="text-bege-50 font-bold flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500"/> {viewingUser.level}</span>
                          </div>
                      </div>

                      {user.id !== viewingUser.id && (
                          <button 
                            onClick={() => onToggleFollow(viewingUser.id)}
                            className={`w-full mt-6 py-2 rounded-lg font-bold transition-colors ${user.following.includes(viewingUser.id) ? 'bg-navy-800 text-bege-200 border border-navy-600' : 'bg-ocre-600 text-white shadow-lg'}`}
                          >
                              {user.following.includes(viewingUser.id) ? 'Deixar de Seguir' : 'Seguir Perfil'}
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* 1. Identity Header (Current User) */}
      <div className="bg-navy-800 rounded-2xl p-6 border border-navy-700 flex flex-col items-center text-center relative overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-ocre-600/20 to-navy-800 z-0"></div>
        
        <div className="z-10 mb-4 relative group">
            {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full border-4 border-navy-800 object-cover shadow-lg" />
            ) : (
                <div className="w-24 h-24 rounded-full bg-ocre-500 text-3xl font-serif font-bold text-white flex items-center justify-center border-4 border-navy-800 shadow-lg">
                    {user.name.charAt(0)}
                </div>
            )}
        </div>
        
        <h1 className="text-3xl font-serif text-bege-50 z-10">{user.nickname}</h1>
        <p className="text-bege-200 text-sm z-10">{user.name}</p>
        
        <p className="text-ocre-500 uppercase tracking-widest text-[10px] font-bold mt-2 z-10 flex items-center gap-2 bg-navy-900/50 px-3 py-1 rounded-full border border-navy-700">
           <MapPin className="w-3 h-3" /> {user.address.city} - {user.address.state}
        </p>

        {/* --- FOLLOW STATS BUTTONS --- */}
        <div className="flex gap-8 mt-6 z-10 w-full justify-center border-t border-navy-700/50 pt-4">
            <button 
                onClick={() => setActiveModalTab('FOLLOWERS')}
                className="flex flex-col items-center group cursor-pointer"
            >
                <span className="text-xl font-bold text-bege-50 group-hover:text-ocre-500 transition-colors">{followersList.length}</span>
                <span className="text-[10px] uppercase tracking-wider text-bege-200/60 font-bold">Seguidores</span>
            </button>
            <div className="w-px bg-navy-700"></div>
            <button 
                onClick={() => setActiveModalTab('FOLLOWING')}
                className="flex flex-col items-center group cursor-pointer"
            >
                <span className="text-xl font-bold text-bege-50 group-hover:text-ocre-500 transition-colors">{followingList.length}</span>
                <span className="text-[10px] uppercase tracking-wider text-bege-200/60 font-bold">Seguindo</span>
            </button>
        </div>
      </div>

      {/* 2. Gamification / Performance (Social First) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* XP Card */}
        <div className="bg-navy-800 p-6 rounded-xl border border-navy-700 shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
               <Star className="w-24 h-24" />
           </div>
           <div className="flex justify-between items-end mb-4 relative z-10">
              <div>
                <h3 className="text-bege-200 text-sm uppercase font-bold flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" /> Rank Atual
                </h3>
                <p className="text-2xl font-serif text-bege-50">Nível {user.level}</p>
              </div>
              <span className="text-ocre-500 font-mono text-xl">{user.xp} XP</span>
           </div>
           
           <div className="w-full bg-navy-900 h-3 rounded-full overflow-hidden border border-navy-700 relative z-10">
             <div 
               className="bg-gradient-to-r from-ocre-600 to-yellow-500 h-full transition-all duration-1000 ease-out" 
               style={{ width: `${progressPercent}%` }}
             ></div>
           </div>
           <p className="text-xs text-bege-200/50 mt-2 text-right relative z-10">
             {Math.max(0, 200 - (user.xp - currentLevelBaseXp))} XP para Nível {user.level + 1}
           </p>
        </div>

        {/* Attendance Card */}
        <div className="bg-navy-800 p-6 rounded-xl border border-navy-700 shadow-lg">
           <div className="flex justify-between items-start mb-2">
              <h3 className="text-bege-200 text-sm uppercase font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" /> Frequência
              </h3>
              <Award className={`w-8 h-8 ${user.attendanceRate > 90 ? 'text-yellow-500' : 'text-navy-600'}`} />
           </div>
           <p className="text-4xl font-serif text-bege-50 mb-1">{user.attendanceRate}%</p>
           <p className="text-xs text-bege-200/60">Taxa de participação (30 dias).</p>
           
           <div className="mt-4 flex gap-1">
             {[1,2,3,4,5].map(i => (
               <div key={i} className={`h-2 flex-1 rounded-sm ${i <= 4 ? 'bg-green-500/50' : 'bg-red-500/30'}`}></div>
             ))}
           </div>
        </div>
      </div>

      {/* 3. System Preferences (Notifications) */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
        <h3 className="px-6 py-4 border-b border-navy-700 font-bold text-bege-100 flex items-center gap-2">
          <Bell className="w-4 h-4" /> Preferências do Sistema
        </h3>
        <div className="p-6 flex items-center justify-between">
            <div>
               <p className="text-sm font-bold text-bege-50">Notificações no Dispositivo</p>
               <p className="text-xs text-bege-200/50 mt-1 max-w-xs">
                 Receba alertas sobre novos eventos, avisos do mural e atualizações de repertório mesmo com o app fechado.
               </p>
            </div>
            
            {notificationPermission === 'granted' ? (
              <div className="flex items-center gap-2 text-green-500 font-bold text-xs bg-green-900/20 px-3 py-1.5 rounded-full border border-green-500/20">
                 <BellRing className="w-4 h-4" /> Ativo
              </div>
            ) : notificationPermission === 'denied' ? (
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs bg-red-900/20 px-3 py-1.5 rounded-full border border-red-500/20">
                 <BellOff className="w-4 h-4" /> Bloqueado
              </div>
            ) : (
              <button 
                onClick={requestNotificationPermission}
                className="bg-ocre-600 hover:bg-ocre-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg text-xs flex items-center gap-2"
              >
                 <Bell className="w-4 h-4" /> Ativar
              </button>
            )}
        </div>
      </div>

      {/* 4. Account Details */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
        <h3 className="px-6 py-4 border-b border-navy-700 font-bold text-bege-100 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Dados Pessoais (Privado)
        </h3>
        <div className="p-6 space-y-4">
           <div className="flex items-center gap-4">
             <div className="p-2 bg-navy-900 rounded text-bege-200"><Mail className="w-5 h-5"/></div>
             <div>
               <p className="text-xs text-bege-200/50 uppercase">Email</p>
               <p className="text-bege-50">{user.email || 'Não informado'}</p>
             </div>
           </div>
           <div className="flex items-center gap-4">
             <div className="p-2 bg-navy-900 rounded text-bege-200"><Shield className="w-5 h-5"/></div>
             <div>
               <p className="text-xs text-bege-200/50 uppercase">Acesso</p>
               <p className="text-bege-50 font-bold text-ocre-500">{user.role}</p>
             </div>
           </div>
           <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-navy-700">
               <div>
                   <p className="text-xs text-bege-200/50 uppercase">CPF</p>
                   <p className="text-sm text-bege-50">{user.cpf}</p>
               </div>
               <div>
                   <p className="text-xs text-bege-200/50 uppercase">RG</p>
                   <p className="text-sm text-bege-50">{user.rg}</p>
               </div>
               <div className="col-span-2">
                   <p className="text-xs text-bege-200/50 uppercase">Endereço Completo</p>
                   <p className="text-sm text-bege-50">
                       {user.address.street}, {user.address.number} - {user.address.city}/{user.address.state}
                   </p>
               </div>
           </div>
        </div>
      </div>

      {/* 5. Logout Action */}
      <button 
        onClick={onLogout}
        className="w-full py-4 rounded-xl border border-red-900/50 bg-red-900/10 text-red-400 hover:bg-red-900/30 hover:border-red-500/50 transition-all font-bold flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" /> Sair da Conta
      </button>

      <p className="text-center text-xs text-bege-200/30 font-mono pt-4">BandSocial Manager v1.2.0 PT-BR</p>
    </div>
  );
};
