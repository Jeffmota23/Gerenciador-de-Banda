
import React, { useMemo, useState } from 'react';
import { PostItem, User, Comment } from '../types';
import { Heart, MessageCircle, Share2, Video, UserPlus, Check, Sparkles, Music, Lock, MapPin, Plus, Mic, Send, Smile, MoreHorizontal, Edit2, Trash2, CornerDownRight, Link as LinkIcon, CheckCircle2, Repeat, ExternalLink, X, AlertTriangle, Search, UserCheck, Users, Filter } from 'lucide-react';
import { CreatePostModal } from './CreatePostModal';
import { useApp } from '../App';

interface Props {
  posts: PostItem[];
  currentUser: User;
  allUsers: User[];
  onToggleFollow: (id: string) => void;
  onAddPost?: (post: any) => void; 
}

// Helper Emojis
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🎺', '🎷', '🥁', '🎵', '🎼', '🔥'];

const CommentSection = ({ post, currentUser }: { post: PostItem, currentUser: User }) => {
  const { addComment, deleteComment, editComment, toggleCommentLike } = useApp();
  const [replyTo, setReplyTo] = useState<string | undefined>(undefined); // ID of comment being replied to
  const [editId, setEditId] = useState<string | null>(null); // ID of comment being edited
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

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment, depth?: number }) => {
      const isAuthor = comment.authorId === currentUser.id;
      const canEdit = isAuthor && (Date.now() - comment.createdAt < 8 * 60 * 60 * 1000); // 8 hours
      const hasLiked = comment.likedBy.includes(currentUser.id);

      return (
          <div className={`flex gap-3 mb-3 ${depth > 0 ? 'ml-8 border-l-2 border-navy-700 pl-3' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-navy-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-bege-200">
                  {comment.authorName.charAt(0)}
              </div>
              <div className="flex-1">
                  <div className="bg-navy-900 rounded-lg p-3 relative group">
                      <div className="flex justify-between items-start">
                          <span className="font-bold text-sm text-bege-50">{comment.authorName}</span>
                          <span className="text-[10px] text-bege-200/40">
                              {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              {comment.updatedAt && ' (editado)'}
                          </span>
                      </div>
                      <p className="text-sm text-bege-100 mt-1 whitespace-pre-wrap">{comment.content}</p>
                      
                      {/* Comment Actions Dropdown (Simulated with hover for simplicity) */}
                      {(isAuthor) && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                              {canEdit && (
                                  <button onClick={() => startEdit(comment)} className="p-1 text-gray-400 hover:text-white" title="Editar (8h)">
                                      <Edit2 className="w-3 h-3" />
                                  </button>
                              )}
                              <button onClick={() => deleteComment(post.id, comment.id)} className="p-1 text-gray-400 hover:text-red-400" title="Excluir">
                                  <Trash2 className="w-3 h-3" />
                              </button>
                          </div>
                      )}
                  </div>
                  
                  {/* Action Bar */}
                  <div className="flex items-center gap-4 mt-1 text-xs text-bege-200/50 pl-1">
                      <button 
                        onClick={() => toggleCommentLike(post.id, comment.id)}
                        className={`font-bold hover:underline flex items-center gap-1 ${hasLiked ? 'text-red-500' : 'hover:text-bege-100'}`}
                      >
                          {hasLiked ? 'Descurtir' : 'Curtir'} 
                          {comment.likedBy.length > 0 && <span className="bg-navy-700 px-1 rounded-full text-[9px]">{comment.likedBy.length}</span>}
                      </button>
                      <button 
                        onClick={() => startReply(comment.id, comment.authorName)}
                        className="font-bold hover:text-bege-100 hover:underline"
                      >
                          Responder
                      </button>
                  </div>

                  {/* Recursion for Replies */}
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
      <div className="border-t border-navy-700 pt-4 mt-2">
          {/* List */}
          <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {post.comments.length === 0 ? (
                  <p className="text-center text-sm text-bege-200/30 italic py-4">Seja o primeiro a comentar.</p>
              ) : (
                  post.comments.map(c => <CommentItem key={c.id} comment={c} />)
              )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2 items-end relative">
              <div className="relative flex-1">
                  <textarea 
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    placeholder={replyTo ? "Escreva uma resposta..." : "Escreva um comentário..."}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg p-3 pr-10 text-sm text-bege-100 focus:border-ocre-500 outline-none resize-none h-12 min-h-[48px]"
                  />
                  <button 
                    onClick={() => setShowEmojis(!showEmojis)}
                    className="absolute right-3 top-3 text-bege-200/50 hover:text-yellow-500 transition-colors"
                  >
                      <Smile className="w-5 h-5" />
                  </button>
                  
                  {/* Emoji Picker */}
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
           {editId && (
              <div className="text-xs text-ocre-400 mt-1 flex items-center justify-between">
                  <span>Editando comentário...</span>
                  <button onClick={() => { setEditId(null); setInputContent(''); }} className="hover:underline">Cancelar</button>
              </div>
          )}
      </div>
  );
};

export const Community: React.FC<Props> = ({ posts, currentUser, allUsers, onToggleFollow, onAddPost }) => {
  const { togglePostLike, sharePost } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false); // Mobile Search State
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeShareMenuId, setActiveShareMenuId] = useState<string | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Share Modal State
  const [shareConfirmPost, setShareConfirmPost] = useState<PostItem | null>(null);
  const [shareCommentary, setShareCommentary] = useState('');
  const [showShareToast, setShowShareToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleCreatePost = (postData: any) => {
    if (onAddPost) {
        onAddPost({
            ...postData,
            category: 'COMMUNITY' // Force community category
        });
    }
  };

  // --- SHARE LOGIC ---
  const handleCopyLink = async (post: PostItem) => {
      const shareData = {
          title: post.title ? `BandSocial: ${post.title}` : 'Postagem BandSocial',
          text: `${post.title ? post.title + '\n' : ''}${post.content}\n\nAutor: ${post.authorId}`,
          url: window.location.href
      };

      if (navigator.share) {
          try {
              await navigator.share(shareData);
          } catch (err) {}
      } else {
          navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n${shareData.url}`).then(() => {
              setToastMessage('Link copiado para a área de transferência!');
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
      
      setToastMessage('Compartilhado no seu feed com sucesso!');
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
  };

  // --- SEARCH LOGIC ---
  const searchResults = useMemo(() => {
     if (!searchQuery.trim()) return [];
     const lowerQuery = searchQuery.toLowerCase();
     return allUsers.filter(u => 
        u.id !== currentUser.id && // Exclude self
        (u.name.toLowerCase().includes(lowerQuery) || u.instrument.toLowerCase().includes(lowerQuery))
     );
  }, [allUsers, searchQuery, currentUser.id]);

  // --- RECOMMENDATION ENGINE ---
  const recommendations = useMemo(() => {
    return allUsers
      .filter(u => u.id !== currentUser.id && !currentUser.following.includes(u.id))
      .map(candidate => {
        let score = 0;
        let reasons: string[] = [];

        if (candidate.instrument === currentUser.instrument) {
          score += 3;
          reasons.push("Mesmo Naipe");
        } 
        const levelDiff = Math.abs(candidate.level - currentUser.level);
        if (levelDiff <= 3) {
          score += 2;
          reasons.push("Nível Compatível");
        } else if (levelDiff <= 10) {
          score += 1;
        }

        // Slight boost for highly active users
        if (candidate.attendanceRate > 90) {
            score += 0.5;
        }

        return { user: candidate, score, reasons };
      })
      .filter(rec => rec.score > 0) 
      .sort((a, b) => b.score - a.score) 
      .slice(0, 5); 
  }, [currentUser, allUsers]);

  // --- SUB-COMPONENT: USER CARD ---
  const UserCard = ({ user, reasons, isResult = false }: { user: User, reasons?: string[], isResult?: boolean }) => {
      const isFollowing = currentUser.following.includes(user.id);
      
      return (
        <div className="flex items-center justify-between group p-3 rounded-xl hover:bg-navy-700/50 transition-colors border border-transparent hover:border-navy-600">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center font-bold text-bege-200 border border-navy-600 shadow-sm relative">
                    {user.name.charAt(0)}
                    {user.role !== 'MEMBER' && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-ocre-500 rounded-full border-2 border-navy-800"></div>}
                </div>
                <div>
                    <p className="text-sm font-bold text-bege-50 leading-tight">{user.name.split(' ').slice(0, 2).join(' ')}</p>
                    <p className="text-xs text-bege-200/60 flex items-center gap-1">
                        <Music className="w-3 h-3" /> {user.instrument}
                    </p>
                    {reasons && reasons.length > 0 && (
                        <div className="flex gap-1 mt-1">
                            {reasons.map(r => (
                                <span key={r} className="text-[9px] bg-ocre-900/30 text-ocre-400 px-1.5 py-0.5 rounded border border-ocre-900/50">{r}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <button 
                onClick={() => onToggleFollow(user.id)} 
                className={`p-2 rounded-full transition-all border ${
                    isFollowing 
                    ? 'bg-navy-900 text-green-500 border-green-900 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900' 
                    : 'bg-navy-900 hover:bg-ocre-600 text-ocre-500 hover:text-white border-navy-600'
                }`}
                title={isFollowing ? "Deixar de seguir" : "Seguir"}
            >
                {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </button>
        </div>
      );
  };

  // --- REUSABLE DISCOVERY PANEL CONTENT ---
  const DiscoveryContent = () => (
      <div className="animate-fade-in h-full flex flex-col">
         {/* Search Input */}
         <div className="relative mb-6">
            <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-ocre-500 transition-colors" />
            <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar músicos ou naipes..."
                className="w-full bg-navy-900 border border-navy-600 rounded-lg py-2.5 pl-10 pr-8 text-sm text-bege-100 outline-none focus:border-ocre-500 focus:ring-1 focus:ring-ocre-500 transition-all shadow-inner"
            />
            {searchQuery && (
                <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-bege-200"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
            </div>
         </div>

         {/* Content Area */}
         <div className="flex-1 overflow-y-auto custom-scrollbar">
            {searchQuery ? (
                <div>
                    <h3 className="font-bold text-sm text-bege-50 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-ocre-500" /> Resultados da Busca
                    </h3>
                    {searchResults.length === 0 ? (
                        <div className="text-center py-8 text-sm text-gray-400">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            Nenhum músico encontrado.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {searchResults.map(user => (
                                <UserCard key={user.id} user={user} isResult={true} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <h3 className="font-serif text-lg text-bege-50 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ocre-500" /> Sugestões para Você
                    </h3>
                    
                    {recommendations.length === 0 ? (
                    <p className="text-sm text-bege-200/50 text-center py-4">Todas as sugestões foram seguidas!</p>
                    ) : (
                    <div className="space-y-3">
                        {recommendations.map(({ user, reasons }) => (
                        <UserCard key={user.id} user={user} reasons={reasons} />
                        ))}
                    </div>
                    )}
                </div>
            )}
         </div>
      </div>
  );

  // --- VISIBILITY FILTER ---
  const visiblePosts = posts.filter(post => {
    if (post.category !== 'COMMUNITY' && !post.originalPostId) return false;
    if (post.authorId === currentUser.name) return true; 
    if (post.visibility === 'PUBLIC') return true;
    const authorUser = allUsers.find(u => u.name === post.authorId);
    if (!authorUser) return false;
    return currentUser.following.includes(authorUser.id);
  });

  const renderPostContent = (post: PostItem, isNested = false) => {
      return (
          <>
            {isNested && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-navy-700/50">
                    <div className="w-6 h-6 rounded-full bg-navy-600 flex items-center justify-center font-bold text-bege-100 text-[10px]">
                        {post.authorId.substring(0,2).toUpperCase()}
                    </div>
                    <span className="font-bold text-bege-50 text-xs">{post.authorId}</span>
                    <span className="text-[10px] text-bege-200/50">• Original</span>
                </div>
            )}

            {post.title && (
                <h4 className={`font-bold ${isNested ? 'text-sm' : 'text-lg'} text-bege-50 mb-2`}>{post.title}</h4>
            )}

            <p className={`text-bege-100 ${isNested ? 'text-xs line-clamp-3' : 'mb-4'} whitespace-pre-wrap`}>{post.content}</p>
            
            {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className={`grid gap-2 ${post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} mt-2`}>
                    {post.mediaUrls.map((url, i) => (
                        <img key={i} src={url} className={`rounded-lg w-full ${isNested ? 'h-32' : 'h-48'} object-cover border border-navy-600`} />
                    ))}
                </div>
            )}

            {post.videoUrl && (
                <div className={`rounded-lg overflow-hidden bg-black border border-navy-600 aspect-video relative group mt-2`}>
                    <video src={post.videoUrl} controls className="w-full h-full" />
                </div>
            )}

            {post.audioUrl && (
                <div className="mt-2 bg-navy-900 p-2 rounded-lg border border-navy-600 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-ocre-600 flex items-center justify-center">
                        <Mic className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-bege-200 mb-1 font-bold uppercase">Nota de Voz</p>
                        <audio src={post.audioUrl} controls className="w-full h-6" />
                    </div>
                </div>
            )}

            {post.location && (
                <p className={`text-[10px] text-ocre-500 flex items-center gap-1 mt-2 font-bold uppercase`}>
                    <MapPin className="w-3 h-3"/> {post.location.address}
                </p>
            )}
          </>
      )
  };

  return (
    <div className="max-w-6xl mx-auto mb-20 animate-fade-in relative">
      
      {showShareToast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
              <div className="bg-ocre-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold border border-white/20">
                  <CheckCircle2 className="w-5 h-5" /> {toastMessage}
              </div>
          </div>
      )}

      {shareConfirmPost && (
          <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
              <div className="bg-navy-900 w-full max-w-md rounded-2xl border border-navy-600 shadow-2xl overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-navy-700 flex justify-between items-center bg-navy-950">
                      <h3 className="font-bold text-bege-50 flex items-center gap-2">
                          <Repeat className="w-5 h-5 text-ocre-500" /> Compartilhar Publicação
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
                          <Send className="w-4 h-4" /> Compartilhar Agora
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MOBILE SEARCH MODAL */}
      {showDiscoveryModal && (
         <div className="fixed inset-0 z-[80] bg-navy-950/95 backdrop-blur-sm p-4 animate-fade-in lg:hidden">
            <div className="flex justify-end mb-2">
               <button 
                 onClick={() => setShowDiscoveryModal(false)}
                 className="p-2 rounded-full bg-navy-800 text-bege-200 border border-navy-700 hover:text-white"
               >
                 <X className="w-6 h-6" />
               </button>
            </div>
            <div className="bg-navy-800 rounded-xl p-4 border border-navy-700 h-[90%] shadow-2xl">
                <DiscoveryContent />
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT COLUMN: FEED --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b border-navy-700 pb-4 mb-6 flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-serif text-bege-50">Feed da Comunidade</h2>
                <p className="text-bege-200">Compartilhe seu progresso e apoie seus colegas.</p>
            </div>
            
            <div className="flex gap-2">
                {/* Mobile Search Button */}
                <button 
                  onClick={() => setShowDiscoveryModal(true)}
                  className="lg:hidden bg-navy-800 hover:bg-navy-700 text-bege-100 p-2.5 rounded-lg border border-navy-600"
                  title="Buscar Pessoas"
                >
                   <Search className="w-5 h-5" />
                </button>

                {onAddPost && (
                    <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-ocre-600 hover:bg-ocre-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                    >
                    <Plus className="w-5 h-5" /> Criar
                    </button>
                )}
            </div>
          </div>

          {visiblePosts.length === 0 ? (
            <div className="text-center py-20 bg-navy-800/30 rounded-xl border border-dashed border-navy-700">
               <p className="text-bege-200/60">Nenhuma postagem visível. Seja o primeiro a postar!</p>
               <button onClick={() => setShowCreateModal(true)} className="mt-4 text-ocre-500 font-bold hover:underline">Criar Postagem</button>
            </div>
          ) : (
            <div className="space-y-8">
              {visiblePosts.map(post => {
                const isLiked = post.likedBy.includes(currentUser.id);
                const commentsCount = post.comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

                const originalPost = post.originalPostId ? posts.find(p => p.id === post.originalPostId) : null;
                const isShare = !!post.originalPostId;

                return (
                  <div key={post.id} className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden shadow-lg transition-all hover:border-navy-600 relative">
                    <div className="p-4 flex items-center gap-3 border-b border-navy-700/50">
                      <div className="w-10 h-10 rounded-full bg-navy-600 flex items-center justify-center font-bold text-bege-100">
                        {post.authorId.substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-bege-50 text-sm">{post.authorId}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-bege-200/50">Agora mesmo • {post.type}</span>
                          {post.visibility === 'FOLLOWERS' && (
                            <span className="text-[10px] bg-navy-900 border border-navy-600 px-1.5 rounded flex items-center gap-1 text-bege-200/70">
                              <Lock className="w-3 h-3" /> Privado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      {isShare && post.content && (
                          <p className="text-bege-100 mb-4 whitespace-pre-wrap">{post.content}</p>
                      )}

                      {isShare ? (
                          originalPost ? (
                            <div className="border border-navy-600 rounded-xl p-4 bg-navy-900/50 hover:bg-navy-900 transition-colors cursor-pointer">
                                {renderPostContent(originalPost, true)}
                            </div>
                          ) : (
                            <div className="border border-navy-700 rounded-xl p-4 bg-navy-950 text-center italic text-gray-500">
                                <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                                Publicação original indisponível.
                            </div>
                          )
                      ) : (
                          renderPostContent(post)
                      )}
                    </div>

                    <div className="bg-navy-900/50 p-3 flex gap-6 text-sm text-bege-200 font-medium select-none relative z-10">
                      <button 
                        onClick={() => togglePostLike(post.id)}
                        className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-ocre-500'}`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} /> 
                        {post.likedBy.length} <span className="hidden sm:inline">Aplausos</span>
                      </button>
                      
                      <button 
                        onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                        className={`flex items-center gap-2 transition-colors ${activeCommentPostId === post.id ? 'text-ocre-500' : 'hover:text-ocre-500'}`}
                      >
                        <MessageCircle className="w-4 h-4" /> 
                        {commentsCount} <span className="hidden sm:inline">Comentários</span>
                      </button>
                      
                      <div className="ml-auto relative">
                        <button 
                            onClick={() => setActiveShareMenuId(activeShareMenuId === post.id ? null : post.id)}
                            className={`flex items-center gap-2 transition-colors active:scale-95 transform ${activeShareMenuId === post.id ? 'text-ocre-500' : 'hover:text-ocre-500'}`}
                        >
                            <Share2 className="w-4 h-4" /> Compartilhar
                        </button>

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

                    {activeCommentPostId === post.id && (
                        <div className="p-4 bg-navy-950/30">
                            <CommentSection post={post} currentUser={currentUser} />
                        </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: DISCOVERY SIDEBAR (DESKTOP) --- */}
        <div className="space-y-6 hidden lg:block">
           <div className="bg-navy-800 p-5 rounded-xl border border-navy-700 shadow-lg sticky top-6 max-h-[calc(100vh-100px)] flex flex-col">
              <DiscoveryContent />
           </div>
        </div>

      </div>

      {showCreateModal && onAddPost && (
        <CreatePostModal 
            currentUser={currentUser} 
            onClose={() => setShowCreateModal(false)} 
            onSubmit={handleCreatePost} 
        />
      )}
    </div>
  );
};
