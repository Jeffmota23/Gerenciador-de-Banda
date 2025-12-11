
import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  UserRole, User, RepertoireItem, ItemType, DeletedItem, PostItem, FinanceItem, EventItem,
  AppContextType, AttendanceStatus, AttendanceRecord, NewsSource, EventType
} from './types';
import { MOCK_USERS, INITIAL_REPERTOIRE, SEVEN_DAYS_MS, MOCK_FINANCES, INITIAL_EVENTS, XP_MATRIX, INITIAL_POSTS } from './constants';
import { TrashBin } from './components/TrashBin';
import { Repertoire } from './components/Repertoire';
import { StudyStudio } from './components/StudyStudio';
import { Community } from './components/Community';
import { Profile } from './components/Profile';
import { Finances } from './components/Finances';
import { Agenda } from './components/Agenda';
import { Wall } from './components/Wall'; 
import { AuthScreen } from './components/AuthScreen';
import { 
  LayoutDashboard, Users, Calendar, LibraryBig, 
  Settings, Info, ShieldAlert, LogOut, Video, Landmark, Briefcase, Menu, X, ChevronUp, AlertTriangle, Plus, MapPin, Search, CheckSquare, Square, Check
} from 'lucide-react';

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [repertoire, setRepertoire] = useState<RepertoireItem[]>(INITIAL_REPERTOIRE);
  const [trashBin, setTrashBin] = useState<DeletedItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>(INITIAL_POSTS);
  const [finances, setFinances] = useState<FinanceItem[]>(MOCK_FINANCES);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [newsSources, setNewsSources] = useState<NewsSource[]>([]);

  useEffect(() => {
    if (currentUser) {
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? currentUser : u));
    }
  }, [currentUser]);

  // --- XP ENGINE CORE LOGIC ---
  const applyXpChange = (userId: string, amount: number) => {
      if (amount === 0) return;
      
      // Update Current User if needed
      if (currentUser && currentUser.id === userId) {
          setCurrentUser(prev => prev ? ({ ...prev, xp: prev.xp + amount }) : null);
      }

      // Update All Users Database
      setAllUsers(prev => prev.map(u => {
          if (u.id === userId) {
              return { ...u, xp: u.xp + amount };
          }
          return u;
      }));
  };

  const deleteItem = (itemId: string, reason: string) => {
    const itemToDelete = 
      repertoire.find(i => i.id === itemId) || 
      events.find(i => i.id === itemId) ||
      posts.find(i => i.id === itemId);
    
    if (itemToDelete) {
      if (itemToDelete.type === ItemType.REPERTOIRE) {
         setRepertoire(prev => prev.filter(i => i.id !== itemId));
      } else if (itemToDelete.type === ItemType.EVENT) {
         setEvents(prev => prev.filter(i => i.id !== itemId));
      } else if (itemToDelete.type === ItemType.POST) {
         setPosts(prev => prev.filter(i => i.id !== itemId));
      }
      
      if (currentUser) {
        const deletedItem: DeletedItem = {
          originalItem: itemToDelete as any,
          deletedAt: Date.now(),
          deletedBy: currentUser.name,
          reason: reason,
          expiresAt: Date.now() + SEVEN_DAYS_MS,
        };
        setTrashBin(prev => [...prev, deletedItem]);
      }
    }
  };

  const restoreItem = (itemId: string) => {
    const deletedEntry = trashBin.find(d => d.originalItem.id === itemId);
    if (deletedEntry) {
      setTrashBin(prev => prev.filter(d => d.originalItem.id !== itemId));
      
      if (deletedEntry.originalItem.type === ItemType.REPERTOIRE) {
        setRepertoire(prev => [...prev, deletedEntry.originalItem as RepertoireItem]);
      } else if (deletedEntry.originalItem.type === ItemType.EVENT) {
        setEvents(prev => [...prev, deletedEntry.originalItem as EventItem]);
      } else if (deletedEntry.originalItem.type === ItemType.POST) {
        setPosts(prev => [...prev, deletedEntry.originalItem as PostItem]);
      }
    }
  };

  const addRepertoire = (item: any) => {
    if (!currentUser) return;
    const newItem: RepertoireItem = {
      ...item,
      id: `r${Date.now()}`,
      type: ItemType.REPERTOIRE,
      createdAt: Date.now(),
      authorId: currentUser.id,
      key: item.key || 'C Major', 
    };
    setRepertoire(prev => [newItem, ...prev]);
  };

  const addPost = (post: any) => {
    if (!currentUser) return;
    const newPost: PostItem = {
       ...post,
       id: `p${Date.now()}`,
       type: ItemType.POST,
       createdAt: Date.now(),
       authorId: currentUser.name, 
       likes: 0,
       comments: 0
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const votePoll = (postId: string, optionId: string) => {
    if (!currentUser) return;

    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id !== postId || !post.poll) return post;

      const poll = post.poll;
      const isMultiple = poll.allowMultiple;
      
      const hasVotedThisOption = poll.options.find(o => o.id === optionId)?.votes.includes(currentUser.id);
      const hasVotedAny = poll.options.some(o => o.votes.includes(currentUser.id));

      if (!isMultiple && hasVotedAny && !hasVotedThisOption) {
        const newOptions = poll.options.map(opt => ({
           ...opt,
           votes: opt.id === optionId 
             ? [...opt.votes, currentUser.id] 
             : opt.votes.filter(uid => uid !== currentUser.id)
        }));
        return { ...post, poll: { ...poll, options: newOptions }};
      }

      const newOptions = poll.options.map(opt => {
        if (opt.id === optionId) {
          const votes = opt.votes.includes(currentUser.id)
            ? opt.votes.filter(uid => uid !== currentUser.id)
            : [...opt.votes, currentUser.id];
          return { ...opt, votes };
        }
        return opt;
      });

      return { ...post, poll: { ...poll, options: newOptions }};
    }));
  };

  const toggleFinanceApproval = (id: string) => {
    setFinances(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, approvals: item.approvals + 1 };
      }
      return item;
    }));
  };

  const addEvent = (eventData: any) => {
    if (!currentUser) return;
    
    // Check if there are initial attendees (e.g., Creator auto-confirm for Individual Study)
    // and apply XP immediately.
    if (eventData.attendees && eventData.attendees.length > 0) {
        eventData.attendees.forEach((att: AttendanceRecord) => {
            if (att.xpAwarded > 0) {
                applyXpChange(att.userId, att.xpAwarded);
            }
        });
    }

    const newEvent: EventItem = {
      ...eventData,
      id: `e${Date.now()}`,
      type: ItemType.EVENT,
      createdAt: Date.now(),
      authorId: currentUser.id,
      attendees: eventData.attendees || [] // Use passed attendees, don't overwrite
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const addNewsSource = (source: any) => {
     const newSource: NewsSource = {
         ...source,
         id: `ns${Date.now()}`,
         status: 'ACTIVE'
     };
     setNewsSources(prev => [...prev, newSource]);
  };

  // Handles RSVP (User Action)
  const handleEventAction = (eventId: string, userId: string, action: 'CONFIRM' | 'CANCEL') => {
    setEvents(prevEvents => prevEvents.map(event => {
       if (event.id !== eventId) return event;

       const record = event.attendees.find(a => a.userId === userId);
       const matrix = XP_MATRIX[event.eventType] || { confirm: 20, completion: 30 }; 
       let newAttendees = [...event.attendees];

       if (action === 'CONFIRM') {
           // Rule: Confirm adds +20 (matrix.confirm)
           const isAlreadyConfirmed = record && record.status === AttendanceStatus.CONFIRMED;

           if (!isAlreadyConfirmed) {
               const xpGain = matrix.confirm;
               applyXpChange(userId, xpGain);

               if (!record) {
                   newAttendees.push({
                       userId,
                       status: AttendanceStatus.CONFIRMED,
                       timestamp: Date.now(),
                       xpAwarded: xpGain
                   });
               } else {
                   newAttendees = newAttendees.map(a => a.userId === userId ? {
                       ...a,
                       status: AttendanceStatus.CONFIRMED,
                       timestamp: Date.now(),
                       xpAwarded: xpGain // Track this specific gain
                   } : a);
               }
           }
       } else if (action === 'CANCEL') {
           if (record) {
               const isLate = Date.now() > event.rsvpDeadline;
               const prevXp = record.xpAwarded; // XP they currently hold (e.g., 20)

               if (isLate) {
                   // Rule: Lose confirmation points (20) AND additional 20. Total loss = 40.
                   // The user currently has +20. To reach -20 (net state), we subtract 40.
                   
                   const penaltyState = -matrix.confirm; // Target state for Late Cancel (-20)
                   const correction = penaltyState - prevXp; // -20 - 20 = -40
                   
                   applyXpChange(userId, correction);
                   
                   newAttendees = newAttendees.map(a => a.userId === userId ? {
                       ...a,
                       status: AttendanceStatus.LATE_CANCEL,
                       xpAwarded: penaltyState
                   } : a);
               } else {
                   // Rule: Lose confirmation points (20). Back to 0.
                   applyXpChange(userId, -prevXp); 
                   
                   // Remove record to allow clean slate re-confirm
                   newAttendees = newAttendees.filter(a => a.userId !== userId);
               }
           }
       }

       return { ...event, attendees: newAttendees };
    }));
  };

  // Handles Attendance Marking (Manager Action)
  const markAttendance = (eventId: string, userId: string, status: AttendanceStatus.PRESENT | AttendanceStatus.ABSENT) => {
      setEvents(prevEvents => prevEvents.map(event => {
          if (event.id !== eventId) return event;

          const record = event.attendees.find(a => a.userId === userId);
          if (!record) return event; 

          const matrix = XP_MATRIX[event.eventType] || { confirm: 20, completion: 30 };
          const prevXp = record.xpAwarded;
          let newXp = 0;

          if (status === AttendanceStatus.PRESENT) {
              // Rule: Confirm + Completion. (e.g., 20 + 80 = 100)
              newXp = matrix.confirm + matrix.completion;
          } else if (status === AttendanceStatus.ABSENT) {
              // Rule: Lose (Confirm + Complete) * 2. 
              // Example: (20 + 80) * 2 = 200. So Target is -200.
              const totalPot = matrix.confirm + matrix.completion;
              newXp = -(totalPot * 2);
          }

          // Correction delta to apply to User
          const correction = newXp - prevXp;
          applyXpChange(userId, correction);

          const newAttendees = event.attendees.map(a => a.userId === userId ? {
              ...a,
              status: status,
              xpAwarded: newXp
          } : a);

          return { ...event, attendees: newAttendees };
      }));
  };

  const toggleFollow = (targetUserId: string) => {
    if (!currentUser) return;
    setCurrentUser(prev => {
      if(!prev) return null;
      const isFollowing = prev.following.includes(targetUserId);
      const newFollowing = isFollowing 
        ? prev.following.filter(id => id !== targetUserId)
        : [...prev.following, targetUserId];
      return { ...prev, following: newFollowing };
    });

    setAllUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
         const isFollowing = u.following.includes(targetUserId);
         const newFollowing = isFollowing 
          ? u.following.filter(id => id !== targetUserId)
          : [...u.following, targetUserId];
         return { ...u, following: newFollowing };
      }
      return u;
    }));
  };

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser, users: allUsers, repertoire, trashBin, posts, finances, events, newsSources,
      deleteItem, restoreItem, addRepertoire, addPost, votePoll, toggleFinanceApproval, addEvent, toggleFollow,
      handleEventAction, markAttendance, addNewsSource
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// --- Updated Floating Navigation Components (Pill Style from Image 1) ---

