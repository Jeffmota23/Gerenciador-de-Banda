
export enum UserRole {
  GENERAL_MANAGER = 'GENERAL_MANAGER',
  AGENDA_MANAGER_1 = 'AGENDA_MANAGER_1',
  AGENDA_MANAGER_2 = 'AGENDA_MANAGER_2',
  WALL_MANAGER_1 = 'WALL_MANAGER_1',
  WALL_MANAGER_2 = 'WALL_MANAGER_2',
  REPERTOIRE_MANAGER_1 = 'REPERTOIRE_MANAGER_1',
  REPERTOIRE_MANAGER_2 = 'REPERTOIRE_MANAGER_2',
  PEOPLE_MANAGER_1 = 'PEOPLE_MANAGER_1',
  PEOPLE_MANAGER_2 = 'PEOPLE_MANAGER_2',
  MEMBER = 'MEMBER',
}

export enum ItemType {
  REPERTOIRE = 'REPERTOIRE',
  EVENT = 'EVENT',
  POST = 'POST',
  FINANCE = 'FINANCE',
}

export enum EventType {
  REHEARSAL = 'REHEARSAL',     // XP High
  PERFORMANCE = 'PERFORMANCE', // XP Very High
  STUDY = 'STUDY',             // XP Medium
  WORKSHOP = 'WORKSHOP',       // XP High
  TRAVEL = 'TRAVEL',           // XP Medium
  SOCIAL = 'SOCIAL',           // XP Low (Resenha)
}

export enum RepertoireCategory {
  PIECE = 'PIECE', // Peça de Concerto
  STUDY = 'STUDY'  // Material de Estudo
}

export enum AttendanceStatus {
  PENDING = 'PENDING',        // Not used often, default state is not in list
  CONFIRMED = 'CONFIRMED',    // RSVP Yes
  LATE_CANCEL = 'LATE_CANCEL',// Cancelled after deadline
  PRESENT = 'PRESENT',        // Marked by Manager
  ABSENT = 'ABSENT'           // No-show marked by Manager
}

export interface AttendanceRecord {
  userId: string;
  status: AttendanceStatus;
  timestamp: number;
  xpAwarded: number; // Track XP given/taken for this specific event to allow reversals
}

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  previewUrl?: string; 
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  instrument: string;
  xp: number;
  level: number;
  attendanceRate: number; // 0-100
  email?: string;
  avatarUrl?: string;
  following: string[]; 
}

export interface BaseItem {
  id: string;
  title: string;
  createdAt: number;
  authorId: string;
  type: ItemType;
}

export interface EventItem extends BaseItem {
  type: ItemType.EVENT;
  eventType: EventType;
  date: number; 
  timeStr: string; 
  durationMinutes: number;
  rsvpDeadline: number; 
  location?: LocationData | string; 
  
  // CHANGED: Complex object for attendance
  attendees: AttendanceRecord[]; 
  
  givesXp: boolean;
  linkedMaterialIds?: string[]; // CHANGED: Now supports multiple IDs
}

export interface RepertoireItem extends BaseItem {
  type: ItemType.REPERTOIRE;
  category: RepertoireCategory; 
  
  composer?: string;
  key?: string; 
  
  focus?: string; 
  estimatedTime?: number; 
  
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Virtuoso';
  fileUrls?: string[]; 
  description?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; 
}

export interface PollData {
  options: PollOption[];
  deadline: number;
  allowMultiple: boolean;
  showVoters: boolean;
}

export interface PostItem extends BaseItem {
  type: ItemType.POST;
  postType: 'TEXT' | 'POLL'; 
  
  content?: string; 
  mediaUrls?: string[]; 
  hashtags?: string[];
  mentions?: string[];
  location?: LocationData; 
  
  poll?: PollData;

  videoUrl?: string; 
  audioUrl?: string; // New field for Audio posts
  
  likes: number;
  comments: number;
  visibility: 'PUBLIC' | 'FOLLOWERS'; 
}

export interface FinanceItem extends BaseItem {
  type: ItemType.FINANCE;
  amount: number;
  category: 'Transport' | 'Equipment' | 'Social' | 'Venue';
  approvals: number; 
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  authorId: string; 
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
}

export interface DeletedItem {
  originalItem: RepertoireItem | BaseItem | EventItem | PostItem; 
  deletedAt: number;
  deletedBy: string; 
  reason: string;
  expiresAt: number; 
}

export interface AppState {
  currentUser: User | null;
  users: User[]; 
  repertoire: RepertoireItem[];
  posts: PostItem[];
  trashBin: DeletedItem[];
  finances: FinanceItem[];
  events: EventItem[];
  newsSources: NewsSource[];
}

export interface AppContextType extends AppState {
  setCurrentUser: (user: User | null) => void;
  deleteItem: (itemId: string, reason: string) => void;
  restoreItem: (itemId: string) => void;
  addRepertoire: (item: Omit<RepertoireItem, 'id' | 'createdAt' | 'authorId' | 'type'>) => void;
  addPost: (post: Omit<PostItem, 'id' | 'createdAt' | 'authorId' | 'type' | 'likes' | 'comments'>) => void;
  votePoll: (postId: string, optionId: string) => void; 
  toggleFinanceApproval: (id: string) => void;
  addEvent: (event: Omit<EventItem, 'id' | 'createdAt' | 'authorId' | 'type' | 'attendees'>) => void;
  
  // CHANGED: New complex handler
  handleEventAction: (eventId: string, userId: string, action: 'CONFIRM' | 'CANCEL') => void;
  markAttendance: (eventId: string, userId: string, status: AttendanceStatus.PRESENT | AttendanceStatus.ABSENT) => void;
  
  toggleFollow: (targetUserId: string) => void;
  addNewsSource: (source: Omit<NewsSource, 'id' | 'status'>) => void;
}
