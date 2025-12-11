
import React from 'react';
import { FinanceItem } from '../types';
import { DollarSign, ThumbsUp, CheckCircle, Clock } from 'lucide-react';

interface Props {
  items: FinanceItem[];
  onToggleApproval: (id: string) => void;
}

export const Finances: React.FC<Props> = ({ items, onToggleApproval }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h2 className="text-3xl font-serif text-bege-50">Transparência Financeira</h2>
        <p className="text-bege-200">Acompanhe despesas e ajude a banda a alocar recursos.</p>
      </div>

      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-navy-800 rounded-xl border border-navy-700 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-ocre-500/30 transition-colors">
            
            <div className={`p-4 rounded-full ${item.amount > 500 ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
              <DollarSign className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                 <h3 className="text-xl font-bold text-bege-50">{item.title}</h3>
                 <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                   item.status === 'APPROVED' ? 'bg-green-900 text-green-300' : 
                   item.status === 'REJECTED' ? 'bg-red-900 text-red-300' : 
                   'bg-yellow-900 text-yellow-300'
                 }`}>
                   {item.status === 'APPROVED' ? 'APROVADO' : item.status === 'REJECTED' ? 'REJEITADO' : 'PENDENTE'}
                 </span>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-bege-200 text-sm">
                <span className="font-mono text-lg text-white font-bold">R$ {item.amount.toFixed(2)}</span>
                <span className="px-2 py-0.5 bg-navy-900 rounded border border-navy-700 text-xs">{item.category}</span>
                <span className="text-xs opacity-60">Req. por {item.authorId}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 border-l border-navy-700 pl-6">
               <div className="text-center">
                 <span className="block text-2xl font-bold text-bege-50">{item.approvals}</span>
                 <span className="text-xs text-bege-200/50 uppercase">Votos</span>
               </div>
               
               <button 
                 onClick={() => onToggleApproval(item.id)}
                 className="p-3 bg-navy-900 hover:bg-ocre-600 rounded-full text-bege-200 hover:text-white transition-colors border border-navy-600"
                 title="Votar para Aprovar"
               >
                 <ThumbsUp className="w-5 h-5" />
               </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};