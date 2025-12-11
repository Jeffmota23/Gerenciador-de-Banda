
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

const DEFAULT_ADDRESS = { cep: '01001-000', street: 'Rua da Música', number: '100', city: 'São Paulo', state: 'SP' };

export const MOCK_USERS: User[] = [
  // Level 1: General Manager (Acesso Total)
  { 
    id: 'u1', name: 'Maestro Augusto', nickname: 'Maestro', role: UserRole.GENERAL_MANAGER, instrument: 'Regente', experienceTime: '20 anos',
    xp: 9500, level: 50, attendanceRate: 100, email: 'maestro@bandsocial.com', 
    cpf: '000.000.000-01', rg: '00.000.001-1', phone: '(11) 99999-0001', address: DEFAULT_ADDRESS,
    following: [] 
  },

  // Level 2: Agenda Managers (Eventos)
  { 
    id: 'u2', name: 'Sara Silva', nickname: 'SaraCornet', role: UserRole.AGENDA_MANAGER_1, instrument: 'Cornet', experienceTime: '8 anos',
    xp: 4200, level: 22, attendanceRate: 95, 
    cpf: '000.000.000-02', rg: '00.000.002-2', phone: '(11) 99999-0002', address: DEFAULT_ADDRESS,
    following: ['u1'] 
  },
  { 
    id: 'u3', name: 'Miguel Santos', nickname: 'MigTrombone', role: UserRole.AGENDA_MANAGER_2, instrument: 'Trombone', experienceTime: '6 anos',
    xp: 3800, level: 19, attendanceRate: 88, 
    cpf: '000.000.000-03', rg: '00.000.003-3', phone: '(11) 99999-0003', address: DEFAULT_ADDRESS,
    following: [] 
  },

  // Level 3: Wall/Post Managers (Conteúdo Oficial)
  { 
    id: 'u4', name: 'Jéssica Lima', nickname: 'JessHorn', role: UserRole.WALL_MANAGER_1, instrument: 'Sax Horn', experienceTime: '7 anos',
    xp: 5100, level: 26, attendanceRate: 92, 
    cpf: '000.000.000-04', rg: '00.000.004-4', phone: '(11) 99999-0004', address: DEFAULT_ADDRESS,
    following: ['u1', 'u6'] 
  },
  { 
    id: 'u5', name: 'Tomás Costa', nickname: 'TomPerc', role: UserRole.WALL_MANAGER_2, instrument: 'Percussão', experienceTime: '4 anos',
    xp: 2900, level: 14, attendanceRate: 85, 
    cpf: '000.000.000-05', rg: '00.000.005-5', phone: '(11) 99999-0005', address: DEFAULT_ADDRESS,
    following: [] 
  },

  // Level 4: Repertoire Managers (Arquivistas)
  { 
    id: 'u6', name: 'Emília Souza', nickname: 'EmiHorn', role: UserRole.REPERTOIRE_MANAGER_1, instrument: 'Trompa', experienceTime: '10 anos',
    xp: 6200, level: 31, attendanceRate: 98, 
    cpf: '000.000.000-06', rg: '00.000.006-6', phone: '(11) 99999-0006', address: DEFAULT_ADDRESS,
    following: [] 
  },
  { 
    id: 'u7', name: 'Davi Oliveira', nickname: 'DaviEuph', role: UserRole.REPERTOIRE_MANAGER_2, instrument: 'Euphonium', experienceTime: '9 anos',
    xp: 4500, level: 23, attendanceRate: 90, 
    cpf: '000.000.000-07', rg: '00.000.007-7', phone: '(11) 99999-0007', address: DEFAULT_ADDRESS,
    following: ['u3'] 
  },

  // Level 5: People Managers (Comunidade/Presença)
  { 
    id: 'u8', name: 'Laura Mendes', nickname: 'LauFlugel', role: UserRole.PEOPLE_MANAGER_1, instrument: 'Flugelhorn', experienceTime: '12 anos',
    xp: 7000, level: 35, attendanceRate: 99, 
    cpf: '000.000.000-08', rg: '00.000.008-8', phone: '(11) 99999-0008', address: DEFAULT_ADDRESS,
    following: ['u2'] 
  },
  { 
    id: 'u9', name: 'Cristiano Rocha', nickname: 'CrisTuba', role: UserRole.PEOPLE_MANAGER_2, instrument: 'Tuba', experienceTime: '5 anos',
    xp: 3100, level: 15, attendanceRate: 82, 
    cpf: '000.000.000-09', rg: '00.000.009-9', phone: '(11) 99999-0009', address: DEFAULT_ADDRESS,
    following: [] 
  },

  // Members
  { 
    id: 'u10', name: 'João Batista', nickname: 'JoaoBari', role: UserRole.MEMBER, instrument: 'Barítono', experienceTime: '2 anos',
    xp: 1200, level: 6, attendanceRate: 75, 
    cpf: '000.000.000-10', rg: '00.000.010-10', phone: '(11) 99999-0010', address: DEFAULT_ADDRESS,
    following: ['u1', 'u7'] 
  },
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
    category: 'WALL',
    authorId: 'Maestro Augusto',
    createdAt: Date.now() - 3600000, // 1 hour ago
    likedBy: ['u2', 'u3', 'u4'],
    comments: [
        {
            id: 'c1',
            authorId: 'u2',
            authorName: 'SaraCornet',
            content: 'Noted, thanks Maestro!',
            createdAt: Date.now() - 3500000,
            likedBy: ['u1'],
            replies: []
        }
    ],
    visibility: 'PUBLIC'
  }
];
