
import React from 'react';
import { DeletedItem, UserRole } from '../types';
import { RotateCcw, AlertTriangle, Clock } from 'lucide-react';

interface Props {
  items: DeletedItem[];
  userRole: UserRole;
  onRestore: (id: string) => void;
}

export const TrashBin: React.FC<Props> = ({ items, userRole, onRestore }) => {
  // STRICT ACCESS CONTROL: Only General Manager can see this component's content
  if (userRole !== UserRole.GENERAL_MANAGER) {
    return (
      <div className="p-8 text-center border-2 border-red-500/20 bg-red-900/10 rounded-lg">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl text-red-400 font-serif">Acesso Negado</h2>
        <p className="text-bege-200 mt-2">Apenas o Gestor Geral pode acessar o Log de Auditoria e Console de Restauração.</p>
      </div>
    );
  }

  const activeDeletedItems = items.filter(item => item.expiresAt > Date.now());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-navy-700 pb-4">
        <h2 className="text-2xl font-serif text-bege-50 flex items-center gap-2">
          <Clock className="w-6 h-6 text-ocre-500" />
          Log de Auditoria & Restauração (Retenção 7 dias)
        </h2>
        <p className="text-bege-200 text-sm mt-1">
          Itens deletados por qualquer gestor aparecem aqui. Você tem 7 dias para restaurá-los.
        </p>
      </div>

      {activeDeletedItems.length === 0 ? (
        <div className="text-center py-12 bg-navy-800/50 rounded-lg border border-navy-700 border-dashed">
          <p className="text-bege-200/50 italic">A lixeira está vazia.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {activeDeletedItems.map((deleted) => {
             const daysLeft = Math.ceil((deleted.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
             
             return (
              <div key={deleted.originalItem.id} className="bg-navy-800 border border-navy-700 p-4 rounded-lg flex items-center justify-between group hover:border-ocre-500/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-navy-900 text-bege-200 border border-navy-600">
                      {deleted.originalItem.type}
                    </span>
                    <h3 className="text-lg font-bold text-bege-50">{deleted.originalItem.title}</h3>
                  </div>
                  <div className="text-sm text-bege-200 space-y-1">
                    <p>Deletado por: <span className="text-white">{deleted.deletedBy}</span></p>
                    <p>Motivo: <span className="italic text-red-300">"{deleted.reason}"</span></p>
                    <p className="text-xs text-ocre-500 font-bold uppercase tracking-wide mt-2">
                      Expira em {daysLeft} dias
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onRestore(deleted.originalItem.id)}
                  className="flex items-center gap-2 bg-navy-900 hover:bg-ocre-600 text-bege-100 px-4 py-2 rounded-md transition-colors border border-navy-600 hover:border-ocre-500"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};