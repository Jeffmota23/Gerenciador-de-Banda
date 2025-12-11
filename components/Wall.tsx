
import React, { useState } from 'react';
import { User, PostItem, UserRole, PollOption, LocationData, EventItem } from '../types';
import { Plus, Image as ImageIcon, Link as LinkIcon, AtSign, Hash, BarChart2, MessageSquare, Trash2, X, Check, Users, MapPin, Heart, Share2, Music, Calendar, Clock, MoreHorizontal } from 'lucide-react';
import { LocationPicker } from './LocationPicker';
import { useNavigate } from 'react-router-dom';
import { CreatePostModal } from './CreatePostModal';

interface Props {
  currentUser: User;
  posts: PostItem[];
  events: EventItem[];
  onAddPost: (post: any) => void;
  onVote: (postId: string, optionId: string) => void;
  onDelete: (postId: string, reason: string) => void;
}

export const Wall: React.FC<Props> = ({ currentUser, posts, events, onAddPost, onVote, onDelete }) => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // RBAC: Only GM and Wall Managers can post here
  const canPost = [UserRole.GENERAL_MANAGER, UserRole.WALL_MANAGER_1, UserRole.WALL_MANAGER_2].includes(currentUser.role);

  // Determine the NEXT Upcoming Event (Pinned Post Logic)
  const nextEvent = events
    .filter(e => e.date > Date.now())
    .sort((a, b) => a.date - b.date)[0];

  // Filter only WALL posts and sort by date
  const wallPosts = posts
    .filter(p => p.type === 'POST')
    .sort((a, b) => b.createdAt - a.createdAt);

  const goToAgenda = (eventId: string) => {
    navigate('/agenda', { state: { highlightId: eventId } });
  };

  const handleDelete = (id: string) => {
    const reason = prompt("Motivo da exclusão (Auditado):");
    if (reason) onDelete(id, reason);
  };

  // Helper to render Time ago
  const getTimeAgo = (timestamp: number) => {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return 'Agora mesmo';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m atrás`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h atrás`;
      return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 space-y-6 animate-fade-in">
      
      {/* HEADER (MATCHING COMMUNITY FEED STYLE) */}
      <div className="border-b border-navy-700 pb-4 flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-serif text-bege-50">Mural de Avisos</h1>
           <p className="text-bege-200">Comunicados oficiais e atualizações da gestão.</p>
        </div>
        
        {canPost && (
             <button 
             onClick={() => setShowCreateModal(true)}
             className="bg-ocre-600 hover:bg-ocre-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
           >
             <Plus className="w-5 h-5" /> <span className="hidden md:inline">Criar</span>
           </button>
        )}
      </div>

      {/* --- PINNED: NEXT EVENT WIDGET (STYLED AS A FEED CARD) --- */}
      {nextEvent && (
        <div 
            onClick={() => goToAgenda(nextEvent.id)}
            className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden cursor-pointer group hover:border-ocre-500 transition-colors relative"
        >
            <div className="absolute top-0 right-0 bg-ocre-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3"/> Próximo Compromisso
            </div>

            <div className="p-4 flex gap-4">
                 {/* Date Box */}
                 <div className="flex-shrink-0 w-16 h-16 bg-navy-900 rounded-lg flex flex-col items-center justify-center text-bege-50 border border-navy-700">
                     <span className="text-xs font-bold uppercase text-ocre-500">{new Date(nextEvent.date).toLocaleString('pt-BR', { month: 'short' }).replace('.','')}</span>
                     <span className="text-2xl font-serif font-bold leading-none">{new Date(nextEvent.date).getDate()}</span>
                 </div>

                 <div className="flex-1">
                     <div className="flex justify-between items-start">
                         <div>
                            <h3 className="text-lg font-bold text-navy-900 group-hover:text-ocre-600 transition-colors">{nextEvent.title}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3"/> {new Date(nextEvent.date).toLocaleDateString()} às {nextEvent.timeStr}
                            </p>
                         </div>
                     </div>
                     
                     <div className="mt-2 flex items-center gap-2 text-sm text-navy-700 font-medium">
                        <MapPin className="w-4 h-4 text-ocre-500" />
                        <span className="truncate">
                           {typeof nextEvent.location === 'string' ? nextEvent.location : nextEvent.location?.address}
                        </span>
                     </div>
                 </div>

                 <div className="flex items-center justify-center px-2">
                     <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-ocre-100 transition-colors">
                         <Share2 className="w-5 h-5 text-gray-400 group-hover:text-ocre-600"/>
                     </div>
                 </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-2 text-xs flex justify-between items-center border-t border-gray-100">
                <span className="text-gray-500">{nextEvent.attendees.filter(a => a.status === 'CONFIRMED').length} Confirmados</span>
                <span className="font-bold text-ocre-600 group-hover:underline">Toque para Confirmar</span>
            </div>
        </div>
      )}

      {/* --- POST FEED --- */}
      <div className="space-y-6">
        {wallPosts.length === 0 && !nextEvent && (
            <div className="text-center py-12 opacity-50">
                <p>Nenhuma postagem no mural ainda.</p>
            </div>
        )}

        {wallPosts.map(post => {
            // Find User details for the header
            // Note: In a real app we'd map ID to User, here we assume authorId might be Name or ID. 
            // Since mock data uses names for Posts, we handle it loosely or look up.
            // For the visual requirement, we just render what we have nicely.
            
            return (
                <div key={post.id} className="bg-navy-900 rounded-xl border border-navy-700 shadow-lg overflow-hidden flex flex-col">
                    
                    {/* POST HEADER */}
                    <div className="p-4 flex items-center gap-3 border-b border-navy-800">
                        <div className="w-10 h-10 rounded-full bg-navy-700 border border-navy-600 flex items-center justify-center text-sm font-bold text-bege-100">
                            {post.authorId.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-bege-50">{post.authorId}</span>
                                <span className="text-[10px] text-bege-200/50 uppercase tracking-wide border border-navy-600 px-1 rounded">Gestor</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-bege-200/40">
                                <span>{getTimeAgo(post.createdAt)}</span>
                                <span>•</span>
                                <span className="uppercase font-bold tracking-wider text-ocre-500">POST</span>
                            </div>
                        </div>
                        {canPost && (
                            <button onClick={() => handleDelete(post.id)} className="text-navy-500 hover:text-red-400">
                                <MoreHorizontal className="w-5 h-5"/>
                            </button>
                        )}
                    </div>

                    {/* POST CONTENT */}
                    <div className="p-4 text-bege-100">
                        {post.title && <h3 className="font-bold text-lg mb-2 text-white">{post.title}</h3>}
                        <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>

                        {/* Media */}
                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <div className="mt-4 rounded-lg overflow-hidden border border-navy-700">
                                <img src={post.mediaUrls[0]} alt="Post Media" className="w-full h-auto object-cover max-h-[400px]" />
                            </div>
                        )}
                         {post.videoUrl && (
                            <div className="mt-4 rounded-lg overflow-hidden border border-navy-700 bg-black aspect-video">
                                <video src={post.videoUrl} controls className="w-full h-full" />
                            </div>
                        )}

                        {/* Poll Widget inside Post */}
                        {post.postType === 'POLL' && post.poll && (
                            <div className="mt-4 bg-navy-950/50 rounded-xl border border-navy-800 p-4">
                                <div className="space-y-2">
                                    {post.poll.options.map((opt, idx) => {
                                        const hasVoted = opt.votes.includes(currentUser.id);
                                        const totalVotes = post.poll!.options.reduce((acc, o) => acc + o.votes.length, 0);
                                        const percent = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                                        
                                        return (
                                            <div key={opt.id} className="relative">
                                                {/* Progress Bar Background */}
                                                <div className="absolute inset-0 bg-navy-800 rounded-lg overflow-hidden">
                                                    <div 
                                                        className={`h-full opacity-20 transition-all duration-500 ${hasVoted ? 'bg-ocre-500' : 'bg-bege-500'}`} 
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => onVote(post.id, opt.id)}
                                                    className={`relative w-full p-3 flex justify-between items-center rounded-lg border transition-colors ${
                                                        hasVoted ? 'border-ocre-500 text-ocre-400' : 'border-transparent hover:bg-white/5 text-bege-200'
                                                    }`}
                                                >
                                                    <span className="font-bold text-sm">{opt.text}</span>
                                                    <span className="text-xs font-mono">{percent}%</span>
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="mt-3 text-right text-xs text-bege-200/30">
                                    {post.poll.options.reduce((acc, o) => acc + o.votes.length, 0)} votos totais
                                </div>
                            </div>
                        )}

                        {/* Location Tag */}
                        {post.location && (
                            <div className="mt-3 flex items-center gap-1 text-xs font-bold text-ocre-500 uppercase tracking-wide">
                                <MapPin className="w-3 h-3" /> {post.location.address.split(',')[0]}
                            </div>
                        )}
                    </div>

                    {/* POST FOOTER (ACTIONS) */}
                    <div className="bg-navy-950/30 p-3 border-t border-navy-800 flex items-center justify-between text-bege-200 text-sm font-medium">
                        <button className="flex items-center gap-2 hover:text-ocre-500 transition-colors px-2 py-1 rounded hover:bg-white/5">
                            <Heart className={`w-4 h-4 ${post.likes > 0 ? 'fill-current text-ocre-500' : ''}`} /> 
                            {post.likes} <span className="hidden sm:inline">Aplausos</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-ocre-500 transition-colors px-2 py-1 rounded hover:bg-white/5">
                            <MessageSquare className="w-4 h-4" /> 
                            {post.comments} <span className="hidden sm:inline">Comentários</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-ocre-500 transition-colors px-2 py-1 rounded hover:bg-white/5">
                            <Share2 className="w-4 h-4" /> 
                            <span className="hidden sm:inline">Compartilhar</span>
                        </button>
                    </div>

                </div>
            );
        })}
      </div>

      {showCreateModal && (
        <CreatePostModal 
            currentUser={currentUser} 
            onClose={() => setShowCreateModal(false)} 
            onSubmit={onAddPost} 
        />
      )}
    </div>
  );
};
