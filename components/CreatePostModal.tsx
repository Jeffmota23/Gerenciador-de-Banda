
import React, { useState, useRef } from 'react';
import { User, LocationData } from '../types';
import { X, Image as ImageIcon, Video, Mic, MapPin, Hash, AtSign, Send, Camera, Trash2, StopCircle, Play, AlertCircle, Plus } from 'lucide-react';
import { LocationPicker } from './LocationPicker';

interface Props {
  currentUser: User;
  onClose: () => void;
  onSubmit: (postData: any) => void;
}

export const CreatePostModal: React.FC<Props> = ({ currentUser, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<{ type: 'IMAGE' | 'VIDEO', url: string, file: File }[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Refs for file inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 500;
  const MAX_IMAGES = 15;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'VIDEO') => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const currentCount = mediaFiles.length;
      
      if (currentCount + newFiles.length > MAX_IMAGES) {
          alert(`Você pode adicionar no máximo ${MAX_IMAGES} mídias por postagem.`);
          return;
      }

      const processedFiles = newFiles.map(file => ({
          type,
          url: URL.createObjectURL(file),
          file
      }));

      setMediaFiles(prev => [...prev, ...processedFiles]);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- AUDIO LOGIC ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Erro ao acessar microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const deleteAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
  };

  // --- SUBMIT ---
  const handleSubmit = () => {
    if (!content && mediaFiles.length === 0 && !audioBlob) return;

    // Simulate Title generation since we don't have a title box
    const generatedTitle = content.length > 0 
      ? content.substring(0, 40) + (content.length > 40 ? '...' : '') 
      : 'Nova Postagem';

    // Extract URLs
    const mediaUrls = mediaFiles.map(m => m.url);
    const videoUrl = mediaFiles.find(m => m.type === 'VIDEO')?.url; // Taking first video for simple schema

    onSubmit({
      title: generatedTitle,
      content,
      postType: 'TEXT', // Generic type, but richer
      mediaUrls,
      videoUrl,
      audioUrl,
      visibility: 'PUBLIC',
      location
    });
    onClose();
  };

  const insertTag = (char: string) => {
    if (content.length + char.length <= MAX_CHARS) {
        setContent(prev => prev + char);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-navy-900 w-full max-w-lg rounded-2xl border border-navy-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-navy-700 flex justify-between items-center bg-navy-950">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-navy-700 border border-navy-600 flex items-center justify-center text-xs font-bold text-bege-100">
               {currentUser.name.charAt(0)}
             </div>
             <span className="font-bold text-bege-50 text-sm">Criar Publicação</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-navy-800 rounded-full text-bege-200"><X className="w-5 h-5" /></button>
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
           <textarea 
             className="w-full bg-transparent text-lg text-bege-100 placeholder-bege-200/30 outline-none resize-none min-h-[120px]"
             placeholder="No que você está pensando? Compartilhe ideias, fotos ou áudios..."
             value={content}
             maxLength={MAX_CHARS}
             onChange={e => setContent(e.target.value)}
             autoFocus
           />
           
           {/* Character Counter */}
           <div className="flex justify-end mb-2">
               <span className={`text-[10px] font-bold ${content.length >= MAX_CHARS ? 'text-red-500' : 'text-bege-200/40'}`}>
                   {content.length}/{MAX_CHARS}
               </span>
           </div>

           {/* Location Chip */}
           {location && (
             <div className="inline-flex items-center gap-2 bg-ocre-900/30 text-ocre-400 px-3 py-1 rounded-full text-xs font-bold border border-ocre-500/30 mb-4">
                <MapPin className="w-3 h-3" /> {location.address.split(',')[0]}
                <button onClick={() => setLocation(null)}><X className="w-3 h-3 hover:text-white"/></button>
             </div>
           )}

           {/* Media Grid (Scrollable for up to 15 items) */}
           {mediaFiles.length > 0 && (
             <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                {mediaFiles.map((media, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-navy-600 group aspect-square bg-black">
                     {media.type === 'IMAGE' ? (
                       <img src={media.url} className="w-full h-full object-cover" />
                     ) : (
                       <video src={media.url} className="w-full h-full object-cover" />
                     )}
                     <button 
                       onClick={() => removeMedia(idx)}
                       className="absolute top-1 right-1 bg-black/60 text-white p-0.5 rounded-full hover:bg-red-600 transition-colors"
                     >
                       <X className="w-3 h-3" />
                     </button>
                  </div>
                ))}
                {mediaFiles.length < MAX_IMAGES && (
                     <button 
                        onClick={() => imageInputRef.current?.click()}
                        className="aspect-square rounded-lg border border-dashed border-navy-600 flex flex-col items-center justify-center text-navy-500 hover:text-bege-200 hover:border-bege-200/50 transition-colors bg-navy-900/50"
                     >
                        <Plus className="w-5 h-5 mb-1" />
                        <span className="text-[9px] font-bold uppercase">Add</span>
                     </button>
                )}
             </div>
           )}

           {/* Audio Player / Recorder UI */}
           {(isRecording || audioUrl) && (
             <div className="mb-4 bg-navy-800 rounded-xl p-3 border border-navy-600 flex items-center gap-3">
                 {isRecording ? (
                    <div className="flex-1 flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-red-400 font-bold animate-pulse">Gravando...</span>
                        <div className="flex-1 h-8 flex items-center gap-1 justify-center opacity-50">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="w-1 bg-red-500 rounded-full animate-bounce" style={{ height: Math.random() * 20 + 5, animationDelay: `${i * 0.1}s` }}></div>
                            ))}
                        </div>
                    </div>
                 ) : (
                    <div className="flex-1 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-ocre-600 flex items-center justify-center">
                            <Mic className="w-4 h-4 text-white" />
                        </div>
                        <audio src={audioUrl!} controls className="flex-1 h-8" />
                    </div>
                 )}
                 
                 {isRecording ? (
                    <button onClick={stopRecording} className="p-2 bg-navy-700 rounded-full text-white hover:bg-red-600 transition-colors">
                        <StopCircle className="w-5 h-5" />
                    </button>
                 ) : (
                    <button onClick={deleteAudio} className="p-2 bg-navy-700 rounded-full text-red-400 hover:bg-navy-600 transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                 )}
             </div>
           )}
        </div>

        {/* Toolbar Footer */}
        <div className="p-4 bg-navy-950 border-t border-navy-700">
           {/* Helpers */}
           <div className="flex gap-2 mb-4 overflow-x-auto">
              <button onClick={() => insertTag('@')} className="px-3 py-1 bg-navy-800 rounded-full text-xs font-bold text-bege-200 border border-navy-600 hover:border-ocre-500">@ Mencionar</button>
              <button onClick={() => insertTag('#')} className="px-3 py-1 bg-navy-800 rounded-full text-xs font-bold text-bege-200 border border-navy-600 hover:border-ocre-500"># Hashtag</button>
           </div>

           <div className="flex justify-between items-center">
              <div className="flex gap-1">
                 {/* Hidden Inputs */}
                 <input type="file" ref={imageInputRef} accept="image/*" multiple className="hidden" onChange={e => handleFileSelect(e, 'IMAGE')} />
                 <input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={e => handleFileSelect(e, 'VIDEO')} />
                 <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={e => handleFileSelect(e, 'IMAGE')} />

                 <button onClick={() => imageInputRef.current?.click()} className="p-2 text-bege-200 hover:text-ocre-500 hover:bg-navy-800 rounded-lg transition-colors" title="Foto">
                     <ImageIcon className="w-6 h-6" />
                 </button>
                 <button onClick={() => videoInputRef.current?.click()} className="p-2 text-bege-200 hover:text-ocre-500 hover:bg-navy-800 rounded-lg transition-colors" title="Vídeo">
                     <Video className="w-6 h-6" />
                 </button>
                 <button onClick={() => !audioUrl && !isRecording && startRecording()} disabled={!!audioUrl || isRecording} className={`p-2 rounded-lg transition-colors ${isRecording ? 'text-red-500 bg-red-900/20' : 'text-bege-200 hover:text-ocre-500 hover:bg-navy-800'}`} title="Áudio">
                     <Mic className="w-6 h-6" />
                 </button>
                 <button onClick={() => cameraInputRef.current?.click()} className="p-2 text-bege-200 hover:text-ocre-500 hover:bg-navy-800 rounded-lg transition-colors" title="Câmera">
                     <Camera className="w-6 h-6" />
                 </button>
                 <button onClick={() => setShowLocationPicker(true)} className={`p-2 rounded-lg transition-colors ${location ? 'text-ocre-500' : 'text-bege-200 hover:text-ocre-500 hover:bg-navy-800'}`} title="Localização">
                     <MapPin className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex items-center gap-3">
                 <span className="text-[10px] text-gray-500 hidden sm:block">
                     {mediaFiles.length} mídia(s)
                 </span>
                 <button 
                    onClick={handleSubmit} 
                    disabled={!content && mediaFiles.length === 0 && !audioBlob}
                    className="bg-ocre-600 hover:bg-ocre-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                 >
                    <Send className="w-4 h-4" /> Publicar
                 </button>
              </div>
           </div>
        </div>

      </div>

      {showLocationPicker && (
          <LocationPicker 
            onSelect={(loc) => {
                setLocation(loc);
                setShowLocationPicker(false);
            }} 
            onCancel={() => setShowLocationPicker(false)}
          />
      )}
    </div>
  );
};