const NavItem = ({ to, icon: Icon, active, onClick }: any) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`p-3 rounded-full transition-all duration-300 ${
      active 
        ? 'bg-ocre-600 text-white shadow-lg scale-110' 
        : 'text-bege-200/60 hover:text-white hover:bg-white/10'
    }`}
  >
    <Icon className="w-5 h-5" />
  </Link>
);

const FloatingNavigation = ({ isManager }: { isManager: boolean }) => {
  const location = useLocation();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-navy-900/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/80 px-2 py-2 flex items-center gap-1">
        <NavItem to="/" icon={LayoutDashboard} active={location.pathname === '/'} />
        <NavItem to="/community" icon={Users} active={location.pathname === '/community'} />
        <NavItem to="/agenda" icon={Calendar} active={location.pathname === '/agenda'} />
        
        <div className="w-px h-6 bg-white/10 mx-2"></div>
        
        <NavItem to="/tools" icon={Briefcase} active={location.pathname === '/tools'} />
        <NavItem to="/repertoire" icon={LibraryBig} active={location.pathname === '/repertoire'} />
        <NavItem to="/finances" icon={Landmark} active={location.pathname === '/finances'} />
        
        <div className="w-px h-6 bg-white/10 mx-2"></div>
        
        {isManager ? (
          <NavItem to="/admin" icon={ShieldAlert} active={location.pathname.startsWith('/admin')} />
        ) : (
          <NavItem to="/profile" icon={Settings} active={location.pathname === '/profile'} />
        )}
      </div>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();

  if (!currentUser) return <>{children}</>;
  const isManager = currentUser.role !== UserRole.MEMBER;

  return (
    <div className="min-h-screen bg-navy-950 text-bege-100 font-sans selection:bg-ocre-500/30 pb-24 md:pb-28">
      {/* Removed Top Header to give more focus to content, except for branding in specific pages if needed. 
          Actually keeping a minimal one for profile access */}
      <header className="fixed top-0 left-0 right-0 h-16 pointer-events-none z-40 px-4 md:px-8 flex items-center justify-between">
         {/* Branding is now inside pages mostly, but we keep profile shortcut */}
         <div />
         <Link to="/profile" className="pointer-events-auto mt-4 bg-navy-900/80 backdrop-blur border border-white/10 p-1 pr-3 rounded-full flex items-center gap-2 shadow-lg hover:scale-105 transition-transform">
            <div className="w-8 h-8 rounded-full bg-ocre-600 flex items-center justify-center font-bold text-white text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <span className="text-xs font-bold text-bege-50 hidden md:block">{currentUser.name.split(' ')[0]}</span>
         </Link>
      </header>

      <main className="pt-8 px-4 md:px-8 max-w-7xl mx-auto transition-all duration-300">
         {children}
      </main>
      <FloatingNavigation isManager={isManager} />
    </div>
  );
};

