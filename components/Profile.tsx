
import React from 'react';
import { User } from '../types';
import { LogOut, Award, TrendingUp, Music, Mail, Shield, Star, Bell, BellOff, BellRing } from 'lucide-react';
import { useApp } from '../App';

interface Props {
  user: User;
  onLogout: () => void;
}

export const Profile: React.FC<Props> = ({ user, onLogout }) => {
  const { notificationPermission, requestNotificationPermission } = useApp();

  // Calculate XP Progress (Simple mock formula: each level is 200 XP)
  // Note: With the new XP Matrix, levels might scale faster, but keeping 200 for demo simplicity
  const xpForNextLevel = (user.level + 1) * 200;
  const currentLevelBaseXp = user.level * 200;
  const progressPercent = Math.min(100, Math.max(0, ((user.xp - currentLevelBaseXp) / 200) * 100));

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in mb-20">
      
      {/* 1. Identity Header */}
      <div className="bg-navy-800 rounded-2xl p-6 border border-navy-700 flex flex-col items-center text-center relative overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-ocre-600/20 to-navy-800 z-0"></div>
        
        <div className="w-24 h-24 rounded-full bg-ocre-500 text-3xl font-serif font-bold text-white flex items-center justify-center border-4 border-navy-800 z-10 shadow-lg mb-4">
          {user.name.charAt(0)}
        </div>
        
        <h1 className="text-3xl font-serif text-bege-50 z-10">{user.name}</h1>
        <p className="text-bege-200 uppercase tracking-widest text-xs font-bold mt-1 z-10 flex items-center gap-2">
           <Music className="w-3 h-3" /> {user.instrument}
        </p>
        <span className="mt-2 px-3 py-1 bg-navy-900 rounded-full text-xs text-ocre-500 font-bold border border-navy-600 z-10">
          {user.role.replace(/_/g, ' ')}
        </span>
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
          <Shield className="w-4 h-4" /> Detalhes da Conta
        </h3>
        <div className="p-6 space-y-4">
           <div className="flex items-center gap-4">
             <div className="p-2 bg-navy-900 rounded text-bege-200"><Mail className="w-5 h-5"/></div>
             <div>
               <p className="text-xs text-bege-200/50 uppercase">Email</p>
               <p className="text-bege-50">{user.email || 'demo@bandsocial.com'}</p>
             </div>
           </div>
           <div className="flex items-center gap-4">
             <div className="p-2 bg-navy-900 rounded text-bege-200"><Shield className="w-5 h-5"/></div>
             <div>
               <p className="text-xs text-bege-200/50 uppercase">Nível de Acesso</p>
               <p className="text-bege-50">{user.role}</p>
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
