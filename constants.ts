
import { UserRole, User, RepertoireItem, ItemType, FinanceItem, EventItem, EventType, RepertoireCategory, AttendanceStatus, PostItem } from './types';

// --- XP MATRIX CONFIGURATION ---
// Regra de Negócio: Confirmação padrão = 20 pontos.
// Exemplo dado: 20 confirmação + 80 conclusão = 100 total.
export const XP_MATRIX = {
  [EventType.REHEARSAL]: { confirm: 20, completion: 80 }, // Total 100
  [EventType.PERFORMANCE]: { confirm: 50, completion: 150 }, // Total 200
  [EventType.STUDY]: { confirm: 20, completion: 30 }, // Total 50
  [EventType.WORKSHOP]: { confirm: 20, completion: 80 }, // Total 100 (Was 0)
  [EventType.TRAVEL]: { confirm: 20, completion: 50 }, // Total 70 (Was 0)
  [EventType.SOCIAL]: { confirm: 20, completion: 20 }, // Total 40 (New - Resenha)
};

export const MOCK_USERS: User[] = [
  // Level 1: General Manager (Acesso Total)
  { id: 'u1', name: 'Maestro Augusto (Gestor Geral)', role: UserRole.GENERAL_MANAGER, instrument: 'Regente', xp: 9500, level: 50, attendanceRate: 100, email: 'maestro@bandsocial.com', following: [] },

  // Level 2: Agenda Managers (Eventos)
  { id: 'u2', name: 'Sara (Gestora Agenda 1)', role: UserRole.AGENDA_MANAGER_1, instrument: 'Cornet', xp: 4200, level: 22, attendanceRate: 95, following: ['u1'] },
  { id: 'u3', name: 'Miguel (Gestor Agenda 2)', role: UserRole.AGENDA_MANAGER_2, instrument: 'Trombone', xp: 3800, level: 19, attendanceRate: 88, following: [] },

  // Level 3: Wall/Post Managers (Conteúdo Oficial)
  { id: 'u4', name: 'Jéssica (Gestora Mural 1)', role: UserRole.WALL_MANAGER_1, instrument: 'Sax Horn', xp: 5100, level: 26, attendanceRate: 92, following: ['u1', 'u6'] },
  { id: 'u5', name: 'Tomás (Gestor Mural 2)', role: UserRole.WALL_MANAGER_2, instrument: 'Percussão', xp: 2900, level: 14, attendanceRate: 85, following: [] },

  // Level 4: Repertoire Managers (Arquivistas)
  { id: 'u6', name: 'Emília (Gestora Repertório 1)', role: UserRole.REPERTOIRE_MANAGER_1, instrument: 'Trompa', xp: 6200, level: 31, attendanceRate: 98, following: [] },
  { id: 'u7', name: 'Davi (Gestor Repertório 2)', role: UserRole.REPERTOIRE_MANAGER_2, instrument: 'Euphonium', xp: 4500, level: 23, attendanceRate: 90, following: ['u3'] },

  // Level 5: People Managers (Comunidade/Presença)
  { id: 'u8', name: 'Laura (Gestora Pessoas 1)', role: UserRole.PEOPLE_MANAGER_1, instrument: 'Flugelhorn', xp: 7000, level: 35, attendanceRate: 99, following: ['u2'] },
  { id: 'u9', name: 'Cristiano (Gestor Pessoas 2)', role: UserRole.PEOPLE_MANAGER_2, instrument: 'Tuba', xp: 3100, level: 15, attendanceRate: 82, following: [] },

  // Members
  { id: 'u10', name: 'João (Membro)', role: UserRole.MEMBER, instrument: 'Barítono', xp: 1200, level: 6, attendanceRate: 75, following: ['u1', 'u7'] },
];

