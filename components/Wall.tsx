import React, { useState } from 'react';
import { User, PostItem, UserRole, PollOption, LocationData, EventItem, Comment } from '../types';
import { Plus, Image as ImageIcon, Link as LinkIcon, AtSign, Hash, BarChart2, MessageSquare, Trash2, X, Check, Users, MapPin, Heart, Share2, Music, Calendar, Clock, MoreHorizontal, Smile, Send, Edit2, CheckCircle2, Repeat, ExternalLink, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { LocationPicker } from './LocationPicker';
import { useNavigate } from 'react-router-dom';
import { CreatePostModal } from './CreatePostModal';
import { useApp } from '../App';

interface Props {
  currentUser: User;
  allUsers: User[];
  posts: PostItem[];
  events: EventItem[];
  onAddPost: (post: any) => void;
  onVote: (postId: string, optionId: string) => void;
  onDelete: (postId: string, reason: string) => void;
}

// --- SHARED HELPER COMPONENTS (Duplicated from Community.tsx for isolation but could be extracted) ---

const Lightbox = ({ imageUrl, onClose }: { imageUrl: string, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-50">
                <X className="w-8 h-8" />
            </button>
            <img src={imageUrl} alt="Full size" className="max-w-full max-h-full object-contain rounded-sm shadow-2xl pointer-events-auto" onClick={(e) => e.stopPropagation()} />
        </div>
    );
};

const ExpandableText = ({ content }: { content: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const limit = 100;
    
    if (content.length <= limit) {
        return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
    }

    return (
        <div className="mb-2">
            <p className="whitespace-pre-wrap leading-relaxed">
                {isExpanded ? content : content.slice(0, limit) + '...'}
            </p>
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="text-ocre-500 font-bold italic text-sm mt-1 hover:underline"
            >
                {isExpanded ? 'Ler menos' : 'Leia mais'}
            </button>
        </div>
    );
};

const ImageCarousel = ({ images, onImageClick }: { images: string[], onImageClick: (url: string) => void }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const next = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveIndex((prev) => (prev + 1) % images.length);
    };

    const prev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (images.length === 0) return null;

    return (
        <div className="mt-4 rounded-xl overflow-hidden border border-navy-700 relative group bg-black aspect-video md:aspect-[16/9]">
            <img 
                src={images[activeIndex]} 
                alt={`Slide ${activeIndex}`}
                className="w-full h-full object-contain cursor-pointer transition-opacity duration-300"
                onClick={() => onImageClick(images[activeIndex])}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

            {images.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {images.map((_, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeIndex ? 'bg-white scale-125' : 'bg-white/40'}`}></div>
                        ))}
                    </div>
                     <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full font-bold backdrop-blur-sm">
                        {activeIndex + 1}/{images.length}
                    </div>
                </>
            )}
             <button 
                className="absolute bottom-3 right-3 p-1.5 bg-black/40 rounded text-white opacity-0 group-hover:opacity-100 hover:bg-black/60 transition-all"
                onClick={(e) => { e.stopPropagation(); onImageClick(images[activeIndex]); }}
            >
                <Maximize2 className="w-4 h-4" />
            </button>
        </div>
    );
};

// Helper Emojis
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🎺', '🎷', '🥁', '🎵', '🎼', '🔥'];

const WallCommentSection = ({ post, currentUser }: { post: PostItem, currentUser: User }) => {
    const { addComment, deleteComment, editComment, toggleCommentLike } = useApp();
    const [replyTo, setReplyTo] = useState<string | undefined>(undefined); 
    const [editId, setEditId] = useState<string | null>(null);
    const [inputContent, setInputContent] = useState('');
    const [showEmojis, setShowEmojis] = useState(false);
  
    const handleSend = () => {
      if (!inputContent.trim()) return;
      if (editId) {
          editComment(post.id, editId, inputContent);
          setEditId(null);
      } else {
          addComment(post.id, inputContent, replyTo);
      }
      setInputContent('');
      setReplyTo(undefined);
      setShowEmojis(false);
    };
  
    const startReply = (commentId: string, authorName: string) => {
        setReplyTo(commentId);
        setEditId(null);
        setInputContent(`@${authorName} `);
    };
  
    const startEdit = (comment: Comment) => {
        setEditId(comment.id);
        setReplyTo(undefined);
        setInputContent(comment.content);
    };
  
    const handleEmojiClick = (emoji: string) => {
        setInputContent(prev => prev + emoji);
    };
  
    const CommentItem: React.FC<{ comment: Comment, depth?: number }> = ({ comment, depth = 0 }) => {
        const isAuthor = comment.authorId === currentUser.id;
        const canEdit = isAuthor && (Date.now() - comment.createdAt < 8 * 60 * 60 * 1000); 
        const hasLiked = comment.likedBy.includes(currentUser.id);
  
        return (
            <div className={`flex gap-3 mb-3 ${depth > 0 ? 'ml-8 border-l-2 border-navy-700 pl-3' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-navy-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-bege-200">
                    {comment.authorName.charAt(0)}
                </div>
                <div className="flex-1">
                    <div className="bg-navy-950 rounded-lg p-3 relative group border border-navy-800">
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-sm text-bege-50">{comment.authorName}</span>
                            <span className="text-[10px] text-bege-200/40">
                                {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                        <p className="text-sm text-bege-100 mt-1 whitespace-pre-wrap">{comment.content}</p>
                        
                        {(isAuthor) && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                {canEdit && (
                                    <button onClick={() => startEdit(comment)} className="p-1 text-gray-400 hover:text-white">
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                )}
                                <button onClick={() => deleteComment(post.id, comment.id)} className="p-1 text-gray-400 hover:text-red-400">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-xs text-bege-200/50 pl-1">
                        <button 
                          onClick={() => toggleCommentLike(post.id, comment.id)}
                          className={`font-bold hover:underline flex items-center gap-1 ${hasLiked ? 'text-red-500' : 'hover:text-bege-100'}`}
                        >
                            {hasLiked ? 'Descurtir' : 'Curtir'} 
                            {comment.likedBy.length > 0 && <span className="bg-navy-800 px-1 rounded-full text-[9px]">{comment.likedBy.length}</span>}
                        </button>
                        <button onClick={() => startReply(comment.id, comment.authorName)} className="font-bold hover:text-bege-100 hover:underline">
                            Responder
                        </button>
                    </div>
  
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2">
                            {comment.replies.map(reply => (
                                <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };
  
    return (
        <div className="border-t border-navy-800 pt-4 mt-2 bg-navy-900/40 p-2 rounded-lg">
            <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {post.comments.length === 0 ? (
                    <p className="text-center text-sm text-bege-200/30 italic py-4">Nenhum comentário.</p>
                ) : (
                    post.comments.map(c => <CommentItem key={c.id} comment={c} />)
                )}
            </div>
  
            <div className="flex gap-2 items-end relative">
                <div className="relative flex-1">
                    <textarea 
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
                      placeholder={replyTo ? "Escreva uma resposta..." : "Comentar no mural..."}
                      className="w-full bg-navy-950 border border-navy-700 rounded-lg p-3 pr-10 text-sm text-bege-100 focus:border-ocre-500 outline-none resize-none h-12 min-h-[48px]"
                    />
                    <button 
                      onClick={() => setShowEmojis(!showEmojis)}
                      className="absolute right-3 top-3 text-bege-200/50 hover:text-yellow-500 transition-colors"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    
                    {showEmojis && (
                        <div className="absolute bottom-full right-0 mb-2 bg-navy-800 border border-navy-600 rounded-lg p-2 shadow-xl grid grid-cols-4 gap-2 z-10">
                            {COMMON_EMOJIS.map(emoji => (
                                <button key={emoji} onClick={() => handleEmojiClick(emoji)} className="text-xl hover:bg-navy-700 p-1 rounded">
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button 
                   onClick={handleSend}
                   disabled={!inputContent.trim()}
                   className="p-3 bg-ocre-600 rounded-lg text-white hover:bg-ocre-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
            {replyTo && (
              <div className="text-xs text-ocre-400 mt-1 flex items-center justify-between">
                  <span>Respondendo...</span>
                  <button onClick={() => { setReplyTo(undefined); setInputContent(''); }} className="hover:underline">Cancelar</button>
              </div>
          )}
        </div>
    );
};

export const Wall: React.FC<Props> = ({ currentUser, allUsers, posts, events, onAddPost, onVote, onDelete }) => {
  const navigate = useNavigate();
  const { togglePostLike, sharePost } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Share & Menu State
  const [activeShareMenuId, setActiveShareMenuId] = useState<string | null>(null);
  const [shareConfirmPost, setShareConfirmPost] = useState<PostItem | null>(null);
  const [shareCommentary, setShareCommentary] = useState('');
  const [showShareToast, setShowShareToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const canPost = [UserRole.GENERAL_MANAGER, UserRole.WALL_MANAGER_1, UserRole.WALL_MANAGER_2].includes(currentUser.role);

  const nextEvent = events
    .filter(e => e.date > Date.now())
    .sort((a, b) => a.date - b.date)[0];

  const wallPosts = posts
    .filter(p => p.type === 'POST' && p.category === 'WALL') // Strict Category Check
    .sort((a, b) => b.createdAt - a.createdAt);

  const goToAgenda = (eventId: string) => {
    navigate('/agenda', { state: { highlightId: eventId } });
  };

  const handleDelete = (id: string) => {
    const reason = prompt("Motivo da exclusão (Auditado):");
    if (reason) onDelete(id, reason);
  };

  const handleCreatePost = (postData: any) => {
      // Force 'WALL' category for posts created here
      onAddPost({
          ...postData,
          category: 'WALL'
      });
  };

  const getTimeAgo = (timestamp: number) => {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return 'Agora mesmo';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m atrás`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h atrás`;
      return new Date(timestamp).toLocaleDateString();
  };

  // --- SHARE HANDLERS ---
  const handleCopyLink = async (post: PostItem) => {
      const shareData = {
          title: `BandSocial: ${post.title || 'Mural'}`,
          text: post.content,
          url: window.location.href
      };

      if (navigator.share) {
          try {
              await navigator.share(shareData);
          } catch (err) {}
      } else {
          navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`).then(() => {
              setToastMessage('Link copiado!');
              setShowShareToast(true);
              setTimeout(() => setShowShareToast(false), 3000);
          });
      }
      setActiveShareMenuId(null);
  };

  const openShareConfirm = (post: PostItem) => {
      setShareConfirmPost(post);
      setShareCommentary('');
      setActiveShareMenuId(null);
  };

  const confirmShare = () => {
      if (!shareConfirmPost) return;
      sharePost(shareConfirmPost.id, shareCommentary);
      
      setShareConfirmPost(null);
      setShareCommentary('');
      
      setToastMessage('Compartilhado no Feed!');
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
  };

  const handleShareEvent = (e: React.MouseEvent, event: EventItem) => {
      e.stopPropagation();
      const locStr = typeof event.location === 'string' ? event.location : event.location?.address;
      const text = `${event.title}\nData: ${new Date(event.date).toLocaleString()}\nLocal: ${locStr}`;
      
      if (navigator.share) {
         navigator.share({ title: 'Próximo Evento', text, url: window.location.href });
      } else {
         navigator.clipboard.writeText(text).then(() => {
            setToastMessage('Evento copiado!');
            setShowShareToast(true);
            setTimeout(() => setShowShareToast(false), 3000);
         });
      }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 space-y-6 animate-fade-in relative">
      
      {/* Lightbox Modal */}
      {lightboxImage && (
          <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}

      {/* Toast Notification */}
      {showShareToast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
              <div className="bg-ocre-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold border border-white/20">
                  <CheckCircle2 className="w-5 h-5" /> {toastMessage}
              </div>
          </div>
      )}

      {/* Share Confirmation Modal */}
      {shareConfirmPost && (
          <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
              <div className="bg-navy-900 w-full max-w-md rounded-2xl border border-navy-600 shadow-2xl overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-navy-700 flex justify-between items-center bg-navy-950">
                      <h3 className="font-bold text-bege-50 flex items-center gap-2">
                          <Repeat className="w-5 h-5 text-ocre-500" /> Compartilhar no Feed
                      </h3>
                      <button onClick={() => setShareConfirmPost(null)}><X className="w-5 h-5 text-gray-400"/></button>
                  </div>
                  
                  <div className="p-6">
                      <textarea 
                          autoFocus
                          value={shareCommentary}
                          onChange={(e) => setShareCommentary(e.target.value)}
                          placeholder="Adicione um comentário (opcional)..."
                          className="w-full bg-navy-950 border border-navy-700 rounded-lg p-3 text-bege-100 focus:border-ocre-500 outline-none resize-none h-24 mb-4"
                      />

                      <div className="border border-navy-700 rounded-lg p-3 bg-navy-950/50 opacity-70 pointer-events-none">
                          <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded-full bg-navy-700 flex items-center justify-center text-[10px] text-bege-200">
                                  {shareConfirmPost.authorId.charAt(0)}
                              </div>
                              <span className="text-xs font-bold text-bege-100">{shareConfirmPost.authorId}</span>
                          </div>
                          <p className="text-xs text-bege-200 line-clamp-2">{shareConfirmPost.content}</p>
                      </div>
                  </div>

                  <div className="p-4 bg-navy-950 flex justify-end gap-3 border-t border-navy-700">
                      <button onClick={() => setShareConfirmPost(null)} className="px-4 py-2 text-bege-200 font-bold hover:text-white">Cancelar</button>
                      <button 
                        onClick={confirmShare} 
                        className="bg-ocre-600 hover:bg-ocre-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"
                      >
                          <Send className="w-4 h-4" /> Compartilhar
                      </button>
                  </div>
              </div>
          </div>
      )}

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

      {nextEvent && (
        <div 
            onClick={() => goToAgenda(nextEvent.id)}
            className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden cursor-pointer group hover:border-ocre-500 transition-colors relative"
        >
            <div className="absolute top-0 right-0 bg-ocre-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3"/> Próximo Compromisso
            </div>

            <div className="p-4 flex gap-4">
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
                     <div 
                        onClick={(e) => handleShareEvent(e, nextEvent)}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-ocre-100 transition-colors z-20"
                     >
                         <Share2 className="w-5 h-5 text-gray-400 hover:text-ocre-600"/>
                     </div>
                 </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-2 text-xs flex justify-between items-center border-t border-gray-100">
                <span className="text-gray-500">{nextEvent.attendees.filter(a => a.status === 'CONFIRMED').length} Confirmados</span>
                <span className="font-bold text-ocre-600 group-hover:underline">Toque para Confirmar</span>
            </div>
        </div>
      )}

      <div className="space-y-6">
        {wallPosts.length === 0 && !nextEvent && (
            <div className="text-center py-12 opacity-50">
                <p>Nenhuma postagem no mural ainda.</p>
            </div>
        )}

        {wallPosts.map(post => {
            const isLiked = post.likedBy.includes(currentUser.id);
            const commentsCount = post.comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

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
                        
                        {/* EXPANDABLE TEXT */}
                        <ExpandableText content={post.content} />

                        {/* CAROUSEL */}
                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <ImageCarousel images={post.mediaUrls} onImageClick={setLightboxImage} />
                        )}

                        {post.videoUrl && (
                            <div className="mt-4 rounded-lg overflow-hidden border border-navy-700 bg-black aspect-video">
                                <video src={post.videoUrl} controls className="w-full h-full" />
                            </div>
                        )}

                        {post.postType === 'POLL' && post.poll && (
                            <div className="mt-4 bg-navy-950/50 rounded-xl border border-navy-800 p-4">
                                <div className="space-y-2">
                                    {post.poll.options.map((opt, idx) => {
                                        const hasVoted = opt.votes.includes(currentUser.id);
                                        const totalVotes = post.poll!.options.reduce((acc, o) => acc + o.votes.length, 0);
                                        const percent = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                                        
                                        return (
                                            <div key={opt.id} className="relative">
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

                        {post.location && (
                            <div className="mt-3 flex items-center gap-1 text-xs font-bold text-ocre-500 uppercase tracking-wide">
                                <MapPin className="w-3 h-3" /> {post.location.address.split(',')[0]}
                            </div>
                        )}
                    </div>

                    {/* POST FOOTER (ACTIONS) */}
                    <div className="bg-navy-950/30 p-3 border-t border-navy-800 flex items-center justify-between text-bege-200 text-sm font-medium relative z-10">
                        <button 
                            onClick={() => togglePostLike(post.id)}
                            className={`flex items-center gap-2 transition-colors px-2 py-1 rounded hover:bg-white/5 ${isLiked ? 'text-red-500' : 'hover:text-ocre-500'}`}
                        >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} /> 
                            {post.likedBy.length} <span className="hidden sm:inline">Aplausos</span>
                        </button>
                        
                        <button 
                            onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                            className={`flex items-center gap-2 transition-colors px-2 py-1 rounded hover:bg-white/5 ${activeCommentPostId === post.id ? 'text-ocre-500' : 'hover:text-ocre-500'}`}
                        >
                            <MessageSquare className="w-4 h-4" /> 
                            {commentsCount} <span className="hidden sm:inline">Comentários</span>
                        </button>
                        
                        {/* Share Menu Trigger */}
                        <div className="relative">
                            <button 
                                onClick={() => setActiveShareMenuId(activeShareMenuId === post.id ? null : post.id)}
                                className={`flex items-center gap-2 transition-colors px-2 py-1 rounded hover:bg-white/5 active:scale-95 transform ${activeShareMenuId === post.id ? 'text-ocre-500' : 'hover:text-ocre-500'}`}
                            >
                                <Share2 className="w-4 h-4" /> 
                                <span className="hidden sm:inline">Compartilhar</span>
                            </button>

                            {/* Dropdown Menu */}
                            {activeShareMenuId === post.id && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-navy-900 border border-navy-600 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-20">
                                    <button 
                                        onClick={() => openShareConfirm(post)}
                                        className="w-full text-left px-4 py-3 hover:bg-navy-800 text-sm font-bold text-bege-100 flex items-center gap-2 border-b border-navy-700"
                                    >
                                        <Repeat className="w-4 h-4 text-ocre-500" /> Repostar no Feed
                                    </button>
                                    <button 
                                        onClick={() => handleCopyLink(post)}
                                        className="w-full text-left px-4 py-3 hover:bg-navy-800 text-sm font-bold text-bege-100 flex items-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4 text-gray-400" /> Copiar Link
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comment Section (Expanded) */}
                    {activeCommentPostId === post.id && (
                        <div className="p-4 bg-navy-950/30">
                            <WallCommentSection post={post} currentUser={currentUser} />
                        </div>
                    )}

                </div>
            );
        })}
      </div>

      {showCreateModal && (
        <CreatePostModal 
            currentUser={currentUser} 
            onClose={() => setShowCreateModal(false)} 
            onSubmit={handleCreatePost} 
        />
      )}
    </div>
  );
};