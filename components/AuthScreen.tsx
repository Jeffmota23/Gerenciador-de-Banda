
import React from 'react';
import { Music, ArrowRight, User as UserIcon } from 'lucide-react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';

interface Props {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLogin }) => {
  
  // Group users for better display
  const generalManager = MOCK_USERS.find(u => u.role === UserRole.GENERAL_MANAGER);
  const managers = MOCK_USERS.filter(u => u.role !== UserRole.GENERAL_MANAGER && u.role !== UserRole.MEMBER);
  const members = MOCK_USERS.filter(u => u.role === UserRole.MEMBER);

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ocre-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-navy-800 p-8 rounded-2xl border border-navy-700 shadow-2xl z-10 max-h-[90vh] flex flex-col">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-ocre-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-ocre-900/50">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-serif text-bege-50 font-bold mb-2">BandSocial</h1>
          <p className="text-ocre-500 uppercase tracking-widest text-xs font-bold">Gestão de Bandas</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
          
          <p className="text-xs text-bege-200/50 uppercase font-bold text-center mb-4">Escolha uma Persona para Simular</p>

          {/* GM Section */}
          {generalManager && (
            <div className="mb-4">
              <p className="text-[10px] text-ocre-500 uppercase font-bold mb-2 tracking-wider">Administração</p>
              <button
                onClick={() => onLogin(generalManager)}
                className="w-full bg-navy-900 border border-ocre-600/50 hover:border-ocre-500 hover:bg-navy-700 p-3 rounded-lg flex items-center gap-3 transition-all group"
              >
                <div className="w-8 h-8 bg-ocre-600 rounded-full flex items-center justify-center font-serif font-bold text-white shadow">
                  {generalManager.name.charAt(0)}
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-bege-50 group-hover:text-white">{generalManager.name}</p>
                  <p className="text-[10px] text-bege-200/60 uppercase">Gestor Geral</p>
                </div>
                <ArrowRight className="w-4 h-4 text-ocre-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          )}

          {/* Managers Section */}
          <div className="mb-4">
            <p className="text-[10px] text-bege-200/40 uppercase font-bold mb-2 tracking-wider">Gestores de Área</p>
            <div className="space-y-2">
              {managers.map(user => (
                <button
                  key={user.id}
                  onClick={() => onLogin(user)}
                  className="w-full bg-navy-700/50 border border-navy-600 hover:bg-navy-600 p-2.5 rounded-lg flex items-center gap-3 transition-all group"
                >
                  <div className="w-8 h-8 bg-navy-800 rounded-full flex items-center justify-center text-xs font-bold text-bege-200">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-bege-100">{user.name}</p>
                    <p className="text-[10px] text-bege-200/50 uppercase">{user.instrument}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Members Section */}
          <div>
            <p className="text-[10px] text-bege-200/40 uppercase font-bold mb-2 tracking-wider">Músicos / Membros</p>
            <div className="space-y-2">
              {members.map(user => (
                <button
                  key={user.id}
                  onClick={() => onLogin(user)}
                  className="w-full bg-navy-700/30 border border-navy-700 hover:bg-navy-600 p-2.5 rounded-lg flex items-center gap-3 transition-all group"
                >
                  <div className="w-8 h-8 bg-navy-800 rounded-full flex items-center justify-center text-xs font-bold text-bege-200">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-bege-100">{user.name}</p>
                    <p className="text-[10px] text-bege-200/50 uppercase">{user.instrument}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
        
        <div className="mt-6 pt-4 border-t border-navy-700 text-center">
           <button className="text-xs text-ocre-500 hover:text-white transition-colors font-bold flex items-center justify-center gap-2 mx-auto">
             <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" className="w-4 h-4 grayscale opacity-50" />
             Entrar com Conta Google
           </button>
           <p className="text-[10px] text-bege-200/30 font-mono mt-3">
            BandSocial Manager v1.2.0 PT-BR
          </p>
        </div>
      </div>
    </div>
  );
};