export const INITIAL_REPERTOIRE: RepertoireItem[] = [
  // MÚSICAS (PIECES)
  {
    id: 'r1',
    type: ItemType.REPERTOIRE,
    category: RepertoireCategory.PIECE,
    title: 'Cisne Branco',
    composer: 'A. M. Espírito Santo',
    key: 'Ab Major',
    difficulty: 'Medium',
    authorId: 'u6', 
    createdAt: Date.now() - 10000000,
    description: 'Dobrado clássico da Marinha. Atenção aos contratempos das trompas.'
  },
  {
    id: 'r2',
    type: ItemType.REPERTOIRE,
    category: RepertoireCategory.PIECE,
    title: 'Bohemian Rhapsody',
    composer: 'Queen (Arr. M. Smith)',
    key: 'Bb Major',
    difficulty: 'Hard',
    authorId: 'u7', 
    createdAt: Date.now() - 5000000,
    description: 'Mudanças complexas de andamento. Trombones precisam afinar a seção operística.'
  },
  // ESTUDOS (STUDY MATERIAL)
  {
    id: 's1',
    type: ItemType.REPERTOIRE,
    category: RepertoireCategory.STUDY,
    title: 'Arban: Flexibilidade Pág. 42',
    focus: 'Flexibilidade Labial',
    estimatedTime: 20, 
    difficulty: 'Hard',
    authorId: 'u6',
    createdAt: Date.now() - 2000000,
    description: 'Fazer ligado e lento. Aumentar a velocidade gradualmente.'
  },
  {
    id: 's2',
    type: ItemType.REPERTOIRE,
    category: RepertoireCategory.STUDY,
    title: 'Clarke: Estudo Técnico Nº 2',
    focus: 'Digitação e Agilidade',
    estimatedTime: 15, 
    difficulty: 'Medium',
    authorId: 'u6',
    createdAt: Date.now() - 3000000,
    description: 'Focar na igualdade das notas. Respiração diafragmática.'
  }
];

export const MOCK_FINANCES: FinanceItem[] = [
  {
    id: 'f1',
    type: ItemType.FINANCE,
    title: 'Aluguel de Ônibus (Concurso Regional)',
    amount: 1850.00,
    category: 'Transport',
    approvals: 24,
    status: 'PENDING',
    authorId: 'u1',
    createdAt: Date.now() - 200000
  },
  {
    id: 'f2',
    type: ItemType.FINANCE,
    title: 'Compra Coletiva de Óleo de Pisto',
    amount: 320.50,
    category: 'Equipment',
    approvals: 45,
    status: 'APPROVED',
    authorId: 'u1',
    createdAt: Date.now() - 8000000
  }
];

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Helper to create mock attendance records
const mockAttendees = (userIds: string[], status: AttendanceStatus = AttendanceStatus.CONFIRMED) => {
    return userIds.map(uid => ({
        userId: uid,
        status: status,
        timestamp: Date.now() - 100000,
        xpAwarded: 0 // Mocked initial state
    }));
};

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'e1',
    title: 'Ensaio Geral',
    type: ItemType.EVENT,
    eventType: EventType.REHEARSAL,
    date: Date.now() + ONE_DAY_MS, // Amanhã
    timeStr: '19:30',
    durationMinutes: 120,
    rsvpDeadline: Date.now() + (ONE_DAY_MS / 2),
    location: 'Sede da Banda',
    createdAt: Date.now() - ONE_DAY_MS,
    authorId: 'u2',
    attendees: mockAttendees(['u1', 'u2', 'u3', 'u4', 'u6']),
    givesXp: true
  },
  {
    id: 'e2',
    title: 'Concerto de Gala Anual',
    type: ItemType.EVENT,
    eventType: EventType.PERFORMANCE,
    date: Date.now() + (ONE_DAY_MS * 14), // 2 semanas
    timeStr: '20:00',
    durationMinutes: 90,
    rsvpDeadline: Date.now() + (ONE_DAY_MS * 10),
    location: 'Teatro Municipal',
    createdAt: Date.now() - (ONE_DAY_MS * 2),
    authorId: 'u2',
    attendees: mockAttendees(['u1', 'u2', 'u3']),
    givesXp: true
  },
  {
    id: 'e3',
    title: 'Workshop de Respiração',
    type: ItemType.EVENT,
    eventType: EventType.WORKSHOP,
    date: Date.now() + (ONE_DAY_MS * 7), 
    timeStr: '10:00',
    durationMinutes: 240,
    rsvpDeadline: Date.now() + (ONE_DAY_MS * 5),
    location: 'Centro Comunitário',
    createdAt: Date.now() - (ONE_DAY_MS * 3),
    authorId: 'u3',
    attendees: mockAttendees(['u6', 'u7']),
    givesXp: true // REVERTED: Now gives XP
  }
];

export const INITIAL_POSTS: PostItem[] = [
  {
    id: 'p1',
    type: ItemType.POST,
    title: 'Important Announcement',
    content: 'The next rehearsal is moved to Tuesday at 8 PM due to venue availability.',
    postType: 'TEXT',
    authorId: 'Maestro Augusto (Gestor Geral)',
    createdAt: Date.now() - 3600000, // 1 hour ago
    likes: 5,
    comments: 0,
    visibility: 'PUBLIC'
  }
];
