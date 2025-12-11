import React from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';

interface Props {
  currentUser: User;
  onSwitch: (user: User) => void;
}

export const RoleSwitcher: React.FC<Props> = ({ currentUser, onSwitch }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-navy-800 p-4 rounded-lg shadow-xl border border-navy-700 z-50">
      <p className="text-bege-200 text-xs mb-2 uppercase tracking-widest font-bold">Simulate Persona</p>
      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {MOCK_USERS.map(user => (
          <button
            key={user.id}
            onClick={() => onSwitch(user)}
            className={`text-sm px-3 py-1 rounded-md text-left transition-colors whitespace-nowrap ${
              currentUser.id === user.id 
                ? 'bg-ocre-600 text-white' 
                : 'bg-navy-700 text-bege-100 hover:bg-navy-600'
            }`}
          >
            {user.name}
          </button>
        ))}
      </div>
    </div>
  );
};