// --- Updated Admin Dashboard with Strict RBAC ---

const AdminDashboard = () => {
  const { currentUser, trashBin, users, newsSources, addNewsSource, addEvent, markAttendance, events, deleteItem, restoreItem } = useApp();
  const [newsUrl, setNewsUrl] = useState('');
  const [newsName, setNewsName] = useState('');
  const [promoteModal, setPromoteModal] = useState<User | null>(null);

  // Quick Agenda State
  const [quickEventTitle, setQuickEventTitle] = useState('');
  const [quickEventDate, setQuickEventDate] = useState('');
  const [quickEventType, setQuickEventType] = useState('GROUP'); // Group vs Individual

  const location = useLocation();
  const showTrash = location.hash.includes('trash');

  if (!currentUser) return <div>Acesso Negado</div>;

  // --- MEMBER VIEW WIDGET (VISIBLE TO ALL) ---
  const memberStatsWidget = (
     <div className="bg-navy-900 rounded-xl p-6 shadow-xl border border-navy-700 col-span-full md:col-span-1">
         <div className="flex justify-between items-start mb-4">
             <div>
                 <h3 className="font-bold text-lg text-bege-50">Minha Performance</h3>
                 <p className="text-xs text-bege-200">Visão de Membro</p>
             </div>
             <div className="text-right">
                 <p className="text-2xl font-serif text-ocre-500 font-bold">{currentUser.xp} XP</p>
                 <p className="text-xs text-bege-200/50 uppercase">Nível {currentUser.level}</p>
             </div>
         </div>
         <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden mb-4">
             <div className="bg-ocre-600 h-full" style={{ width: `${(currentUser.xp % 1000) / 10}%` }}></div>
         </div>
         <div className="flex justify-between items-center text-sm">
             <span className="text-bege-200">Frequência: <strong className="text-green-400">{currentUser.attendanceRate}%</strong></span>
             <Link to="/profile" className="text-xs font-bold text-blue-400 hover:text-blue-300">Ver Perfil Completo</Link>
         </div>
     </div>
  );

  // --- STRICT RBAC CHECKS ---
  const isGeneralManager = currentUser.role === UserRole.GENERAL_MANAGER;

  const isAgendaManager = isGeneralManager || 
                          currentUser.role === UserRole.AGENDA_MANAGER_1 || 
                          currentUser.role === UserRole.AGENDA_MANAGER_2;

  const isWallManager = isGeneralManager || 
                        currentUser.role === UserRole.WALL_MANAGER_1 || 
                        currentUser.role === UserRole.WALL_MANAGER_2;

  const isPeopleManager = isGeneralManager || 
                          currentUser.role === UserRole.PEOPLE_MANAGER_1 || 
                          currentUser.role === UserRole.PEOPLE_MANAGER_2;

  const handleAddSource = () => {
      if(newsUrl && newsName) {
          addNewsSource({ name: newsName, url: newsUrl });
          setNewsName('');
          setNewsUrl('');
      }
  };

  const handleQuickEvent = () => {
      if(quickEventTitle && quickEventDate) {
          addEvent({
              title: quickEventTitle,
              date: new Date(quickEventDate).getTime(),
              timeStr: '19:00', // Default
              durationMinutes: 120,
              eventType: EventType.REHEARSAL, // Default
              rsvpDeadline: Date.now() + 86400000,
              location: 'Sede',
              givesXp: true,
              attendees: []
          });
          setQuickEventTitle('');
          setQuickEventDate('');
          alert('Evento Criado!');
      }
  };

  return (
    <div className="pb-24">
      <header className="mb-6 flex justify-between items-center bg-navy-900 p-4 rounded-xl border border-navy-700">
         <h1 className="text-xl font-bold text-bege-50">
             Painel Administrativo
             <span className="block text-xs font-normal text-bege-200 mt-1 uppercase tracking-wider">{currentUser.role.replace(/_/g, ' ')}</span>
         </h1>
         {isGeneralManager && (
            <div className="flex gap-2">
                <Link to="/admin#trash" className="text-xs bg-navy-800 px-3 py-1.5 rounded border border-navy-600 hover:border-ocre-500 text-bege-100">
                Lixeira ({trashBin.length})
                </Link>
            </div>
         )}
      </header>

      {showTrash && isGeneralManager ? (
          <TrashBin items={trashBin} userRole={currentUser.role} onRestore={restoreItem} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {memberStatsWidget}

            {/* WIDGET 1: GESTÃO DE CARGOS (Checklist Style) - ONLY GM */}
            {isGeneralManager && (
                <div className="bg-white rounded-xl p-6 shadow-xl text-navy-900 overflow-hidden">
                    <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-100">
                        <h3 className="font-bold text-lg">Gestão de Cargos <span className="text-xs font-normal text-gray-400">(Apenas Gestor Geral)</span></h3>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                        {users.map(u => (
                            <div key={u.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <button 
                                    onClick={() => setPromoteModal(u)}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${u.role !== UserRole.MEMBER ? 'bg-ocre-500 border-ocre-500' : 'border-gray-300 hover:border-ocre-500'}`}
                                    >
                                        {u.role !== UserRole.MEMBER && <CheckSquare className="w-3 h-3 text-white" />}
                                    </button>
                                    <div>
                                        <p className="text-sm font-bold text-navy-800">{u.name}</p>
                                        <p className="text-xs text-gray-400">{u.role.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>
                                <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    Editar
                                </button>
                            </div>
                        ))}
                    </div>
                    {/* Mock Modal for Confirmation */}
                    {promoteModal && (
                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center p-6 text-center animate-fade-in z-10">
                            <div>
                                <h4 className="font-bold text-lg mb-2">Promover {promoteModal.name}?</h4>
                                <p className="text-sm text-gray-500 mb-4">Tem certeza que irá promover este usuário?</p>
                                <div className="flex gap-2 justify-center">
                                    <button onClick={() => setPromoteModal(null)} className="px-4 py-2 bg-gray-200 rounded text-sm font-bold">Cancelar</button>
                                    <button onClick={() => setPromoteModal(null)} className="px-4 py-2 bg-ocre-500 text-white rounded text-sm font-bold">Confirmar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* WIDGET 2: FONTES DE NOTÍCIAS (Input List) - WALL MANAGER & GM */}
            {isWallManager && (
                <div className="bg-white rounded-xl p-6 shadow-xl text-navy-900">
                    <h3 className="font-bold text-lg mb-4 border-b pb-2 border-gray-100">Fontes de Notícias por IA <span className="text-xs font-normal text-gray-400">(Mural)</span></h3>
                    
                    <div className="flex gap-2 mb-4">
                        <input 
                            value={newsName} onChange={e => setNewsName(e.target.value)}
                            placeholder="Nome da Fonte" 
                            className="flex-1 bg-gray-50 border border-gray-200 p-2 rounded text-sm outline-none focus:border-ocre-500"
                        />
                        <button onClick={handleAddSource} className="bg-ocre-500 text-white px-3 rounded font-bold text-xs uppercase">Cadastrar</button>
                    </div>
                    <input 
                        value={newsUrl} onChange={e => setNewsUrl(e.target.value)}
                        placeholder="Link do Site/Perfil (ex: instagram.com/banda)" 
                        className="w-full bg-gray-50 border border-gray-200 p-2 rounded text-sm mb-4 outline-none focus:border-ocre-500"
                    />

                    <div className="space-y-2">
                        <div className="grid grid-cols-4 text-xs font-bold text-gray-400 uppercase">
                            <span className="col-span-2">Nome</span>
                            <span>Status</span>
                            <span className="text-right">Ação</span>
                        </div>
                        {newsSources.map(src => (
                            <div key={src.id} className="grid grid-cols-4 text-sm items-center py-2 border-b border-gray-50">
                                <span className="col-span-2 font-bold text-navy-700">{src.name}</span>
                                <span className="text-green-500 text-xs font-bold uppercase">{src.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}</span>
                                <div className="text-right">
                                    <button className="text-xs text-red-400 hover:text-red-600 font-bold">Pausar</button>
                                </div>
                            </div>
                        ))}
                        {newsSources.length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">Nenhuma fonte cadastrada.</p>}
                    </div>
                </div>
            )}

            {/* WIDGET 3: CRIAR AGENDA (Mini Form) - AGENDA MANAGER & GM */}
            {isAgendaManager && (
                <div className="bg-white rounded-xl p-6 shadow-xl text-navy-900 relative">
                    <h3 className="font-bold text-lg mb-4">Criar Agenda <span className="text-xs font-normal text-gray-400">(Rápido)</span></h3>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-gray-400">Título de Evento</label>
                            <input 
                                value={quickEventTitle} onChange={e => setQuickEventTitle(e.target.value)}
                                className="w-full border-b border-gray-200 py-1 text-sm font-bold focus:border-ocre-500 outline-none text-navy-800"
                                placeholder="Ensaio..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-400">Data</label>
                                <input type="date" value={quickEventDate} onChange={e => setQuickEventDate(e.target.value)} className="w-full border-b border-gray-200 py-1 text-sm" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-400">Hora</label>
                                <div className="py-1 text-sm border-b border-gray-200 text-gray-500">19:00 (Padrão)</div>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-1 block">Tipo de Estudo</label>
                            <div className="flex gap-2">
                                <button 
                                onClick={() => setQuickEventType('GROUP')}
                                className={`flex-1 py-1 rounded border text-xs font-bold ${quickEventType === 'GROUP' ? 'bg-navy-800 text-white border-navy-800' : 'bg-white border-gray-200 text-gray-500'}`}
                                >
                                    Em Grupo
                                </button>
                                <button 
                                onClick={() => setQuickEventType('INDIVIDUAL')}
                                className={`flex-1 py-1 rounded border text-xs font-bold ${quickEventType === 'INDIVIDUAL' ? 'bg-navy-800 text-white border-navy-800' : 'bg-white border-gray-200 text-gray-500'}`}
                                >
                                    Individual
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="border border-dashed border-gray-300 rounded p-2 flex items-center gap-2 text-gray-400 cursor-pointer hover:bg-gray-50">
                                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"><MapPin className="w-4 h-4"/></div>
                                <span className="text-xs">Buscar no Mapa Satélite</span>
                            </div>
                        </div>

                        <button onClick={handleQuickEvent} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-bold shadow-lg mt-2">
                            Cria Evento
                        </button>
                    </div>
                </div>
            )}

            {/* WIDGET 4: LISTA DE PRESENÇA (Quick View) - PEOPLE MANAGER & GM */}
            {isPeopleManager && (
                <div className="bg-white rounded-xl p-6 shadow-xl text-navy-900">
                    <h3 className="font-bold text-lg mb-4">Lista de Presença <span className="text-xs font-normal text-gray-400">(Pessoas)</span></h3>
                    
                    <div className="space-y-2">
                        {users.slice(0, 5).map(u => (
                            <div key={u.id} className="flex items-center justify-between border-b border-gray-50 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 border rounded ${Math.random() > 0.5 ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                        {Math.random() > 0.5 && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm text-navy-700">{u.name}</span>
                                </div>
                                <div className="flex gap-1">
                                    <div className="w-4 h-4 rounded border border-gray-200"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-gray-400">Exportar PDF</span>
                        <button className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold">Salvar Presença</button>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

const MainApp = () => {
  const { currentUser, setCurrentUser, users, repertoire, posts, finances, events, deleteItem, addRepertoire, addPost, votePoll, toggleFinanceApproval, addEvent, handleEventAction, markAttendance, toggleFollow } = useApp();
  const navigate = useNavigate();

  const handleStudyPost = (content: string, videoBlob: Blob, visibility: 'PUBLIC' | 'FOLLOWERS', location?: any) => {
    const videoUrl = URL.createObjectURL(videoBlob);
    addPost({
      title: 'Sessão de Estudo',
      postType: 'TEXT',
      content,
      videoUrl,
      visibility,
      location
    });
    navigate('/community');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Wall currentUser={currentUser} posts={posts} events={events} onAddPost={addPost} onVote={votePoll} onDelete={deleteItem} />} />
        <Route path="/community" element={<Community posts={posts} currentUser={currentUser} allUsers={users} onToggleFollow={toggleFollow} onAddPost={addPost} />} />
        <Route path="/tools" element={<StudyStudio currentUser={currentUser} onPost={handleStudyPost} />} />
        <Route 
          path="/agenda" 
          element={
            <Agenda 
              events={events} 
              currentUser={currentUser} 
              onAddEvent={addEvent} 
              onEventAction={handleEventAction}
              onMarkAttendance={markAttendance}
              onDelete={deleteItem}
              allUsers={users}
            />
          } 
        />
        <Route 
          path="/repertoire" 
          element={
            <Repertoire 
              items={repertoire} 
              currentUser={currentUser} 
              onDelete={deleteItem}
              onAdd={addRepertoire}
            />
          } 
        />
        <Route 
          path="/finances" 
          element={
            <Finances 
              items={finances} 
              onToggleApproval={toggleFinanceApproval} 
            />
          } 
        />
        <Route path="/profile" element={<Profile user={currentUser} onLogout={handleLogout} />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <MainApp />
      </HashRouter>
    </AppProvider>
  );
}
