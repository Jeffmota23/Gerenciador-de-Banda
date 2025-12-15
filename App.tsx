
import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  UserRole, User, RepertoireItem, ItemType, DeletedItem, PostItem, FinanceItem, EventItem,
  AppContextType, AttendanceStatus, AttendanceRecord, NewsSource, EventType, Comment, LocationData, UserSettings
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
import { AdminPanel } from './components/AdminPanel';
import { AuthScreen } from './components/AuthScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { 
  LayoutDashboard, Users, Calendar, LibraryBig, 
  Settings, Info, ShieldAlert, LogOut, Video, Landmark, Briefcase, Menu, X, ChevronUp, AlertTriangle, Plus, MapPin, Search, CheckSquare, Square, Check, Bell, BellRing, WifiOff, Download
} from 'lucide-react';

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    push: true,
    email: true,
    events: true,
    community: true
  },
  privacy: {
    profileVisibility: 'PUBLIC',
    onlineStatus: true
  },
  accessibility: {
    highContrast: false,
    largeText: false
  },
  security: {
    biometrics: false,
    twoFactor: false
  }
};

// --- PERSISTENCE HELPER ---
const usePersistentState = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (e) {
      console.error(`Error loading ${key}`, e);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error(`Error saving ${key}`, e);
    }
  }, [key, state]);

  return [state, setState];
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // --- DATABASE TABLES (Persistent State) ---
  const [allUsers, setAllUsers] = usePersistentState<User[]>('bandSocial_users', MOCK_USERS);
  const [repertoire, setRepertoire] = usePersistentState<RepertoireItem[]>('bandSocial_repertoire', INITIAL_REPERTOIRE);
  const [trashBin, setTrashBin] = usePersistentState<DeletedItem[]>('bandSocial_trash', []);
  const [posts, setPosts] = usePersistentState<PostItem[]>('bandSocial_posts', INITIAL_POSTS);
  const [finances, setFinances] = usePersistentState<FinanceItem[]>('bandSocial_finances', MOCK_FINANCES);
  const [events, setEvents] = usePersistentState<EventItem[]>('bandSocial_events', INITIAL_EVENTS);
  const [newsSources, setNewsSources] = usePersistentState<NewsSource[]>('bandSocial_news', []);
  const [userSettings, setUserSettings] = usePersistentState<UserSettings>('bandSocial_settings', DEFAULT_SETTINGS);
  
  // --- PWA & NOTIFICATION STATE ---
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );
  
  // PWA States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    if (currentUser) {
      // Sync current user changes back to the "Database"
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? currentUser : u));
    }
  }, [currentUser]);

  // --- PWA LISTENERS ---
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    // Catch the PWA install prompt
    const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        console.log("PWA Install Prompt Captured");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const installPwa = async () => {
      if (!deferredPrompt) return;
      
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
          console.log('User accepted the PWA install prompt');
          setDeferredPrompt(null);
      }
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
      setUserSettings(prev => ({ ...prev, ...newSettings }));
  };

  // --- NOTIFICATION UTILS ---
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        alert("Este navegador não suporta notificações de sistema.");
        return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
        new Notification("Notificações Ativadas", {
            body: "Você será avisado sobre novas postagens e eventos da banda.",
            icon: "https://cdn-icons-png.flaticon.com/512/3659/3659784.png" // Generic music icon
        });
        updateSettings({ notifications: { ...userSettings.notifications, push: true } });
    }
  };

  const sendSystemNotification = (title: string, body: string) => {
      if (notificationPermission === 'granted' && userSettings.notifications.push) {
          try {
              new Notification(title, { 
                  body,
                  icon: "https://cdn-icons-png.flaticon.com/512/3659/3659784.png"
              });
          } catch (e) {
              console.error("Failed to send notification", e);
          }
      }
  };

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
    sendSystemNotification("Novo Repertório", `"${newItem.title}" foi adicionado ao arquivo.`);
  };

  const addPost = (post: any) => {
    if (!currentUser) return;
    const newPost: PostItem = {
       ...post,
       id: `p${Date.now()}`,
       type: ItemType.POST,
       category: post.category || 'COMMUNITY', // Default to Community if not specified
       createdAt: Date.now(),
       authorId: currentUser.name, 
       likedBy: [],
       comments: [],
    };
    setPosts(prev => [newPost, ...prev]);
    
    // Notification logic
    const isOfficial = post.category === 'WALL'; // Official if explicitly marked as WALL
    if (isOfficial && userSettings.notifications.events) {
        sendSystemNotification("Atualização no Mural", post.title || `Novo post de ${currentUser.name}`);
    } else if (!isOfficial && userSettings.notifications.community) {
        sendSystemNotification("Nova Publicação", `Novo post de ${currentUser.name}`);
    }
  };

  // --- NEW: SHARE POST LOGIC ---
  const sharePost = (originalPostId: string, commentary?: string) => {
    if (!currentUser) return;
    
    // Find original to ensure it exists, but we only store the ID reference
    const original = posts.find(p => p.id === originalPostId);
    if (!original) return;

    const newPost: PostItem = {
        id: `p${Date.now()}`,
        type: ItemType.POST,
        category: 'COMMUNITY', // Shared posts are always Community
        title: '', // Shared posts often don't have a new title, or it's implied
        content: commentary || '',
        originalPostId: originalPostId,
        createdAt: Date.now(),
        authorId: currentUser.name,
        postType: 'TEXT',
        visibility: 'PUBLIC', // Default to public for shares usually
        likedBy: [],
        comments: [],
        mediaUrls: [], 
    };

    setPosts(prev => [newPost, ...prev]);
    if (userSettings.notifications.community) {
        sendSystemNotification("Compartilhamento", `${currentUser.name} compartilhou uma publicação.`);
    }
  };

  // --- SOCIAL INTERACTIONS START ---

  const togglePostLike = (postId: string) => {
    if (!currentUser) return;
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      
      const hasLiked = post.likedBy.includes(currentUser.id);
      const newLikedBy = hasLiked 
        ? post.likedBy.filter(id => id !== currentUser.id)
        : [...post.likedBy, currentUser.id];
      
      return { ...post, likedBy: newLikedBy };
    }));
  };

  const addComment = (postId: string, content: string, parentCommentId?: string) => {
    if (!currentUser) return;

    const newComment: Comment = {
       id: `c${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
       authorId: currentUser.id,
       authorName: currentUser.name,
       content,
       createdAt: Date.now(),
       likedBy: [],
       replies: []
    };

    setPosts(prev => prev.map(post => {
       if (post.id !== postId) return post;
       
       if (parentCommentId) {
           // Add as reply
           const updateComments = (comments: Comment[]): Comment[] => {
              return comments.map(c => {
                 if (c.id === parentCommentId) {
                     return { ...c, replies: [...c.replies, newComment] };
                 }
                 if (c.replies.length > 0) {
                     return { ...c, replies: updateComments(c.replies) };
                 }
                 return c;
              });
           };
           return { ...post, comments: updateComments(post.comments) };
       } else {
           // Top level comment
           return { ...post, comments: [...post.comments, newComment] };
       }
    }));
  };

  const editComment = (postId: string, commentId: string, newContent: string) => {
      setPosts(prev => prev.map(post => {
          if (post.id !== postId) return post;

          const updateRecursive = (list: Comment[]): Comment[] => {
              return list.map(c => {
                  if (c.id === commentId) {
                      return { ...c, content: newContent, updatedAt: Date.now() };
                  }
                  return { ...c, replies: updateRecursive(c.replies) };
              });
          };
          return { ...post, comments: updateRecursive(post.comments) };
      }));
  };

  const deleteComment = (postId: string, commentId: string) => {
      setPosts(prev => prev.map(post => {
          if (post.id !== postId) return post;
          
          const deleteRecursive = (list: Comment[]): Comment[] => {
              return list.filter(c => c.id !== commentId).map(c => ({
                  ...c,
                  replies: deleteRecursive(c.replies)
              }));
          };
          return { ...post, comments: deleteRecursive(post.comments) };
      }));
  };

  const toggleCommentLike = (postId: string, commentId: string) => {
      if (!currentUser) return;
      setPosts(prev => prev.map(post => {
          if (post.id !== postId) return post;

          const toggleRecursive = (list: Comment[]): Comment[] => {
              return list.map(c => {
                  if (c.id === commentId) {
                      const hasLiked = c.likedBy.includes(currentUser.id);
                      const newLikes = hasLiked
                        ? c.likedBy.filter(id => id !== currentUser.id)
                        : [...c.likedBy, currentUser.id];
                      return { ...c, likedBy: newLikes };
                  }
                  return { ...c, replies: toggleRecursive(c.replies) };
              });
          };
          return { ...post, comments: toggleRecursive(post.comments) };
      }));
  };

  // --- SOCIAL INTERACTIONS END ---

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
      attendees: eventData.attendees || [] 
    };
    setEvents(prev => [...prev, newEvent]);
    if (userSettings.notifications.events) {
        sendSystemNotification("Novo Evento na Agenda", `${newEvent.title} - ${new Date(newEvent.date).toLocaleDateString()}`);
    }
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
  const handleEventAction = (eventId: string, userId: string, action: 'CONFIRM' | 'CANCEL' | 'DECLINE', reason?: string) => {
    setEvents(prevEvents => prevEvents.map(event => {
       if (event.id !== eventId) return event;
       // Logic for locking actions if finalized could be here, but usually finalizing affects MANAGER marking, not user RSVP unless strict.
       // However, for strict consistency:
       if (event.attendanceFinalized) return event; 

       const record = event.attendees.find(a => a.userId === userId);
       const matrix = XP_MATRIX[event.eventType] || { confirm: 20, completion: 30 }; 
       let newAttendees = [...event.attendees];

       if (action === 'CONFIRM') {
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
                       xpAwarded: xpGain, 
                       cancellationReason: undefined 
                   } : a);
               }
           }
       } else if (action === 'CANCEL') {
           if (record) {
               const isLate = Date.now() > event.rsvpDeadline;
               const prevXp = record.xpAwarded; 

               if (isLate) {
                   const penaltyState = -matrix.confirm; 
                   const correction = penaltyState - prevXp; 
                   
                   applyXpChange(userId, correction);
                   
                   newAttendees = newAttendees.map(a => a.userId === userId ? {
                       ...a,
                       status: AttendanceStatus.LATE_CANCEL,
                       xpAwarded: penaltyState,
                       cancellationReason: reason
                   } : a);
               } else {
                   applyXpChange(userId, -prevXp); 
                   
                   newAttendees = newAttendees.map(a => a.userId === userId ? {
                       ...a,
                       status: AttendanceStatus.DECLINED,
                       xpAwarded: 0,
                       cancellationReason: reason
                   } : a);
               }
           }
       } else if (action === 'DECLINE') {
           if (!record) {
               newAttendees.push({
                   userId,
                   status: AttendanceStatus.DECLINED,
                   timestamp: Date.now(),
                   xpAwarded: 0
               });
           } else {
                newAttendees = newAttendees.map(a => a.userId === userId ? {
                   ...a,
                   status: AttendanceStatus.DECLINED
               } : a);
           }
       }

       return { ...event, attendees: newAttendees };
    }));
  };

  const markAttendance = (eventId: string, userId: string, status: AttendanceStatus.PRESENT | AttendanceStatus.ABSENT) => {
      setEvents(prevEvents => prevEvents.map(event => {
          if (event.id !== eventId) return event;
          if (event.attendanceFinalized) return event; // Lock check

          const record = event.attendees.find(a => a.userId === userId);
          if (!record) return event; 

          const matrix = XP_MATRIX[event.eventType] || { confirm: 20, completion: 30 };
          const prevXp = record.xpAwarded;
          let newXp = 0;

          if (status === AttendanceStatus.PRESENT) {
              newXp = matrix.confirm + matrix.completion;
          } else if (status === AttendanceStatus.ABSENT) {
              newXp = matrix.confirm - matrix.completion; 
          }

          const correction = newXp - prevXp;
          applyXpChange(userId, correction);

          const newAttendees = event.attendees.map(a => a.userId === userId ? {
              ...a,
              status,
              xpAwarded: newXp
          } : a);

          return { ...event, attendees: newAttendees };
      }));
  };

  const markBatchAttendance = (eventId: string, userIds: string[], status: AttendanceStatus.PRESENT) => {
    setEvents(prevEvents => prevEvents.map(event => {
        if (event.id !== eventId) return event;
        if (event.attendanceFinalized) return event; 

        const matrix = XP_MATRIX[event.eventType] || { confirm: 20, completion: 30 };
        
        let updatedAttendees = event.attendees.map(record => {
            if (userIds.includes(record.userId)) {
                // Logic same as markAttendance but inside loop
                const prevXp = record.xpAwarded;
                const newXp = matrix.confirm + matrix.completion; // Assuming PRESENT
                const correction = newXp - prevXp;
                applyXpChange(record.userId, correction);
                
                return {
                    ...record,
                    status: AttendanceStatus.PRESENT,
                    xpAwarded: newXp
                };
            }
            return record;
        });

        return { ...event, attendees: updatedAttendees };
    }));
  };

  const finalizeAttendanceList = (eventId: string) => {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, attendanceFinalized: true, attendanceFinalizedAt: Date.now() } : e));
  };

  const reopenAttendanceList = (eventId: string) => {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, attendanceFinalized: false } : e));
  };

  const toggleFollow = (targetId: string) => {
    if (!currentUser) return;
    
    const isFollowing = currentUser.following.includes(targetId);
    const newFollowing = isFollowing 
      ? currentUser.following.filter(id => id !== targetId)
      : [...currentUser.following, targetId];
    
    setCurrentUser({ ...currentUser, following: newFollowing });
    
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, following: newFollowing } : u));
  };

  const registerUser = (userData: Omit<User, 'id' | 'role' | 'xp' | 'level' | 'attendanceRate' | 'following'>) => {
      // 1. Data Integrity & Uniqueness Checks
      const emailExists = allUsers.some(u => u.email?.toLowerCase() === userData.email?.toLowerCase());
      if (emailExists) {
          return { success: false, message: "Este e-mail já está cadastrado no sistema." };
      }

      const cpfExists = allUsers.some(u => u.cpf === userData.cpf);
      if (cpfExists) {
          return { success: false, message: "Este CPF já está associado a uma conta." };
      }

      const rgExists = allUsers.some(u => u.rg === userData.rg);
      if (rgExists) {
          return { success: false, message: "Este RG já está registrado." };
      }

      const nicknameExists = allUsers.some(u => u.nickname.toLowerCase() === userData.nickname.toLowerCase());
      if (nicknameExists) {
          return { success: false, message: "Este nickname já está em uso. Por favor escolha outro." };
      }

      // 2. Create User
      const newUser: User = {
          ...userData,
          id: `u${Date.now()}`,
          role: UserRole.MEMBER, 
          xp: 0,
          level: 1,
          attendanceRate: 100, 
          following: []
      };
      
      setAllUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      return { success: true };
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
      setAllUsers(prev => prev.map(u => {
          if (u.id === userId) {
              return { ...u, role: newRole };
          }
          return u;
      }));

      if (currentUser && currentUser.id === userId) {
          setCurrentUser({ ...currentUser, role: newRole });
      }
  };

  return (
    <AppContext.Provider value={{
      currentUser, users: allUsers, repertoire, trashBin, posts, finances, events, newsSources, userSettings,
      setCurrentUser, deleteItem, restoreItem, addRepertoire, addPost, sharePost, votePoll, toggleFinanceApproval, addEvent,
      handleEventAction, markAttendance, markBatchAttendance, finalizeAttendanceList, reopenAttendanceList, toggleFollow, addNewsSource,
      togglePostLike, addComment, editComment, deleteComment, toggleCommentLike,
      notificationPermission, requestNotificationPermission, registerUser, updateSettings, updateUserRole,
      // PWA
      isPwaInstallable: !!deferredPrompt,
      installPwa,
      isOffline
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

// --- NEW COMPONENT: INSTALL BANNER ---
const InstallBanner = () => {
  const { isPwaInstallable, installPwa, currentUser } = useApp();
  const [isVisible, setIsVisible] = useState(true);

  if (!isPwaInstallable || !isVisible) return null;

  return (
    <div className={`fixed left-4 right-4 z-[100] animate-slide-up md:hidden ${currentUser ? 'bottom-20' : 'bottom-4'}`}>
      <div className="bg-navy-900/95 backdrop-blur-md border border-ocre-500/50 p-4 rounded-xl shadow-2xl flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-ocre-500"></div>
        
        <div className="flex items-center gap-3">
           <div className="bg-navy-800 p-2 rounded-lg text-ocre-500 border border-navy-700">
              <Download className="w-6 h-6" />
           </div>
           <div>
              <h4 className="font-bold text-bege-50 text-sm">Baixar App Android</h4>
              <p className="text-[10px] text-bege-200">Instale para acesso offline.</p>
           </div>
        </div>

        <div className="flex items-center gap-2">
            <button 
                onClick={installPwa}
                className="bg-ocre-600 hover:bg-ocre-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow transition-colors"
            >
                Instalar
            </button>
            <button 
                onClick={() => setIsVisible(false)}
                className="p-1.5 text-gray-400 hover:text-white bg-black/20 rounded-full"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};

// Authenticated App (Session Isolated)
const AuthenticatedApp = () => {
  const { currentUser, setCurrentUser, users, addPost, sharePost, posts, events, repertoire, finances, notificationPermission, requestNotificationPermission, userSettings, updateSettings, isOffline } = useApp();
  const location = useLocation();

  if (!currentUser) return null; 

  // --- VIEW HISTORY STATE (Unique per User ID via Component Remount) ---
  const getDefaultHistory = () => ({
    wall: Date.now() - (24 * 60 * 60 * 1000), 
    community: Date.now() - (24 * 60 * 60 * 1000),
    agenda: Date.now() - (24 * 60 * 60 * 1000),
    repertoire: Date.now() - (48 * 60 * 60 * 1000),
    finances: Date.now() - (24 * 60 * 60 * 1000),
    admin: Date.now() - (24 * 60 * 60 * 1000),
    profile: Date.now(),
    lastSeenLevel: currentUser.level, 
    lastSeenRole: currentUser.role
  });

  const [viewHistory, setViewHistory] = useState(() => {
      try {
        const storageKey = `bandSocial_viewHistory_${currentUser.id}`;
        const saved = localStorage.getItem(storageKey);
        
        let history = saved ? JSON.parse(saved) : getDefaultHistory();
        
        if (history.lastSeenLevel === undefined) history.lastSeenLevel = currentUser.level;
        if (history.lastSeenRole === undefined) history.lastSeenRole = currentUser.role;
        
        return history;
      } catch (e) {
        console.warn("LocalStorage access denied, using default history");
        return getDefaultHistory();
      }
  });

  useEffect(() => {
      try {
        localStorage.setItem(`bandSocial_viewHistory_${currentUser.id}`, JSON.stringify(viewHistory));
      } catch (e) {
        // Ignore storage errors
      }
  }, [viewHistory, currentUser.id]);

  useEffect(() => {
    const now = Date.now();
    setViewHistory(prev => {
        let update = null;
        if (location.pathname === '/wall') update = { wall: now };
        if (location.pathname === '/people') update = { community: now };
        if (location.pathname === '/agenda') update = { agenda: now };
        if (location.pathname === '/repertoire') update = { repertoire: now };
        if (location.pathname === '/finances') update = { finances: now };
        if (location.pathname === '/admin') update = { admin: now };
        
        if (location.pathname === '/profile') {
            update = { 
                profile: now,
                lastSeenLevel: currentUser.level,
                lastSeenRole: currentUser.role
            };
        }
        
        return update ? { ...prev, ...update } : prev;
    });
  }, [location.pathname, currentUser.level, currentUser.role]);

  const handleStudioPost = (content: string, videoBlob: Blob, visibility: 'PUBLIC' | 'FOLLOWERS', location?: LocationData) => {
    const videoUrl = URL.createObjectURL(videoBlob);
    addPost({
      title: 'Sessão de Estúdio',
      content,
      videoUrl,
      visibility,
      location,
      postType: 'TEXT',
      category: 'COMMUNITY', // Force Community category
      mediaUrls: []
    });
  };

  // --- NOTIFICATION BADGE LOGIC ---
  const hasProfileAlerts = currentUser.level !== viewHistory.lastSeenLevel || currentUser.role !== viewHistory.lastSeenRole;

  const hasWallUpdates = posts.some(p => 
      p.type === 'POST' && 
      p.category === 'WALL' &&
      !p.originalPostId && 
      !p.title?.startsWith("Presença confirmada") &&
      p.createdAt > viewHistory.wall
  );

  const hasCommunityUpdates = posts.some(p => 
     p.type === 'POST' && 
     p.category === 'COMMUNITY' &&
     p.createdAt > viewHistory.community
  );

  const hasPendingEvents = events.some(e => {
      return e.createdAt > viewHistory.agenda;
  });

  const hasNewRepertoire = repertoire.some(r => r.createdAt > viewHistory.repertoire);
  const hasPendingFinances = finances.some(f => f.status === 'PENDING' && f.createdAt > viewHistory.finances);

  // Apply Accessibility Styles dynamically
  useEffect(() => {
      if (userSettings.accessibility.largeText) {
          document.documentElement.style.fontSize = '18px';
      } else {
          document.documentElement.style.fontSize = '16px';
      }
      
      if (userSettings.accessibility.highContrast) {
          document.body.classList.add('contrast-125', 'brightness-110');
      } else {
          document.body.classList.remove('contrast-125', 'brightness-110');
      }
  }, [userSettings.accessibility]);

  return (
    <div className="min-h-screen bg-navy-900 text-bege-100 font-sans pb-20 relative">
      
      {/* --- OFFLINE BANNER --- */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center text-xs font-bold py-1 z-[60] flex items-center justify-center gap-2 animate-slide-down">
            <WifiOff className="w-3 h-3" />
            Você está offline. Algumas funções podem estar limitadas.
        </div>
      )}

      {notificationPermission === 'default' && (
         <div className="fixed top-20 left-4 right-4 z-[60] animate-bounce-in">
             <div className="bg-navy-800 border-l-4 border-ocre-500 rounded-r-lg shadow-2xl p-4 flex items-start justify-between gap-4">
                 <div className="flex-1">
                     <h4 className="font-bold text-bege-50 text-sm flex items-center gap-2">
                        <BellRing className="w-4 h-4 text-ocre-500" /> Ativar Notificações?
                     </h4>
                     <p className="text-xs text-bege-200 mt-1">
                        Receba alertas em tempo real quando gestores postarem novidades ou eventos.
                     </p>
                 </div>
                 <div className="flex flex-col gap-2">
                     <button 
                        onClick={requestNotificationPermission}
                        className="bg-ocre-600 hover:bg-ocre-500 text-white text-xs font-bold px-3 py-2 rounded shadow transition-colors"
                     >
                        Permitir
                     </button>
                     <button 
                        onClick={() => { /* Dismiss logic */}}
                        className="text-xs text-gray-500 hover:text-white"
                     >
                        Agora não
                     </button>
                 </div>
             </div>
         </div>
      )}

      {/* Mobile-First Header */}
      <header className={`sticky top-0 z-40 bg-navy-900/90 backdrop-blur-md border-b border-navy-700 px-4 py-3 flex justify-between items-center shadow-lg ${isOffline ? 'mt-6' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ocre-600 rounded-xl flex items-center justify-center shadow-lg shadow-ocre-900/50">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg leading-none text-bege-50">BandSocial</h1>
            <p className="text-[10px] uppercase tracking-widest text-ocre-500 font-bold">Manager</p>
          </div>
        </div>
        
        <Link to="/profile" className="flex items-center gap-2 bg-navy-800 pr-3 pl-1 py-1 rounded-full border border-navy-700 hover:border-ocre-500 transition-colors relative">
          <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-xs font-bold text-bege-100 border border-navy-600">
            {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : currentUser.name.charAt(0)}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-bege-50 leading-none">{currentUser.nickname}</p>
            <p className="text-[8px] text-ocre-500 font-bold uppercase">{currentUser.role.split('_')[0]}</p>
          </div>
          {hasProfileAlerts && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-navy-900 animate-pulse"></div>}
        </Link>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/wall" replace />} />
          <Route path="/wall" element={
            <Wall 
              currentUser={currentUser} 
              allUsers={users}
              posts={useApp().posts} 
              events={useApp().events}
              onAddPost={useApp().addPost} 
              onVote={useApp().votePoll} 
              onDelete={useApp().deleteItem}
            />
          } />
          <Route path="/people" element={
             <Community 
               posts={useApp().posts} 
               currentUser={currentUser} 
               allUsers={users} 
               onToggleFollow={useApp().toggleFollow}
               onAddPost={useApp().addPost}
             />
          } />
          <Route path="/agenda" element={
            <Agenda 
              events={useApp().events} 
              currentUser={currentUser} 
              allUsers={users}
              onAddEvent={useApp().addEvent}
              onEventAction={useApp().handleEventAction}
              onMarkAttendance={useApp().markAttendance}
              onDelete={useApp().deleteItem}
              onAddPost={useApp().addPost}
            />
          } />
          <Route path="/repertoire" element={
            <Repertoire 
              items={useApp().repertoire} 
              currentUser={currentUser} 
              onDelete={useApp().deleteItem} 
              onAdd={useApp().addRepertoire}
            />
          } />
          <Route path="/finances" element={<Finances items={useApp().finances} onToggleApproval={useApp().toggleFinanceApproval} />} />
          <Route path="/admin" element={
             <AdminPanel 
                currentUser={currentUser} 
                allUsers={useApp().users} 
                newsSources={useApp().newsSources}
                events={useApp().events}
                onAddNewsSource={useApp().addNewsSource}
                onMarkAttendance={useApp().markAttendance}
                onFinalize={useApp().finalizeAttendanceList}
                onReopen={useApp().reopenAttendanceList}
                onMarkBatch={useApp().markBatchAttendance}
                onUpdateUserRole={useApp().updateUserRole}
             />
          } />
          <Route path="/profile" element={
            <div className="space-y-8">
               <Profile 
                 user={currentUser} 
                 allUsers={useApp().users}
                 onToggleFollow={useApp().toggleFollow}
                 onLogout={() => setCurrentUser(null)} 
                />
               {currentUser.role === UserRole.GENERAL_MANAGER && (
                  <TrashBin 
                    items={useApp().trashBin} 
                    userRole={currentUser.role} 
                    onRestore={useApp().restoreItem} 
                  />
               )}
            </div>
          } />
          <Route path="/settings" element={
              <SettingsScreen 
                  currentUser={currentUser}
                  settings={userSettings}
                  onUpdateSettings={updateSettings}
                  onLogout={() => setCurrentUser(null)}
              />
          } />
          <Route path="/studio" element={<StudyStudio currentUser={currentUser} onPost={handleStudioPost} />} />
        </Routes>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-navy-900/95 backdrop-blur-lg border-t border-navy-800 pb-safe z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
          <NavLink to="/wall" icon={<LayoutDashboard />} label="Mural" hasNotification={hasWallUpdates} />
          <NavLink to="/people" icon={<Users />} label="Galera" hasNotification={hasCommunityUpdates} />
          <NavLink to="/agenda" icon={<Calendar />} label="Agenda" hasNotification={hasPendingEvents} />
          
          <div className="relative -top-5">
             <Link to="/studio" className="w-14 h-14 bg-ocre-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-ocre-900/40 border-4 border-navy-900 transform transition-transform active:scale-95 hover:bg-ocre-500">
                <Video className="w-6 h-6" />
             </Link>
          </div>

          <NavLink to="/repertoire" icon={<LibraryBig />} label="Arquivo" hasNotification={hasNewRepertoire} />
          <NavLink to="/finances" icon={<Landmark />} label="Caixa" hasNotification={hasPendingFinances} />
          
          {[UserRole.GENERAL_MANAGER, UserRole.PEOPLE_MANAGER_1, UserRole.PEOPLE_MANAGER_2].includes(currentUser.role) ? (
             <NavLink to="/admin" icon={<ShieldAlert />} label="Admin" activeColor="text-red-500" hasNotification={hasProfileAlerts} />
          ) : (
             <NavLink to="/profile" icon={<Settings />} label="Perfil" hasNotification={hasProfileAlerts} />
          )}
        </div>
      </nav>
    </div>
  );
};

const NavLink = ({ to, icon, label, activeColor = 'text-ocre-500', hasNotification = false }: { to: string, icon: React.ReactNode, label: string, activeColor?: string, hasNotification?: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className={`flex flex-col items-center justify-center w-14 gap-1 transition-colors relative ${isActive ? activeColor : 'text-navy-400 hover:text-bege-200'}`}>
      <div className="relative">
        {React.cloneElement(icon as React.ReactElement<any>, { size: 20, strokeWidth: isActive ? 2.5 : 2 })}
        {hasNotification && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-navy-900 animate-pulse"></span>
        )}
      </div>
      <span className={`text-[9px] font-bold ${isActive ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    </Link>
  );
};

// Main App Container (Authentication Switcher)
const MainApp = () => {
  const { currentUser, setCurrentUser } = useApp();

  return (
    <>
      {currentUser ? <AuthenticatedApp key={currentUser.id} /> : <AuthScreen onLogin={setCurrentUser} />}
      <InstallBanner />
    </>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </HashRouter>
  );
}
