
import React, { useState, useRef, useEffect } from 'react';
import { User, LocationData } from '../types';
import { Camera, Mic, Disc, Play, Square, RefreshCw, Send, Settings2, Activity, AudioWaveform, Lock, Globe, Pause, MapPin, FileLock, Unlock, Zap, Volume2, X } from 'lucide-react';
import { LocationPicker } from './LocationPicker';

interface Props {
  currentUser: User;
  onPost: (content: string, videoBlob: Blob, visibility: 'PUBLIC' | 'FOLLOWERS', location?: LocationData) => void;
}

type ToolTab = 'RECORDER' | 'METRONOME' | 'TUNER';

export const StudyStudio: React.FC<Props> = ({ currentUser, onPost }) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('RECORDER');

  // --- RECORDER STATE ---
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [postVisibility, setPostVisibility] = useState<'PUBLIC' | 'FOLLOWERS'>('PUBLIC');
  
  // Overlays State (Camera Mode)
  const [showMetroOverlay, setShowMetroOverlay] = useState(false);
  const [showTunerOverlay, setShowTunerOverlay] = useState(false);
  
  // Location
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  // Permission Simulation
  const [hasFileAccess, setHasFileAccess] = useState(false);

  // --- TOOLS STATE ---
  const [bpm, setBpm] = useState(100);
  const [timeSignature, setTimeSignature] = useState(4); // Beats per bar
  const [isPlayingMetro, setIsPlayingMetro] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0); // For visual feedback
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIDRef = useRef<number | null>(null);
  
  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null); // Main Tuner Tab
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // Overlay Tuner
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // --- Initialization & Audio Context ---
  useEffect(() => {
    // Only init audio context once
    if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
    }

    if (activeTab === 'RECORDER' || activeTab === 'TUNER') {
        startCamera();
    } else {
        stopCamera();
        setIsPlayingMetro(false); // Stop metro if leaving tabs where it's used
    }

    return () => {
      stopCamera();
      if (timerIDRef.current) window.clearInterval(timerIDRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeTab]);

  // Re-attach analyser if overlay is toggled while in recorder mode
  useEffect(() => {
     if (activeTab === 'RECORDER' && showTunerOverlay && stream) {
         setupAnalyser(stream);
         drawOverlayVisualizer();
     }
  }, [showTunerOverlay, activeTab, stream]);

  const setupAnalyser = (ms: MediaStream) => {
      if (!audioCtxRef.current) return;
      // Close old if exists to avoid duplication
      if (analyserRef.current) return; 

      const source = audioCtxRef.current.createMediaStreamSource(ms);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
  }

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(ms);
      if (videoRef.current) {
        videoRef.current.srcObject = ms;
      }
      
      // Initialize Visualizer logic
      if (activeTab === 'TUNER' || (activeTab === 'RECORDER')) {
         setupAnalyser(ms);
         if (activeTab === 'TUNER') drawVisualizer();
      }

    } catch (err) {
      console.error("Error accessing media devices", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    analyserRef.current = null;
  };

  // --- Visualizers ---
  
  // 1. Main Tuner Tab Visualizer
  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current || activeTab !== 'TUNER') return;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current || activeTab !== 'TUNER') return;
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = '#0f172a'; // Navy 900
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = '#b45309'; // Ocre
      canvasCtx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };
    draw();
  };

  // 2. Overlay Tuner Visualizer (Mini)
  const drawOverlayVisualizer = () => {
    if (!overlayCanvasRef.current || !analyserRef.current || !showTunerOverlay) return;
    const canvas = overlayCanvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current || !showTunerOverlay || activeTab !== 'RECORDER') return;
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteTimeDomainData(dataArray);

      // Transparent clear
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = '#22c55e'; // Green for tuner overlay
      canvasCtx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };
    draw();
  };


  // --- Metronome Logic ---
  const playClick = (beatIndex: number) => {
    if (!audioCtxRef.current) return;
    
    // Auto-resume to fix browser policies
    if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
    }

    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    // Accentuate the first beat
    if (beatIndex === 0) {
        osc.frequency.value = 1500;
    } else {
        osc.frequency.value = 1000;
    }
    
    // Very short beep
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtxRef.current.currentTime + 0.05);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.05);
    
    setCurrentBeat(beatIndex + 1); // For UI
  };

  useEffect(() => {
    let beatCounter = 0;
    if (isPlayingMetro) {
      const interval = (60 / bpm) * 1000;
      timerIDRef.current = window.setInterval(() => {
         playClick(beatCounter % timeSignature);
         beatCounter++;
      }, interval);
    } else {
      if (timerIDRef.current) window.clearInterval(timerIDRef.current);
      setCurrentBeat(0);
    }
    return () => {
      if (timerIDRef.current) window.clearInterval(timerIDRef.current);
    };
  }, [isPlayingMetro, bpm, timeSignature]);


  // --- Recording Logic ---
  const startRecording = () => {
    if (!stream) return;
    setRecordedChunks([]);
    
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setVideoBlob(blob);
        setRecording(false);
      };
    }
  };

  const handlePost = () => {
    if (videoBlob) {
      if (!hasFileAccess) {
          alert("Para processar o vídeo, precisamos de acesso ao armazenamento.");
          return; 
      }

      const text = prompt("Escreva uma legenda para sua sessão de estudo:");
      if (text) {
        onPost(text, videoBlob, postVisibility, location || undefined);
        setPreviewUrl(null);
        setVideoBlob(null);
        setRecordedChunks([]);
        setLocation(null);
      }
    }
  };

  const handleDiscard = () => {
    setPreviewUrl(null);
    setVideoBlob(null);
    setRecordedChunks([]);
    setLocation(null);
  };

  // Permission Request
  const requestAccess = () => {
      const granted = window.confirm("O BandSocial Manager deseja acessar fotos e mídia do seu dispositivo para salvar gravações.\n\nPermitir?");
      if(granted) setHasFileAccess(true);
  };

  return (
    <div className="flex flex-col h-full gap-4 max-w-4xl mx-auto pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
           <h2 className="text-3xl font-serif text-bege-50">Ferramentas da Banda</h2>
           <p className="text-bege-200 text-sm">Grave sua prática, afine seu instrumento e use o metrônomo.</p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex p-1 bg-navy-800 rounded-lg border border-navy-700">
         <button 
           onClick={() => setActiveTab('RECORDER')}
           className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'RECORDER' ? 'bg-navy-900 text-ocre-500 shadow-md border border-navy-600' : 'text-bege-200/50 hover:text-bege-100'}`}
         >
           <Camera className="w-4 h-4" /> Estúdio
         </button>
         <button 
           onClick={() => setActiveTab('METRONOME')}
           className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'METRONOME' ? 'bg-navy-900 text-ocre-500 shadow-md border border-navy-600' : 'text-bege-200/50 hover:text-bege-100'}`}
         >
           <Activity className="w-4 h-4" /> Metrônomo
         </button>
         <button 
           onClick={() => setActiveTab('TUNER')}
           className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${activeTab === 'TUNER' ? 'bg-navy-900 text-ocre-500 shadow-md border border-navy-600' : 'text-bege-200/50 hover:text-bege-100'}`}
         >
           <AudioWaveform className="w-4 h-4" /> Afinador
         </button>
      </div>

      <div className="flex-1 bg-navy-900/50 rounded-2xl border border-navy-700 p-1 relative overflow-hidden min-h-[400px]">
        
        {/* === TAB 1: RECORDER & INTEGRATED TOOLS === */}
        {activeTab === 'RECORDER' && (
            <div className="h-full flex flex-col relative bg-black rounded-xl overflow-hidden">
                {previewUrl ? (
                <video src={previewUrl} controls className="w-full h-full object-contain bg-navy-900" />
                ) : (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                )}

                {/* --- INTEGRATED TOOLS CONTROLS (OVERLAY) --- */}
                {!previewUrl && (
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                     <button 
                       onClick={() => setShowMetroOverlay(!showMetroOverlay)}
                       className={`p-3 rounded-full shadow-lg backdrop-blur-md transition-all ${showMetroOverlay ? 'bg-ocre-600 text-white' : 'bg-navy-900/60 text-bege-200 hover:text-white'}`}
                       title="Metrônomo"
                     >
                       <Activity className="w-5 h-5" />
                     </button>
                     <button 
                       onClick={() => setShowTunerOverlay(!showTunerOverlay)}
                       className={`p-3 rounded-full shadow-lg backdrop-blur-md transition-all ${showTunerOverlay ? 'bg-green-600 text-white' : 'bg-navy-900/60 text-bege-200 hover:text-white'}`}
                       title="Afinador"
                     >
                       <AudioWaveform className="w-5 h-5" />
                     </button>
                  </div>
                )}

                {/* --- METRONOME OVERLAY WIDGET --- */}
                {showMetroOverlay && !previewUrl && (
                   <div className="absolute top-20 right-4 w-40 bg-navy-900/80 backdrop-blur-lg rounded-xl border border-navy-600 p-3 shadow-2xl z-20 animate-fade-in">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-ocre-500 uppercase tracking-wider">Metrônomo</span>
                          <button onClick={() => setShowMetroOverlay(false)}><X className="w-3 h-3 text-bege-200/50"/></button>
                       </div>
                       
                       <div className="text-center mb-2 relative">
                          <span className="text-3xl font-serif font-bold text-bege-50">{bpm}</span>
                          <span className="text-[10px] text-bege-200 block">BPM</span>
                          
                          {/* Visual Beat Indicator */}
                          <div className={`absolute top-1 right-2 w-3 h-3 rounded-full transition-colors duration-75 ${isPlayingMetro && currentBeat === 1 ? 'bg-red-500 shadow-[0_0_10px_red]' : isPlayingMetro && currentBeat > 0 ? 'bg-green-500' : 'bg-navy-700'}`}></div>
                       </div>

                       <input 
                          type="range" min="40" max="200" value={bpm} 
                          onChange={(e) => setBpm(parseInt(e.target.value))}
                          className="w-full h-1 bg-navy-700 rounded-lg appearance-none cursor-pointer accent-ocre-500 mb-3"
                       />

                       <button 
                          onClick={() => setIsPlayingMetro(!isPlayingMetro)}
                          className={`w-full py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors ${isPlayingMetro ? 'bg-red-900/80 text-red-200 border border-red-500/50' : 'bg-ocre-600 text-white'}`}
                       >
                          {isPlayingMetro ? <Square className="w-3 h-3 fill-current"/> : <Play className="w-3 h-3 fill-current"/>}
                          {isPlayingMetro ? 'PARAR' : 'TOCAR'}
                       </button>
                   </div>
                )}

                {/* --- TUNER OVERLAY WIDGET --- */}
                {showTunerOverlay && !previewUrl && (
                   <div className="absolute top-20 left-4 w-40 bg-navy-900/80 backdrop-blur-lg rounded-xl border border-navy-600 p-3 shadow-2xl z-20 animate-fade-in">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Afinador</span>
                          <button onClick={() => setShowTunerOverlay(false)}><X className="w-3 h-3 text-bege-200/50"/></button>
                       </div>
                       
                       <div className="h-16 bg-black/50 rounded border border-navy-700 overflow-hidden relative">
                           <canvas ref={overlayCanvasRef} width="150" height="64" className="w-full h-full" />
                       </div>
                       <p className="text-[9px] text-center text-bege-200/50 mt-1">Visualização de Onda</p>
                   </div>
                )}


                {/* Recording UI (Bottom) */}
                {!previewUrl && (
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 z-10">
                        <div className="bg-navy-900/60 backdrop-blur-sm px-6 py-4 rounded-full border border-white/10 flex items-center gap-4 shadow-2xl">
                            {recording ? (
                            <>
                                <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-white font-mono text-sm">GRAVANDO</span>
                                <button onClick={stopRecording} className="w-12 h-12 bg-white rounded-md flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <Square className="w-5 h-5 text-black fill-current" />
                                </button>
                            </>
                            ) : (
                            <button onClick={startRecording} className="w-14 h-14 bg-red-600 rounded-full border-4 border-white/20 flex items-center justify-center hover:bg-red-500 hover:scale-105 transition-all shadow-lg group">
                                <div className="w-6 h-6 bg-white rounded-full group-hover:scale-90 transition-transform"></div>
                            </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Post Controls (After Recording) */}
                {previewUrl && (
                    <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4 z-20 px-4">
                        {!hasFileAccess && (
                            <div className="w-full max-w-sm bg-red-900/90 backdrop-blur rounded-lg p-3 border border-red-500/50 flex items-center justify-between shadow-xl animate-pulse">
                                <div className="flex items-center gap-2 text-white text-xs font-bold">
                                    <FileLock className="w-4 h-4"/>
                                    Permissão de Arquivo Necessária
                                </div>
                                <button onClick={requestAccess} className="bg-white text-red-900 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-gray-100">
                                    <Unlock className="w-3 h-3" /> Conceder
                                </button>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <div className="bg-navy-900/90 backdrop-blur rounded-lg p-1 flex border border-navy-600">
                                <button onClick={() => setPostVisibility('PUBLIC')} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors ${postVisibility === 'PUBLIC' ? 'bg-ocre-600 text-white' : 'text-bege-200'}`}>
                                    <Globe className="w-3 h-3" /> Público
                                </button>
                                <button onClick={() => setPostVisibility('FOLLOWERS')} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors ${postVisibility === 'FOLLOWERS' ? 'bg-ocre-600 text-white' : 'text-bege-200'}`}>
                                    <Lock className="w-3 h-3" /> Apenas Seguidores
                                </button>
                            </div>

                            <button onClick={() => setShowLocationPicker(true)} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors border ${location ? 'bg-ocre-600 border-ocre-500 text-white' : 'bg-navy-900/90 border-navy-600 text-bege-200'}`}>
                                <MapPin className="w-3 h-3" /> {location ? 'Local Definido' : 'Local'}
                            </button>
                        </div>

                        <div className="flex gap-4 w-full justify-center">
                            <button onClick={handleDiscard} className="bg-navy-800/90 text-red-400 px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-navy-700 border border-navy-600">
                            <RefreshCw className="w-4 h-4" /> Descartar
                            </button>
                            <button onClick={handlePost} disabled={!hasFileAccess} className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-xl border border-white/10 ${!hasFileAccess ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-ocre-600 text-white hover:bg-ocre-500'}`}>
                            <Send className="w-4 h-4" /> Postar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* === TAB 2: METRONOME PRO (Standalone) === */}
        {activeTab === 'METRONOME' && (
            <div className="h-full flex flex-col items-center justify-center bg-navy-800 rounded-xl p-8 relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-navy-700/50 to-transparent pointer-events-none"></div>
                
                <div className="mb-12 text-center z-10">
                     <div className="text-[120px] leading-none font-bold font-serif text-bege-50 tabular-nums tracking-tighter drop-shadow-2xl">
                         {bpm}
                     </div>
                     <span className="text-ocre-500 font-bold tracking-widest uppercase">Batimentos por Minuto</span>
                     {isPlayingMetro && (
                         <div className="mt-4 flex justify-center gap-2">
                             {[1,2,3,4].map(i => (
                                 <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i === currentBeat ? 'bg-ocre-500 shadow-[0_0_15px_#b45309]' : 'bg-navy-950'}`}></div>
                             ))}
                         </div>
                     )}
                </div>

                <div className="w-full max-w-md space-y-8 z-10">
                    <input 
                        type="range" min="30" max="250" value={bpm} 
                        onChange={(e) => setBpm(parseInt(e.target.value))}
                        className="w-full h-4 bg-navy-900 rounded-full appearance-none cursor-pointer accent-ocre-500 border border-navy-600 hover:border-ocre-500/50"
                    />

                    <div className="flex justify-center gap-4">
                        <div className="flex items-center gap-2 bg-navy-900 px-4 py-2 rounded-lg border border-navy-700">
                            <button onClick={() => setBpm(b => Math.max(30, b - 1))} className="text-2xl text-bege-200 hover:text-white font-bold w-8">-</button>
                            <span className="text-sm font-bold text-bege-200 uppercase">Ajuste Fino</span>
                            <button onClick={() => setBpm(b => Math.min(250, b + 1))} className="text-2xl text-bege-200 hover:text-white font-bold w-8">+</button>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-navy-900 px-4 py-2 rounded-lg border border-navy-700">
                           <span className="text-xs text-bege-200/60 uppercase font-bold mr-2">Compasso</span>
                           <select 
                             value={timeSignature} 
                             onChange={(e) => setTimeSignature(parseInt(e.target.value))}
                             className="bg-navy-800 text-bege-50 font-bold border-none outline-none"
                           >
                             <option value="2">2/4</option>
                             <option value="3">3/4</option>
                             <option value="4">4/4</option>
                             <option value="6">6/8</option>
                           </select>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsPlayingMetro(!isPlayingMetro)}
                        className={`w-full py-6 rounded-2xl font-bold text-xl shadow-xl transition-all flex items-center justify-center gap-3 border-t border-white/10 ${
                            isPlayingMetro 
                            ? 'bg-red-900 text-red-200 border-red-500/50' 
                            : 'bg-ocre-600 text-white hover:bg-ocre-500'
                        }`}
                    >
                        {isPlayingMetro ? <><Square className="fill-current"/> PARAR</> : <><Play className="fill-current"/> INICIAR</>}
                    </button>
                </div>
            </div>
        )}

        {/* === TAB 3: TUNER (Standalone) === */}
        {activeTab === 'TUNER' && (
             <div className="h-full flex flex-col items-center justify-center bg-navy-800 rounded-xl p-4">
                 <h3 className="text-bege-200 uppercase tracking-widest font-bold mb-8">Afinador Cromático Visual</h3>
                 
                 <div className="w-full max-w-lg aspect-[2/1] bg-black rounded-xl border-4 border-navy-600 relative overflow-hidden shadow-inner">
                     <canvas ref={canvasRef} width="600" height="300" className="w-full h-full" />
                     
                     {/* Overlay Grid */}
                     <div className="absolute inset-0 grid grid-cols-4 pointer-events-none opacity-20">
                        <div className="border-r border-white"></div>
                        <div className="border-r border-white"></div>
                        <div className="border-r border-white"></div>
                     </div>
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-0.5 h-full bg-red-500/50"></div>
                     </div>
                 </div>

                 <p className="mt-6 text-center text-bege-200/60 max-w-sm">
                    Toque uma nota sustentada. A visualização mostra a estabilidade da onda sonora.
                    <br/><span className="text-xs italic">(Simulação Visual: Para afinação precisa em Hz, use um hardware dedicado em apresentações)</span>
                 </p>
             </div>
        )}

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

      <p className="text-center text-xs text-bege-200/40">
        BandSocial Manager v2.1 • Latência Zero
      </p>
    </div>
  );
};
