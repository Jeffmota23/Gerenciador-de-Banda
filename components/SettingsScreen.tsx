
import React, { useState, useEffect } from 'react';
import { User, UserSettings } from '../types';
import { ArrowLeft, Bell, Lock, Eye, Moon, Smartphone, HardDrive, LogOut, ChevronRight, Check, ShieldCheck, Download, Trash2, SmartphoneNfc, FileText, HelpCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  currentUser: User;
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onLogout: () => void;
}

type SettingsTab = 'GENERAL' | 'NOTIFICATIONS' | 'PRIVACY';

export const SettingsScreen: React.FC<Props> = ({ currentUser, settings, onUpdateSettings, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('GENERAL');
  const [isExporting, setIsExporting] = useState(false);
  const [cacheSize, setCacheSize] = useState('Calculando...');

  // Calculate estimated cache size on mount
  useEffect(() => {
      // Simulate calculation or check local storage usage
      let total = 0;
      for (const x in localStorage) {
          if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
              total += (localStorage[x].length * 2);
          }
      }
      // Add a base mock size for "images/assets"
      const mockAssetsSize = 125 * 1024 * 1024; // 125MB
      const totalSize = total + mockAssetsSize;
      
      setCacheSize(`${(totalSize / (1024 * 1024)).toFixed(1)} MB`);
  }, []);

  const handleToggle = (category: keyof UserSettings, key: string) => {
    const currentCategory = settings[category] as any;
    const newValue = !currentCategory[key];
    
    onUpdateSettings({
      [category]: {
        ...currentCategory,
        [key]: newValue
      }
    });
  };

  const handleClearCache = async () => {
      const confirm = window.confirm("Isso irá limpar arquivos temporários, histórico local e dados de sessão. O aplicativo será recarregado. Deseja continuar?");
      
      if (confirm) {
          try {
            // 1. Clear Local Storage (App State Persistence)
            localStorage.clear();
            
            // 2. Clear Session Storage
            sessionStorage.clear();

            // 3. Clear Browser Cache Storage (Service Workers/Assets)
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
            }

            setCacheSize('0 KB');
            alert("Cache limpo com sucesso! O aplicativo será reiniciado para aplicar as alterações.");
            window.location.reload();
          } catch (e) {
            console.error("Error clearing cache:", e);
            alert("Ocorreu um erro ao tentar limpar o cache.");
          }
      }
  };

  const handleExportData = () => {
      setIsExporting(true);
      // Simulate API call
      setTimeout(() => {
          setIsExporting(false);
          alert("Um link para download dos seus dados (formato JSON) foi enviado para seu e-mail.");
      }, 2000);
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
      <button 
        onClick={onChange}
        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative ${checked ? 'bg-ocre-600' : 'bg-navy-700 border border-navy-600'}`}
      >
          <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
      </button>
  );

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-fade-in relative">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pt-2">
          <button onClick={() => navigate(-1)} className="p-2 bg-navy-800 rounded-full text-bege-200 hover:text-white border border-navy-700">
              <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
              <h1 className="text-2xl font-serif text-bege-50">Configurações</h1>
              <p className="text-xs text-bege-200/60">Gerencie suas preferências e privacidade</p>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-navy-800 p-1 rounded-xl mb-6 border border-navy-700 sticky top-20 z-30 shadow-lg">
          <button 
            onClick={() => setActiveTab('GENERAL')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'GENERAL' ? 'bg-navy-900 text-ocre-500 shadow-md border border-navy-600' : 'text-bege-200 hover:text-white'}`}
          >
              Geral
          </button>
          <button 
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'NOTIFICATIONS' ? 'bg-navy-900 text-ocre-500 shadow-md border border-navy-600' : 'text-bege-200 hover:text-white'}`}
          >
              Notificações
          </button>
          <button 
            onClick={() => setActiveTab('PRIVACY')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'PRIVACY' ? 'bg-navy-900 text-ocre-500 shadow-md border border-navy-600' : 'text-bege-200 hover:text-white'}`}
          >
              Privacidade
          </button>
      </div>

      <div className="space-y-6">
          
          {/* === TAB: GENERAL === */}
          {activeTab === 'GENERAL' && (
              <>
                <section className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
                    <h3 className="px-6 py-4 text-sm font-bold text-bege-50 border-b border-navy-700 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-ocre-500" /> Acessibilidade & Aparência
                    </h3>
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-bege-100 font-bold">Modo Leitura (Alto Contraste)</p>
                                <p className="text-xs text-gray-500">Melhora visibilidade de textos e partituras.</p>
                            </div>
                            <ToggleSwitch checked={settings.accessibility.highContrast} onChange={() => handleToggle('accessibility', 'highContrast')} />
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-bege-100 font-bold">Texto Grande</p>
                                <p className="text-xs text-gray-500">Aumenta o tamanho da fonte em 15%.</p>
                            </div>
                            <ToggleSwitch checked={settings.accessibility.largeText} onChange={() => handleToggle('accessibility', 'largeText')} />
                        </div>
                    </div>
                </section>

                <section className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
                    <h3 className="px-6 py-4 text-sm font-bold text-bege-50 border-b border-navy-700 flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-ocre-500" /> Armazenamento e Dados
                    </h3>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center p-3 bg-navy-900 rounded-lg border border-navy-600">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-navy-800 rounded-full text-bege-200"><Download className="w-4 h-4"/></div>
                                <div>
                                    <p className="text-sm font-bold text-bege-100">Cache do Aplicativo</p>
                                    <p className="text-xs text-gray-500">{cacheSize} em uso</p>
                                </div>
                            </div>
                            <button onClick={handleClearCache} className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-900/50 rounded bg-red-900/10 hover:bg-red-900/20">
                                Limpar
                            </button>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-navy-900 rounded-lg border border-navy-600">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-navy-800 rounded-full text-bege-200"><FileText className="w-4 h-4"/></div>
                                <div>
                                    <p className="text-sm font-bold text-bege-100">Exportar Meus Dados</p>
                                    <p className="text-xs text-gray-500">Baixar cópia do histórico e posts (LGPD).</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleExportData}
                                disabled={isExporting}
                                className="text-xs font-bold text-ocre-500 hover:text-white px-3 py-1.5 border border-ocre-900/50 rounded bg-ocre-900/10 hover:bg-ocre-600 transition-all flex items-center gap-1"
                            >
                                {isExporting ? 'Processando...' : <><Download className="w-3 h-3" /> Exportar</>}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
                    <h3 className="px-6 py-4 text-sm font-bold text-bege-50 border-b border-navy-700 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-ocre-500" /> Sobre
                    </h3>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-bege-200">Versão do App</span>
                            <span className="text-sm font-mono text-gray-500">v2.4.1 (Build 890)</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-bege-200">Termos de Uso</span>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-bege-200">Política de Privacidade</span>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                    </div>
                </section>
              </>
          )}

          {/* === TAB: NOTIFICATIONS === */}
          {activeTab === 'NOTIFICATIONS' && (
              <section className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
                  <div className="p-6 border-b border-navy-700 bg-gradient-to-r from-navy-800 to-navy-900">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-ocre-900/30 flex items-center justify-center text-ocre-500">
                              <Bell className="w-5 h-5" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-bege-50">Central de Alertas</h3>
                              <p className="text-xs text-gray-400">Escolha o que é importante para você.</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="text-sm text-bege-100 font-bold">Notificações Push</p>
                              <p className="text-xs text-gray-500">Alertas no dispositivo móvel.</p>
                          </div>
                          <ToggleSwitch checked={settings.notifications.push} onChange={() => handleToggle('notifications', 'push')} />
                      </div>
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="text-sm text-bege-100 font-bold">Notificações por Email</p>
                              <p className="text-xs text-gray-500">Resumos semanais e alertas críticos.</p>
                          </div>
                          <ToggleSwitch checked={settings.notifications.email} onChange={() => handleToggle('notifications', 'email')} />
                      </div>
                      <div className="h-px bg-navy-700 my-2"></div>
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="text-sm text-bege-100 font-bold">Eventos & Agenda</p>
                              <p className="text-xs text-gray-500">Novos ensaios, lembretes de horário.</p>
                          </div>
                          <ToggleSwitch checked={settings.notifications.events} onChange={() => handleToggle('notifications', 'events')} />
                      </div>
                      <div className="flex justify-between items-center">
                          <div>
                              <p className="text-sm text-bege-100 font-bold">Interações Sociais</p>
                              <p className="text-xs text-gray-500">Curtidas, comentários e novos seguidores.</p>
                          </div>
                          <ToggleSwitch checked={settings.notifications.community} onChange={() => handleToggle('notifications', 'community')} />
                      </div>
                  </div>
              </section>
          )}

          {/* === TAB: PRIVACY & SECURITY === */}
          {activeTab === 'PRIVACY' && (
              <>
                <section className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden mb-6">
                    <h3 className="px-6 py-4 text-sm font-bold text-bege-50 border-b border-navy-700 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-ocre-500" /> Segurança da Conta
                    </h3>
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-bege-100 font-bold flex items-center gap-2">
                                    <SmartphoneNfc className="w-4 h-4 text-gray-400" /> Biometria (FaceID/TouchID)
                                </p>
                                <p className="text-xs text-gray-500">Exigir biometria ao abrir o app.</p>
                            </div>
                            <ToggleSwitch checked={settings.security.biometrics} onChange={() => handleToggle('security', 'biometrics')} />
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-bege-100 font-bold flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-gray-400" /> Autenticação em 2 Fatores
                                </p>
                                <p className="text-xs text-gray-500">Camada extra de proteção via SMS/Email.</p>
                            </div>
                            <ToggleSwitch checked={settings.security.twoFactor} onChange={() => handleToggle('security', 'twoFactor')} />
                        </div>
                        <button className="w-full py-3 mt-2 border border-navy-600 rounded-lg text-sm font-bold text-bege-200 hover:bg-navy-700 hover:text-white transition-colors">
                            Alterar Senha
                        </button>
                    </div>
                </section>

                <section className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden mb-6">
                    <h3 className="px-6 py-4 text-sm font-bold text-bege-50 border-b border-navy-700 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-ocre-500" /> Visibilidade
                    </h3>
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-bege-100 font-bold">Perfil Privado</p>
                                <p className="text-xs text-gray-500">Apenas seguidores aprovados veem seus posts.</p>
                            </div>
                            <ToggleSwitch 
                                checked={settings.privacy.profileVisibility === 'FOLLOWERS'} 
                                onChange={() => onUpdateSettings({ privacy: { ...settings.privacy, profileVisibility: settings.privacy.profileVisibility === 'PUBLIC' ? 'FOLLOWERS' : 'PUBLIC' } })} 
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-bege-100 font-bold">Status Online</p>
                                <p className="text-xs text-gray-500">Mostrar quando você está usando o app.</p>
                            </div>
                            <ToggleSwitch checked={settings.privacy.onlineStatus} onChange={() => handleToggle('privacy', 'onlineStatus')} />
                        </div>
                    </div>
                </section>

                <div className="p-6 rounded-xl border border-red-900/30 bg-red-900/5">
                    <h4 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Zona de Perigo
                    </h4>
                    <p className="text-xs text-red-300/60 mb-4">
                        A exclusão da conta é permanente e removerá todo seu histórico de frequência e XP.
                    </p>
                    <button onClick={() => alert("Função bloqueada no modo de demonstração.")} className="text-xs font-bold text-red-500 hover:text-red-400 border border-red-900 hover:bg-red-900/20 px-4 py-2 rounded transition-colors">
                        Solicitar Exclusão de Conta
                    </button>
                </div>
              </>
          )}

      </div>

      <div className="mt-8 text-center">
          <button onClick={onLogout} className="text-sm font-bold text-bege-200/50 hover:text-red-400 flex items-center justify-center gap-2 mx-auto transition-colors">
              <LogOut className="w-4 h-4" /> Sair da Conta
          </button>
      </div>
    </div>
  );
};
