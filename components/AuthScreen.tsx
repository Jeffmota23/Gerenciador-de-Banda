
import React, { useState, useRef, useEffect } from 'react';
import { Music, ArrowRight, ArrowLeft, User as UserIcon, Mail, Facebook, Chrome, Camera, AlertCircle, CheckCircle2, Loader2, Sparkles, LogOut, ShieldCheck, Lock } from 'lucide-react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';
import { useApp } from '../App';
import { validateProfilePicture } from '../services/geminiService';

interface Props {
  onLogin: (user: User) => void;
}

// Helper for Brazil States
const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface SimulatedSession {
    provider: 'GOOGLE' | 'FACEBOOK';
    name: string;
    email: string;
    avatarUrl: string;
}

export const AuthScreen: React.FC<Props> = ({ onLogin }) => {
  const { users, registerUser } = useApp();
  
  // Views: LOGIN -> Choice
  // DETECTED_ACCOUNT -> Fast track
  // SOCIAL_LOGIN_SIMULATION -> Social Auth
  // EMAIL_AUTH -> Email + Password
  // REGISTER_FORM -> Final details
  const [view, setView] = useState<'LOGIN' | 'DETECTED_ACCOUNT' | 'SOCIAL_LOGIN_SIMULATION' | 'EMAIL_AUTH' | 'REGISTER_FORM'>('LOGIN');
  
  const [authMethod, setAuthMethod] = useState<'EMAIL' | 'GOOGLE' | 'FACEBOOK' | null>(null);
  const [simulatedSession, setSimulatedSession] = useState<SimulatedSession | null>(null);

  // Social Login Input State (To allow typing different emails in the simulator)
  const [socialEmailInput, setSocialEmailInput] = useState('');

  // Email/Password Auth State
  const [manualEmail, setManualEmail] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    cpf: '',
    rg: '',
    phone: '',
    email: '',
    cep: '',
    street: '',
    number: '',
    city: '',
    state: '',
    instrument: '',
    experienceTime: ''
  });
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Simulate detecting a browser session on mount
  useEffect(() => {
      const timer = setTimeout(() => {
          // 80% chance of detecting a session for demo
          if (Math.random() > 0.2) {
              setSimulatedSession({
                  provider: 'GOOGLE',
                  name: 'Jefferson Silva',
                  email: 'jefferson.silva@gmail.com',
                  avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80'
              });
          }
      }, 500);
      return () => clearTimeout(timer);
  }, []);

  // Group users for simulation display
  const generalManager = MOCK_USERS.find(u => u.role === UserRole.GENERAL_MANAGER);
  const managers = MOCK_USERS.filter(u => u.role !== UserRole.GENERAL_MANAGER && u.role !== UserRole.MEMBER);

  // --- ACTIONS ---

  const checkUserAndProceed = (email: string, name?: string, avatarUrl?: string) => {
      // 1. LOGIN: Check if user already exists based on authenticated email
      const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
          // Login immediately
          setTimeout(() => onLogin(existingUser), 500);
          return;
      }

      // 2. REGISTER: Pre-fill form and go to registration
      setFormData(prev => ({
          ...prev,
          email: email, // Locked
          name: name || prev.name,
          nickname: name ? name.split(' ')[0] : prev.nickname
      }));
      
      if (avatarUrl) {
          setAvatarPreview(avatarUrl);
      }

      setView('REGISTER_FORM');
  };

  const handleContinueWithDetected = () => {
      if (!simulatedSession) return;
      setAuthMethod(simulatedSession.provider);
      checkUserAndProceed(simulatedSession.email, simulatedSession.name, simulatedSession.avatarUrl);
  };

  const handleSocialLoginClick = (method: 'GOOGLE' | 'FACEBOOK') => {
      setAuthMethod(method);
      // Pre-fill simulator for convenience, but user can change it
      if (method === 'GOOGLE') setSocialEmailInput('usuario.novo@gmail.com');
      else setSocialEmailInput('usuario.novo@facebook.com');
      
      setView('SOCIAL_LOGIN_SIMULATION');
  };

  const handleSocialLoginSubmit = () => {
      // Logic inside the "Authenticator" window
      let finalEmail = socialEmailInput;
      let finalName = authMethod === 'GOOGLE' ? 'Usuário Google' : 'Usuário Facebook';
      let finalAvatar = undefined;

      if (!finalEmail) {
          alert("Por favor, entre com um e-mail válido no autenticador.");
          return;
      }

      // If typing a known mock user email, let them log in
      const knownUser = users.find(u => u.email === finalEmail);
      if (knownUser) {
          onLogin(knownUser);
          return;
      }

      // If it's the specific "Jefferson" demo email
      if (finalEmail === 'jefferson.silva@gmail.com') {
          finalName = 'Jefferson Silva';
          finalAvatar = 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80';
      }

      checkUserAndProceed(finalEmail, finalName, finalAvatar);
  };

  const handleEmailAuthSubmit = () => {
      setAuthError(null);
      
      if (!manualEmail.trim()) {
          setAuthError("Digite seu e-mail.");
          return;
      }
      if (!manualPassword.trim()) {
          setAuthError("Crie ou digite sua senha.");
          return;
      }
      if (manualPassword.length < 6) {
          setAuthError("A senha deve ter no mínimo 6 caracteres.");
          return;
      }

      setAuthMethod('EMAIL');
      checkUserAndProceed(manualEmail);
  };

  // --- REGISTRATION LOGIC ---

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      setPhotoError(null);
      setAvatarPreview(null);

      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (file.size > 5 * 1024 * 1024) {
              setPhotoError("A imagem deve ter no máximo 5MB.");
              return;
          }
          setIsAnalyzingPhoto(true);
          try {
              const tempUrl = URL.createObjectURL(file);
              const validation = await validateProfilePicture(file);
              if (validation.isValid) {
                  setAvatarPreview(tempUrl);
              } else {
                  setPhotoError(validation.reason || "Foto inválida.");
                  URL.revokeObjectURL(tempUrl); 
              }
          } catch (err) {
              setPhotoError("Erro ao processar imagem.");
          } finally {
              setIsAnalyzingPhoto(false);
          }
      }
  };

  const validateNickname = (nick: string) => {
      return !users.some(u => u.nickname.toLowerCase() === nick.toLowerCase());
  };

  const handleRegisterSubmit = () => {
      setFormError(null);
      const required = ['name', 'nickname', 'cpf', 'rg', 'phone', 'cep', 'street', 'number', 'city', 'state', 'instrument', 'experienceTime'];
      const missing = required.filter(field => !formData[field as keyof typeof formData]);
      
      if (missing.length > 0 || !avatarPreview) {
          setFormError("Todos os campos e a foto de perfil são obrigatórios.");
          return;
      }

      if (!validateNickname(formData.nickname)) {
          setFormError("Este nickname já está em uso.");
          return;
      }

      registerUser({
          name: formData.name,
          nickname: formData.nickname,
          email: formData.email,
          instrument: formData.instrument,
          experienceTime: formData.experienceTime,
          cpf: formData.cpf,
          rg: formData.rg,
          phone: formData.phone,
          address: {
              cep: formData.cep,
              street: formData.street,
              number: formData.number,
              city: formData.city,
              state: formData.state
          },
          avatarUrl: avatarPreview || undefined
      });
  };

  const inputStyle = "bg-navy-900 border border-navy-600 rounded p-3 text-sm text-bege-100 w-full outline-none focus:border-ocre-500 placeholder-navy-500 transition-colors";

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ocre-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-navy-800 p-8 rounded-2xl border border-navy-700 shadow-2xl z-10 max-h-[95vh] flex flex-col">
        
        {/* LOGO HEADER */}
        {view !== 'SOCIAL_LOGIN_SIMULATION' && (
            <div className="text-center mb-6 flex-shrink-0">
            <div className="w-16 h-16 bg-ocre-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-ocre-900/50">
                <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-serif text-bege-50 font-bold mb-1">BandSocial</h1>
            <p className="text-ocre-500 uppercase tracking-widest text-[10px] font-bold">Portal do Músico</p>
            </div>
        )}

        {/* VIEW 1: INITIAL LOGIN CHOICE */}
        {view === 'LOGIN' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                
                {/* Simulated Auto-Redirect if session exists (UI representation) */}
                {simulatedSession && (
                    <div className="bg-green-900/20 border border-green-500/30 p-3 rounded-lg mb-4 flex items-center gap-3 cursor-pointer hover:bg-green-900/30 transition-colors" onClick={() => setView('DETECTED_ACCOUNT')}>
                        <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center">
                            <img src={simulatedSession.avatarUrl} className="w-full h-full rounded-full" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-green-400 font-bold">Sessão encontrada</p>
                            <p className="text-sm text-bege-50">Continuar como {simulatedSession.name.split(' ')[0]}?</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-green-400" />
                    </div>
                )}

                <div className="space-y-3 animate-fade-in">
                    <h3 className="text-sm font-bold text-bege-50 text-center mb-2">Entrar ou Cadastrar-se</h3>
                    
                    <button 
                        onClick={() => handleSocialLoginClick('GOOGLE')} 
                        className="w-full bg-white text-gray-900 font-bold p-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-lg active:scale-95"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="G" />
                        Continuar com Google
                    </button>

                    <button 
                        onClick={() => handleSocialLoginClick('FACEBOOK')} 
                        className="w-full bg-[#1877F2] text-white font-bold p-4 rounded-xl flex items-center justify-center gap-3 hover:bg-[#166fe5] transition-all shadow-lg active:scale-95"
                    >
                        <Facebook className="w-6 h-6 fill-current" />
                        Continuar com Facebook
                    </button>

                    <div className="flex items-center gap-2 my-4 opacity-50">
                        <div className="h-px bg-bege-200 flex-1"></div>
                        <span className="text-[10px] uppercase font-bold text-bege-200">Ou</span>
                        <div className="h-px bg-bege-200 flex-1"></div>
                    </div>

                    <button 
                        onClick={() => {
                            setManualEmail('');
                            setManualPassword('');
                            setAuthError(null);
                            setView('EMAIL_AUTH');
                        }}
                        className="w-full bg-navy-900 text-bege-100 font-bold p-4 rounded-xl flex items-center justify-center gap-3 hover:bg-navy-700 border border-navy-600 transition-all active:scale-95"
                    >
                        <Mail className="w-5 h-5" />
                        Continuar com E-mail
                    </button>
                </div>

                <div className="border-t border-navy-700 pt-6 mt-4">
                    <p className="text-[10px] text-bege-200/50 uppercase font-bold text-center mb-4">Acesso Rápido (Ambiente de Teste)</p>
                    <div className="space-y-2">
                        {generalManager && (
                            <button onClick={() => onLogin(generalManager)} className="w-full bg-navy-900 hover:bg-navy-700 p-3 rounded-lg flex items-center gap-3 border border-navy-600">
                                <div className="w-8 h-8 bg-ocre-600 rounded-full flex items-center justify-center font-bold text-white">{generalManager.name.charAt(0)}</div>
                                <div className="text-left"><p className="text-sm font-bold text-bege-50">{generalManager.name}</p><p className="text-[10px] text-gray-400">Gestor Geral</p></div>
                            </button>
                        )}
                        {managers.slice(0,2).map(u => (
                             <button key={u.id} onClick={() => onLogin(u)} className="w-full bg-navy-900/50 hover:bg-navy-700 p-2 rounded-lg flex items-center gap-3 border border-navy-700">
                                <div className="w-6 h-6 bg-navy-700 rounded-full flex items-center justify-center font-bold text-xs text-bege-200">{u.name.charAt(0)}</div>
                                <span className="text-xs font-bold text-bege-200">{u.name}</span>
                             </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* VIEW 2: DETECTED ACCOUNT */}
        {view === 'DETECTED_ACCOUNT' && simulatedSession && (
            <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                    <h2 className="text-lg font-bold text-bege-50">Bem-vindo de volta!</h2>
                    <p className="text-xs text-bege-200/60 mt-1">Detectamos uma conta conectada neste dispositivo.</p>
                </div>

                <div className="bg-navy-900 border border-navy-600 rounded-xl p-6 flex flex-col items-center gap-3 shadow-inner">
                     <img src={simulatedSession.avatarUrl} alt={simulatedSession.name} className="w-20 h-20 rounded-full border-4 border-navy-800 shadow-lg" />
                     <div className="text-center">
                         <h3 className="font-bold text-bege-50 text-lg">{simulatedSession.name}</h3>
                         <p className="text-sm text-bege-200/50">{simulatedSession.email}</p>
                         <span className="inline-flex items-center gap-1 text-[10px] bg-navy-800 px-2 py-0.5 rounded-full text-blue-400 mt-2 border border-blue-900/30">
                            {simulatedSession.provider === 'GOOGLE' ? <Chrome className="w-3 h-3"/> : <Facebook className="w-3 h-3"/>}
                            Conta {simulatedSession.provider}
                         </span>
                     </div>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={handleContinueWithDetected}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        Continuar como {simulatedSession.name.split(' ')[0]}
                    </button>
                    
                    <button 
                        onClick={() => setView('LOGIN')}
                        className="w-full text-sm text-bege-200/50 hover:text-white py-2"
                    >
                        Nenhuma dessas contas
                    </button>
                </div>
            </div>
        )}

        {/* VIEW 3: SOCIAL LOGIN SIMULATION (AUTHENTICATOR) */}
        {view === 'SOCIAL_LOGIN_SIMULATION' && (
            <div className="flex-1 flex flex-col h-full animate-fade-in">
                <button onClick={() => setView('LOGIN')} className="text-left text-gray-400 hover:text-white mb-4 flex items-center gap-2 text-sm"><ArrowLeft className="w-4 h-4"/> Cancelar</button>
                
                <div className="flex-1 flex flex-col justify-center h-full">
                    {authMethod === 'GOOGLE' ? (
                        <div className="bg-white text-gray-800 p-8 rounded-xl flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden">
                            {/* Fake Browser Bar */}
                            <div className="absolute top-0 left-0 right-0 h-6 bg-gray-200 flex items-center px-2 gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                <span className="text-[8px] text-gray-500 ml-2">accounts.google.com</span>
                            </div>

                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-12 h-12 mb-2 mt-4" alt="Google" />
                            <h3 className="text-xl font-medium text-center">Fazer login com o Google</h3>
                            <p className="text-sm text-gray-600 text-center">Prosseguir para <strong>BandSocial</strong></p>
                            
                            <div className="w-full space-y-4 mt-6">
                                <div className="border border-gray-300 rounded px-3 py-2 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                                    <p className="text-xs text-gray-500">Email ou telefone</p>
                                    <input 
                                        className="w-full outline-none text-gray-900 text-sm bg-white" 
                                        value={socialEmailInput}
                                        onChange={(e) => setSocialEmailInput(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-blue-600 font-bold cursor-pointer hover:underline">Esqueceu seu e-mail?</span>
                                </div>
                                <p className="text-xs text-gray-500">Não está no seu computador? Use o modo Convidado para fazer login com privacidade.</p>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => setView('LOGIN')} className="text-blue-600 font-bold text-sm px-4 py-2 rounded hover:bg-blue-50">Criar conta</button>
                                    <button onClick={handleSocialLoginSubmit} className="bg-[#1a73e8] text-white font-medium px-6 py-2 rounded hover:bg-[#1557b0] transition-colors shadow">Próxima</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#f0f2f5] text-gray-900 p-8 rounded-xl flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden">
                             {/* Fake Browser Bar */}
                             <div className="absolute top-0 left-0 right-0 h-6 bg-gray-300 flex items-center px-2 gap-1 border-b border-gray-400">
                                <span className="text-[8px] text-gray-600 ml-auto mr-auto">facebook.com/login</span>
                            </div>

                            <Facebook className="w-16 h-16 text-[#1877F2] mb-2 mt-6" />
                            
                            <div className="w-full space-y-3 mt-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <p className="text-center text-sm mb-4">Faça login no Facebook para usar sua conta com <strong>BandSocial</strong>.</p>
                                <input 
                                    className="w-full bg-white text-gray-800 border border-gray-300 rounded p-3 text-sm placeholder-gray-500 focus:border-blue-500 outline-none" 
                                    placeholder="Email ou telefone" 
                                    value={socialEmailInput}
                                    onChange={(e) => setSocialEmailInput(e.target.value)}
                                    autoFocus
                                />
                                <input className="w-full bg-white text-gray-800 border border-gray-300 rounded p-3 text-sm placeholder-gray-500 focus:border-blue-500 outline-none" type="password" placeholder="Senha" defaultValue="123456" />
                                <button onClick={handleSocialLoginSubmit} className="w-full bg-[#1877F2] text-white font-bold py-3 rounded hover:bg-[#166fe5] transition-colors shadow-lg mt-2">Entrar</button>
                                <div className="text-center mt-2">
                                    <a href="#" className="text-xs text-[#1877F2] hover:underline">Esqueceu a conta?</a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* VIEW 4: EMAIL/PASSWORD AUTH */}
        {view === 'EMAIL_AUTH' && (
            <div className="space-y-6 animate-fade-in flex flex-col h-full">
                <button onClick={() => setView('LOGIN')} className="self-start text-bege-200/50 hover:text-white flex items-center gap-2 text-xs mb-2">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </button>

                <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-navy-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-navy-700">
                        <Mail className="w-8 h-8 text-ocre-500" />
                    </div>
                    <h2 className="text-xl font-bold text-bege-50">Acesse sua conta</h2>
                    <p className="text-sm text-bege-200/60 mt-1">Digite seu e-mail e senha para entrar ou se cadastrar.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-bege-200 mb-1 block uppercase">E-mail</label>
                        <input 
                            autoFocus
                            type="email"
                            placeholder="exemplo@email.com" 
                            value={manualEmail} 
                            onChange={e => {
                                setManualEmail(e.target.value);
                                setAuthError(null);
                            }} 
                            className="bg-navy-900 border border-navy-600 rounded-lg p-4 text-base text-bege-100 w-full outline-none focus:border-ocre-500 placeholder-navy-500 transition-colors" 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-bege-200 mb-1 block uppercase">Senha</label>
                        <div className="relative">
                            <input 
                                type="password"
                                placeholder="******" 
                                value={manualPassword} 
                                onChange={e => {
                                    setManualPassword(e.target.value);
                                    setAuthError(null);
                                }} 
                                className="bg-navy-900 border border-navy-600 rounded-lg p-4 text-base text-bege-100 w-full outline-none focus:border-ocre-500 placeholder-navy-500 transition-colors" 
                            />
                            <Lock className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">* Se for seu primeiro acesso, esta será sua senha de cadastro.</p>
                    </div>

                    {authError && (
                        <p className="text-red-400 text-xs mt-2 flex items-center gap-1 font-bold animate-pulse">
                            <AlertCircle className="w-3 h-3" /> {authError}
                        </p>
                    )}
                    
                    <button 
                        onClick={handleEmailAuthSubmit} 
                        className="w-full bg-ocre-600 hover:bg-ocre-500 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4"
                    >
                        Entrar / Cadastrar <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

        {/* VIEW 5: REGISTER FORM */}
        {view === 'REGISTER_FORM' && (
            <div className="flex-1 flex flex-col h-full animate-fade-in overflow-hidden">
                <h2 className="text-lg font-bold text-bege-50 mb-4 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-ocre-500" /> Finalizar Cadastro
                </h2>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-4">
                    
                    {/* Photo Upload with AI Check */}
                    <div className="flex flex-col items-center mb-4">
                        <div 
                            onClick={() => !isAnalyzingPhoto && fileInputRef.current?.click()}
                            className={`w-24 h-24 rounded-full bg-[#0b1120] border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden relative group ${
                                isAnalyzingPhoto ? 'border-ocre-500' : photoError ? 'border-red-500' : 'border-navy-600 hover:border-ocre-500'
                            }`}
                        >
                            {isAnalyzingPhoto ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 text-ocre-500 animate-spin mb-1" />
                                    <span className="text-[8px] text-ocre-500 font-bold uppercase animate-pulse">Analisando</span>
                                </div>
                            ) : avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className={`w-8 h-8 ${photoError ? 'text-red-500' : 'text-navy-500 group-hover:text-ocre-500'}`} />
                            )}
                            
                            {!isAnalyzingPhoto && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-white font-bold">{avatarPreview ? 'Trocar' : 'Enviar'}</span>
                                </div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleAvatarChange} 
                            disabled={isAnalyzingPhoto}
                        />
                        
                        {/* Validation Feedback */}
                        {isAnalyzingPhoto ? (
                            <span className="text-xs text-ocre-500 mt-2 flex items-center gap-1 font-bold">
                                <Sparkles className="w-3 h-3" /> Verificando foto com IA...
                            </span>
                        ) : photoError ? (
                            <span className="text-xs text-red-400 mt-2 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {photoError}
                            </span>
                        ) : avatarPreview ? (
                            <span className="text-xs text-green-500 mt-2 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Foto Aprovada
                            </span>
                        ) : (
                            <span className="text-xs text-bege-200/50 mt-2 text-center max-w-[200px]">
                                * Foto visível e nítida do rosto (Obrigatório)
                            </span>
                        )}
                    </div>

                    <div className="space-y-3">
                        {/* Identity */}
                        <div className="grid grid-cols-1 gap-3">
                            <input placeholder="Nome Completo *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputStyle} />
                            <input placeholder="Nickname (Único) *" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} className={inputStyle} />
                        </div>

                        {/* Email - READONLY (Authentication Verified) */}
                        <div className="relative">
                            <div className="absolute -top-2 left-2 bg-navy-800 px-1 text-[10px] text-green-500 font-bold z-10 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Autenticado
                            </div>
                            <input 
                                placeholder="Email" 
                                value={formData.email} 
                                readOnly 
                                className={`${inputStyle} opacity-70 cursor-not-allowed border-green-900/50 bg-navy-950 text-green-100`} 
                            />
                            <div className="absolute right-3 top-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                        </div>

                        {/* Docs */}
                        <div className="grid grid-cols-2 gap-3">
                            <input placeholder="CPF *" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className={inputStyle} />
                            <input placeholder="RG *" value={formData.rg} onChange={e => setFormData({...formData, rg: e.target.value})} className={inputStyle} />
                        </div>

                        <input placeholder="Telefone / WhatsApp *" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputStyle} />

                        {/* Address */}
                        <div className="space-y-2 pt-2 border-t border-navy-700">
                            <p className="text-xs text-ocre-500 font-bold uppercase">Endereço</p>
                            <div className="grid grid-cols-2 gap-3">
                                <input placeholder="CEP *" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} className={inputStyle} />
                                <select value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className={inputStyle}>
                                    <option value="">Estado *</option>
                                    {BRAZIL_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                                </select>
                            </div>
                            <input placeholder="Cidade *" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className={inputStyle} />
                            <div className="flex gap-3">
                                <input placeholder="Rua/Av *" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className={inputStyle} />
                                <input placeholder="Nº *" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className={`${inputStyle} w-24`} />
                            </div>
                        </div>

                        {/* Musical Info */}
                        <div className="space-y-2 pt-2 border-t border-navy-700">
                            <p className="text-xs text-ocre-500 font-bold uppercase">Dados Musicais</p>
                            <input placeholder="Instrumento *" value={formData.instrument} onChange={e => setFormData({...formData, instrument: e.target.value})} className={inputStyle} />
                            <input placeholder="Tempo de Prática (ex: 5 anos) *" value={formData.experienceTime} onChange={e => setFormData({...formData, experienceTime: e.target.value})} className={inputStyle} />
                        </div>
                    </div>

                    {formError && (
                        <div className="bg-red-900/50 border border-red-500/50 p-3 rounded text-xs text-red-200 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                        </div>
                    )}
                </div>

                <div className="pt-4 mt-auto flex gap-3">
                    <button 
                        onClick={() => {
                            // Cancel registration goes back to login choice
                            setView('LOGIN');
                        }} 
                        className="px-4 py-3 rounded-lg font-bold text-bege-200 hover:text-white border border-navy-600"
                        disabled={isAnalyzingPhoto}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleRegisterSubmit} 
                        disabled={isAnalyzingPhoto || !avatarPreview}
                        className="flex-1 bg-ocre-600 hover:bg-ocre-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2"
                    >
                        {isAnalyzingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        Finalizar Cadastro
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
