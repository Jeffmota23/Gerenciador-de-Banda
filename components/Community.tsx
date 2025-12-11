
import React, { useMemo, useState } from 'react';
import { PostItem, User } from '../types';
import { Heart, MessageCircle, Share2, Video, UserPlus, Check, Sparkles, Music, Lock, MapPin, Plus, Mic } from 'lucide-react';
import { CreatePostModal } from './CreatePostModal';

interface Props {
  posts: PostItem[];
  currentUser: User;
  allUsers: User[];
  onToggleFollow: (id: string) => void;
  onAddPost?: (post: any) => void; // Added prop for creating posts
}

export const Community: React.FC<Props> = ({ posts, currentUser, allUsers, onToggleFollow, onAddPost }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // --- RECOMMENDATION ENGINE ---
  const recommendations = useMemo(() => {
    return allUsers
      .filter(u => u.id !== currentUser.id && !currentUser.following.includes(u.id))
      .map(candidate => {
        let score = 0;
        let reasons: string[] = [];

        // Criteria 1: Sectional Synergy (Same Instrument)
        if (candidate.instrument === currentUser.instrument) {
          score += 3;
          reasons.push("Mesmo Naipe");
        } 
        // Logic for High Brass grouping (simplified)
        else if (['Cornet', 'Trompete', 'Flugelhorn', 'Soprano Cornet'].includes(currentUser.instrument) && 
                 ['Cornet', 'Trompete', 'Flugelhorn', 'Soprano Cornet'].includes(candidate.instrument)) {
           score += 1;
           reasons.push("Família dos Metais Agudos");
        }

        // Criteria 2: XP/Level Proximity (Peer vs Mentor)
        const levelDiff = candidate.level - currentUser.level;
        if (Math.abs(levelDiff) <= 5) {
          score += 2;
          reasons.push("Nível Compatível");
        } else if (levelDiff > 10) {
          score += 1;
          reasons.push("Mentor Sênior");
        }

        return { user: candidate, score, reasons };
      })
      .filter(rec => rec.score > 0) // Only show relevant people
      .sort((a, b) => b.score - a.score) // Highest score first
      .slice(0, 4); // Take top 4
  }, [currentUser, allUsers]);

  // --- VISIBILITY FILTER ---
  // Show if post is Public OR (Private AND (I follow author OR I am author))
  const visiblePosts = posts.filter(post => {
    if (post.authorId === currentUser.name) return true; // I can see my own posts
    if (post.visibility === 'PUBLIC') return true;
    
    // Check if I follow the author (using ID matching assuming authorId in Post is name, which is a simplification from previous steps. 
    // Ideally authorId should be ID. We will check against mock data matching logic)
    const authorUser = allUsers.find(u => u.name === post.authorId);
    if (!authorUser) return false;
    return currentUser.following.includes(authorUser.id);
  });

  return (
    <div className="max-w-6xl mx-auto mb-20 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT COLUMN: FEED --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b border-navy-700 pb-4 mb-6 flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-serif text-bege-50">Feed da Comunidade</h2>
                <p className="text-bege-200">Compartilhe seu progresso e apoie seus colegas.</p>
            </div>
            
            {onAddPost && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-ocre-600 hover:bg-ocre-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <Plus className="w-5 h-5" /> Criar
                </button>
            )}
          </div>

          {visiblePosts.length === 0 ? (
            <div className="text-center py-20 bg-navy-800/30 rounded-xl border border-dashed border-navy-700">
               <Video className="w-12 h-12 text-navy-600 mx-auto mb-4" />
               <p className="text-bege-200/60">Nenhuma postagem visível. Seja o primeiro a postar!</p>
               <button onClick={() => setShowCreateModal(true)} className="mt-4 text-ocre-500 font-bold hover:underline">Criar Postagem</button>
            </div>
          ) : (
            <div className="space-y-8">
              {visiblePosts.map(post => (
                <div key={post.id} className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden shadow-lg">
                  {/* Header */}
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
                       {post.location && (
                           <p className="text-[10px] text-ocre-500 flex items-center gap-1 mt-0.5 font-bold uppercase">
                               <MapPin className="w-3 h-3"/> {post.location.address}
                           </p>
                       )}
                     </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                     <p className="text-bege-100 mb-4 whitespace-pre-wrap">{post.content}</p>
                     
                     {/* Media Grid */}
                     {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div className={`grid gap-2 ${post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                           {post.mediaUrls.map((url, i) => (
                               <img key={i} src={url} className="rounded-lg w-full h-48 object-cover border border-navy-600" />
                           ))}
                        </div>
                     )}

                     {post.videoUrl && (
                       <div className="rounded-lg overflow-hidden bg-black border border-navy-600 aspect-video relative group mt-2">
                          <video src={post.videoUrl} controls className="w-full h-full" />
                       </div>
                     )}

                     {post.audioUrl && (
                        <div className="mt-2 bg-navy-900 p-3 rounded-lg border border-navy-600 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-ocre-600 flex items-center justify-center">
                                <Mic className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-bege-200 mb-1 font-bold uppercase">Nota de Voz</p>
                                <audio src={post.audioUrl} controls className="w-full h-8" />
                            </div>
                        </div>
                     )}
                  </div>

                  {/* Actions */}
                  <div className="bg-navy-900/50 p-3 flex gap-6 text-sm text-bege-200 font-medium">
                     <button className="flex items-center gap-2 hover:text-ocre-500 transition-colors">
                       <Heart className="w-4 h-4" /> {post.likes} Aplausos
                     </button>
                     <button className="flex items-center gap-2 hover:text-ocre-500 transition-colors">
                       <MessageCircle className="w-4 h-4" /> {post.comments} Comentários
                     </button>
                     <button className="flex items-center gap-2 hover:text-ocre-500 transition-colors ml-auto">
                       <Share2 className="w-4 h-4" /> Compartilhar
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: DISCOVERY SIDEBAR --- */}
        <div className="space-y-6 hidden lg:block">
           <div className="bg-navy-800 p-5 rounded-xl border border-navy-700 shadow-lg sticky top-6">
              <h3 className="font-serif text-lg text-bege-50 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-ocre-500" /> Sugestões para Você
              </h3>

              {recommendations.length === 0 ? (
                <p className="text-sm text-bege-200/50 text-center py-4">Nenhuma sugestão no momento.</p>
              ) : (
                <div className="space-y-4">
                  {recommendations.map(({ user, reasons }) => (
                    <div key={user.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center font-bold text-bege-200 border border-navy-600">
                           {user.name.charAt(0)}
                         </div>
                         <div>
                           <p className="text-sm font-bold text-bege-50">{user.name.split(' ')[0]}</p>
                           <p className="text-xs text-bege-200/60 flex items-center gap-1">
                              <Music className="w-3 h-3" /> {user.instrument}
                           </p>
                           {reasons[0] && (
                             <span className="text-[10px] text-ocre-400 font-bold uppercase tracking-wide">
                               {reasons[0]}
                             </span>
                           )}
                         </div>
                      </div>
                      
                      <button 
                        onClick={() => onToggleFollow(user.id)}
                        className="p-2 rounded-full bg-navy-900 hover:bg-ocre-600 text-ocre-500 hover:text-white transition-all border border-navy-600"
                        title="Seguir Usuário"
                      >
                         <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-navy-700">
                 <p className="text-xs text-bege-200/40 text-center">
                   Sugestões baseadas no seu naipe, nível de XP e atividade recente.
                 </p>
              </div>
           </div>
        </div>

      </div>

      {showCreateModal && onAddPost && (
        <CreatePostModal 
            currentUser={currentUser} 
            onClose={() => setShowCreateModal(false)} 
            onSubmit={onAddPost} 
        />
      )}
    </div>
  );
};
