
import React, { useState, useEffect } from 'react';
import { EventItem, EventType, User, UserRole, AttendanceStatus, AttendanceRecord, LocationData, RepertoireCategory } from '../types';
import { Calendar, Clock, MapPin, Plus, Music, Star, BookOpen, Bus, Hammer, AlertCircle, Check, X, Printer, Link as LinkIcon, Users, AlertTriangle, UserCheck, User as UserIcon, Wand2, GraduationCap, ArrowRight, Zap, PartyPopper, Heart, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useApp } from '../App'; 
import { LocationPicker } from './LocationPicker';
import { XP_MATRIX } from '../constants';
import { useLocation } from 'react-router-dom';

interface Props {
  events: EventItem[];
  currentUser: User;
  allUsers: User[];
  onAddEvent: (event: any) => void;
  onEventAction: (eventId: string, userId: string, action: 'CONFIRM' | 'CANCEL' | 'DECLINE', reason?: string) => void;
  onMarkAttendance: (eventId: string, userId: string, status: AttendanceStatus.PRESENT | AttendanceStatus.ABSENT) => void;
  onDelete?: (id: string, reason: string) => void;
  onAddPost: (post: any) => void;
}

export const Agenda: React.FC<Props> = ({ events, currentUser, allUsers, onAddEvent, onEventAction, onMarkAttendance, onDelete, onAddPost }) => {
  const { repertoire } = useApp(); 
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [printEvent, setPrintEvent] = useState<EventItem | null>(null);

  // Cancellation Modal State
  const [cancelModalEvent, setCancelModalEvent] = useState<EventItem | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [familyMember, setFamilyMember] = useState<string>('');
  const [otherReasonDetail, setOtherReasonDetail] = useState<string>('');

  // XP Notification State
  const [xpToast, setXpToast] = useState<{ show: boolean, amount: number, message: string } | null>(null);

  // Focus specific event if passed via navigation state
  const highlightId = location.state?.highlightId;

  // Form State
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<EventType>(EventType.REHEARSAL);
  
  // Study Specific State
  const [isIndividualStudy, setIsIndividualStudy] = useState(false);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(120);
  const [isDurationAutoFilled, setIsDurationAutoFilled] = useState(false);
  
  const [deadlineDate, setDeadlineDate] = useState('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationString, setLocationString] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  // Support Multiple IDs
  const [linkedMaterialIds, setLinkedMaterialIds] = useState<string[]>([]);

  const studyMaterials = repertoire.filter(r => r.category === RepertoireCategory.STUDY);

  const canCreate = [
    UserRole.GENERAL_MANAGER,
    UserRole.AGENDA_MANAGER_1,
    UserRole.AGENDA_MANAGER_2,
    UserRole.MEMBER // Members can create Individual Study commitments
  ].includes(currentUser.role);
  
  // Only managers can do strict attendance logic
  const canManageAttendance = [
      UserRole.GENERAL_MANAGER, 
      UserRole.PEOPLE_MANAGER_1, 
      UserRole.PEOPLE_MANAGER_2,
      UserRole.AGENDA_MANAGER_1,
      UserRole.AGENDA_MANAGER_2
  ].includes(currentUser.role);

  useEffect(() => {
    if (highlightId) {
       const element = document.getElementById(`event-${highlightId}`);
       if (element) {
           setTimeout(() => {
               element.scrollIntoView({ behavior: 'smooth', block: 'center' });
           }, 100);
       }
    }
  }, [highlightId]);

  // Toast Timer
  useEffect(() => {
      if (xpToast?.show) {
          const timer = setTimeout(() => setXpToast(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [xpToast]);

  const triggerXpToast = (amount: number, message: string) => {
      setXpToast({ show: true, amount, message });
  };

  // --- CONFIRMATION HANDLER ---
  const handleConfirmEvent = (event: EventItem) => {
    onEventAction(event.id, currentUser.id, 'CONFIRM');
    
    // Auto Post to Community (Followers Only)
    // Ensures event name is explicit in the title as per requirement
    onAddPost({
        title: `Presença confirmada em: ${event.title}`,
        content: `Eu vou! Acabei de confirmar presença. Vamos nessa? 🎺🎵`,
        postType: 'TEXT',
        category: 'COMMUNITY', // Force Community category
        visibility: 'FOLLOWERS',
        mediaUrls: [],
    });

    // Notify User
    triggerXpToast(XP_MATRIX[event.eventType]?.confirm || 0, "Presença Confirmada! Post motivational criado.");
  };

  const handleDeclineEvent = (event: EventItem) => {
    onEventAction(event.id, currentUser.id, 'DECLINE');
    triggerXpToast(0, "Que pena! Esperamos você na próxima. 😢");
  };

  // --- CANCELLATION HANDLER ---
  const openCancelModal = (event: EventItem) => {
      setCancelModalEvent(event);
      setCancelReason('');
      setFamilyMember('');
      setOtherReasonDetail('');
  };

  const submitCancellation = () => {
      if (!cancelModalEvent) return;
      if (!cancelReason) return alert("Selecione um motivo.");
      
      let finalReason = cancelReason;
      if (cancelReason === 'Doença na Família' && familyMember) {
          finalReason = `Doença na Família (${familyMember})`;
      } else if (cancelReason === 'Outros' && otherReasonDetail) {
          finalReason = `Outros: ${otherReasonDetail}`;
      }

      onEventAction(cancelModalEvent.id, currentUser.id, 'CANCEL', finalReason);
      
      // Calculate XP Loss for Toast
      const isLate = Date.now() > cancelModalEvent.rsvpDeadline;
      const xpValues = XP_MATRIX[cancelModalEvent.eventType];
      const loss = isLate ? -((xpValues?.confirm || 0)*2) : -(xpValues?.confirm || 0);

      triggerXpToast(loss, "Inscrição Cancelada");
      setCancelModalEvent(null);
  };


  const handleSubmit = () => {
    if (!title || !date || !time || !deadlineDate) return alert("Por favor preencha todos os campos.");

    const givesXp = [
        EventType.REHEARSAL, 
        EventType.PERFORMANCE, 
        EventType.STUDY, 
        EventType.WORKSHOP, 
        EventType.TRAVEL,
        EventType.SOCIAL
    ].includes(selectedType);

    const eventDateTime = new Date(`${date}T${time}`).getTime();
    const rsvpDeadlineTime = new Date(`${deadlineDate}T23:59`).getTime();
    const finalLocation = locationData || locationString;

    // Auto-confirm author for individual study
    const initialAttendees = isIndividualStudy ? [{
        userId: currentUser.id,
        status: AttendanceStatus.CONFIRMED,
        timestamp: Date.now(),
        xpAwarded: givesXp ? XP_MATRIX[selectedType].confirm : 0
    }] : [];

    onAddEvent({
      title,
      eventType: selectedType,
      date: eventDateTime,
      timeStr: time,
      durationMinutes: duration,
      rsvpDeadline: rsvpDeadlineTime,
      location: finalLocation || 'Local a definir',
      givesXp,
      linkedMaterialIds: linkedMaterialIds.length > 0 ? linkedMaterialIds : undefined,
      attendees: initialAttendees
    });
    
    if (isIndividualStudy && givesXp) {
        triggerXpToast(XP_MATRIX[selectedType].confirm, "Estudo Criado e Confirmado!");
    }

    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setSelectedType(EventType.REHEARSAL);
    setDate('');
    setTime('');
    setLocationString('');
    setLocationData(null);
    setDeadlineDate('');
    setLinkedMaterialIds([]);
    setDuration(120);
    setIsIndividualStudy(false);
    setIsDurationAutoFilled(false);
  };

  // Effect to update title if mode changes while material is selected
  useEffect(() => {
    if (linkedMaterialIds.length > 0) {
        updateFieldsFromMaterials(linkedMaterialIds);
    }
  }, [isIndividualStudy]);

  const toggleMaterial = (materialId: string) => {
      let newIds = [];
      if (linkedMaterialIds.includes(materialId)) {
          newIds = linkedMaterialIds.filter(id => id !== materialId);
      } else {
          newIds = [...linkedMaterialIds, materialId];
      }
      setLinkedMaterialIds(newIds);
      updateFieldsFromMaterials(newIds);
  };

  const updateFieldsFromMaterials = (ids: string[]) => {
      if (ids.length === 0) return;

      const selectedMaterials = studyMaterials.filter(m => ids.includes(m.id));
      
      // Calculate Total Time
      const totalMinutes = selectedMaterials.reduce((sum, item) => sum + (item.estimatedTime || 0), 0);
      
      if (totalMinutes > 0) {
          setDuration(totalMinutes);
          setIsDurationAutoFilled(true);
          setTimeout(() => setIsDurationAutoFilled(false), 2000);
      }

      // Generate Composite Title
      const prefix = isIndividualStudy ? "Prática:" : "Naipe:";
      let materialNames = "";
      
      if (selectedMaterials.length === 1) {
          materialNames = selectedMaterials[0].title;
      } else if (selectedMaterials.length === 2) {
          materialNames = `${selectedMaterials[0].title} + ${selectedMaterials[1].title}`;
      } else {
          materialNames = `${selectedMaterials[0].title} + ${selectedMaterials.length - 1} outros`;
      }
      
      setTitle(`${prefix} ${materialNames}`);
  };

  const handlePrint = (event: EventItem) => {
    setPrintEvent(event);
    setTimeout(() => {
        window.print();
        setPrintEvent(null);
    }, 500);
  };

  const getEventIcon = (type: EventType, title: string) => {
    switch (type) {
      case EventType.REHEARSAL: return <Music className="w-5 h-5" />;
      case EventType.PERFORMANCE: return <Star className="w-5 h-5" />;
      case EventType.STUDY: 
         // Distinguish icons
         return title.includes("Individual") || title.includes("Prática") ? <UserIcon className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />;
      case EventType.TRAVEL: return <Bus className="w-5 h-5" />;
      case EventType.WORKSHOP: return <Hammer className="w-5 h-5" />;
      case EventType.SOCIAL: return <PartyPopper className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getEventLabel = (type: EventType, title: string) => {
    switch(type) {
        case EventType.REHEARSAL: return 'Ensaio';
        case EventType.PERFORMANCE: return 'Apresentação';
        case EventType.STUDY: 
           return title.includes("Individual") || title.includes("Prática") ? 'Prática Solo' : 'Estudo em Grupo';
        case EventType.TRAVEL: return 'Viagem';
        case EventType.WORKSHOP: return 'Workshop';
        case EventType.SOCIAL: return 'Resenha';
        default: return 'Evento';
    }
  }

  const renderLocation = (loc?: LocationData | string) => {
      if (!loc) return null;
      if (typeof loc === 'string') return loc;
      return loc.address;
  };

  const sortedEvents = [...events].sort((a, b) => a.date - b.date);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in relative">
      
      {/* XP Toast Notification */}
      {xpToast && (
          <div className="fixed top-20 right-4 md:right-8 z-[80] animate-bounce-in">
              <div className={`flex items-center gap-3 p-4 rounded-xl shadow-2xl border-2 ${
                  xpToast.amount > 0 ? 'bg-navy-900 border-green-500' : 
                  xpToast.amount < 0 ? 'bg-red-900 border-red-500' :
                  'bg-navy-800 border-gray-500'
              }`}>
                  <div className={`p-2 rounded-full ${
                      xpToast.amount > 0 ? 'bg-green-500 text-white' : 
                      xpToast.amount < 0 ? 'bg-red-500 text-white' :
                      'bg-gray-600 text-white'
                  }`}>
                      {xpToast.amount === 0 ? <Heart className="w-6 h-6 fill-current text-gray-300" /> : <Zap className="w-6 h-6 fill-current" />}
                  </div>
                  <div>
                      {xpToast.amount !== 0 && (
                         <h4 className="font-black text-lg text-bege-50">{xpToast.amount > 0 ? `+${xpToast.amount}` : xpToast.amount} XP</h4>
                      )}
                      <p className={`text-xs font-bold text-bege-200 uppercase ${xpToast.amount === 0 ? 'text-sm' : ''}`}>{xpToast.message}</p>
                  </div>
              </div>
          </div>
      )}

      {/* Printable Area Logic */}
      {printEvent && (
        <div id="printable-area" className="hidden">
             <h1 className="text-xl font-bold mb-1 uppercase text-center border-b pb-2">Lista de Presença Oficial - {printEvent.title}</h1>
            <div className="flex justify-between text-xs mb-4">
               <span><strong>Data:</strong> {new Date(printEvent.date).toLocaleDateString()}</span>
               <span><strong>Hora:</strong> {printEvent.timeStr}</span>
               <span><strong>Local:</strong> {renderLocation(printEvent.location)}</span>
               <span><strong>Tipo:</strong> {printEvent.eventType}</span>
            </div>
            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-black p-1 text-center w-8">#</th>
                        <th className="border border-black p-1 text-left">Músico / Integrante</th>
                        <th className="border border-black p-1 text-left w-24">Instrumento</th>
                        {([EventType.PERFORMANCE, EventType.TRAVEL].includes(printEvent.eventType)) && (
                          <>
                            <th className="border border-black p-1 text-left w-24">RG</th>
                            <th className="border border-black p-1 text-left w-24">CPF</th>
                          </>
                        )}
                        <th className="border border-black p-1 text-left">Assinatura (Legível)</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Filter out DECLINED users from printed list as well */}
                    {printEvent.attendees.filter(a => a.status !== AttendanceStatus.DECLINED).map((att, i) => {
                        const user = allUsers.find(u => u.id === att.userId);
                        return (
                            <tr key={att.userId}>
                                <td className="border border-black p-1 text-center">{i + 1}</td>
                                <td className="border border-black p-1">{user?.name}</td>
                                <td className="border border-black p-1">{user?.instrument}</td>
                                {([EventType.PERFORMANCE, EventType.TRAVEL].includes(printEvent.eventType)) && (
                                <>
                                    <td className="border border-black p-1"></td>
                                    <td className="border border-black p-1"></td>
                                </>
                                )}
                                <td className="border border-black p-1"></td>
                            </tr>
                        );
                    })}
                    {/* Fill remaining rows to reach 25 or at least some empty rows */}
                    {Array.from({ length: Math.max(0, 25 - printEvent.attendees.filter(a => a.status !== AttendanceStatus.DECLINED).length) }).map((_, i) => (
                        <tr key={`empty-${i}`}>
                            <td className="border border-black p-1 text-center">{i + 1 + printEvent.attendees.filter(a => a.status !== AttendanceStatus.DECLINED).length}</td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            {([EventType.PERFORMANCE, EventType.TRAVEL].includes(printEvent.eventType)) && (
                              <>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1"></td>
                              </>
                            )}
                            <td className="border border-black p-1"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      <div className="flex justify-between items-center border-b border-navy-700 pb-4 no-print">
        <div>
          <h2 className="text-3xl font-serif text-bege-50">Agenda da Banda</h2>
          <p className="text-bege-200">Ensaios, apresentações e sessões de estudo.</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-ocre-600 hover:bg-ocre-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
          >
            <Plus className="w-5 h-5" /> Criar Evento
          </button>
        )}
      </div>

      <div className="space-y-4 no-print">
        {sortedEvents.map(event => {
          const attendanceRecord = event.attendees.find(a => a.userId === currentUser.id);
          const status = attendanceRecord ? attendanceRecord.status : AttendanceStatus.PENDING;
          
          const isClosed = Date.now() > event.rsvpDeadline;
          const hasStarted = Date.now() > event.date;
          const eventDate = new Date(event.date);
          const locString = renderLocation(event.location);
          const xpValues = XP_MATRIX[event.eventType];
          const isHighlighted = highlightId === event.id;
          
          const confirmedCount = event.attendees.filter(a => a.status === AttendanceStatus.CONFIRMED || a.status === AttendanceStatus.PRESENT).length;

          return (
            <div 
              key={event.id} 
              id={`event-${event.id}`}
              className={`bg-navy-800 rounded-xl border p-6 shadow-lg transition-all ${
                  isHighlighted ? 'border-ocre-500 shadow-[0_0_20px_rgba(180,83,9,0.3)] scale-[1.01]' : 'border-navy-700 hover:border-bege-200/30'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                {/* Date Block */}
                <div className="flex-shrink-0 flex md:flex-col items-center gap-2 md:gap-0 border-b md:border-b-0 md:border-r border-navy-700 pb-4 md:pb-0 md:pr-6 min-w-[80px] text-center">
                  <span className="text-xs font-bold text-ocre-500 uppercase tracking-widest">{eventDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                  <span className="text-4xl font-serif text-bege-50 font-bold leading-none">{eventDate.getDate()}</span>
                  <span className="text-sm text-bege-200 mt-1">{event.timeStr}</span>
                </div>

                {/* Info Block */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2 text-xs font-bold uppercase text-navy-400">
                        {getEventIcon(event.eventType, event.title)}
                        <span>{getEventLabel(event.eventType, event.title)}</span>
                     </div>
                     <div className="flex gap-2">
                        {canManageAttendance && (
                            <button onClick={() => handlePrint(event)} className="p-1 hover:bg-navy-700 rounded text-bege-200" title="Imprimir Lista">
                                <Printer className="w-4 h-4"/>
                            </button>
                        )}
                        {onDelete && (currentUser.id === event.authorId || currentUser.role === UserRole.GENERAL_MANAGER) && (
                            <button 
                              onClick={() => {
                                  const reason = prompt("Motivo da exclusão:");
                                  if (reason) onDelete(event.id, reason);
                              }} 
                              className="text-red-400 hover:text-red-300"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                     </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-bege-50 mb-2">{event.title}</h3>
                  
                  <div className="flex flex-col gap-1 text-sm text-bege-200">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-ocre-500" />
                        <span>{event.durationMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-ocre-500" />
                        <span>{locString}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                      {event.givesXp ? (
                        <>
                            <div className="bg-navy-900/80 px-3 py-1 rounded text-xs text-green-400 font-bold border border-green-900/50 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Confirmação: +{xpValues?.confirm} XP
                            </div>
                            <div className="bg-navy-900/80 px-3 py-1 rounded text-xs text-yellow-400 font-bold border border-yellow-900/50 flex items-center gap-1">
                                <Star className="w-3 h-3" /> Conclusão: +{xpValues?.completion} XP
                            </div>
                        </>
                      ) : (
                          <div className="bg-navy-900/80 px-3 py-1 rounded text-xs text-gray-400 font-bold border border-gray-700 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Sem XP
                          </div>
                      )}
                  </div>
                </div>

                {/* Actions Block */}
                <div className="flex flex-col justify-center min-w-[200px]">
                   
                   {hasStarted ? (
                       <div className="text-center p-4 bg-navy-900/50 rounded-lg border border-navy-700">
                           <p className="text-bege-200 font-bold">Evento Iniciado</p>
                           <p className="text-xs text-bege-200/50 mt-1">
                               {confirmedCount} confirmados
                           </p>
                       </div>
                   ) : (
                       <>
                        <div className="text-right mb-2">
                            <span className="text-xs text-bege-200">
                                {confirmedCount} confirmados
                            </span>
                        </div>
                        
                        {/* Dynamic Button States */}
                        {status === AttendanceStatus.PENDING && (
                             <div className="flex gap-2">
                                 <button 
                                     onClick={() => handleConfirmEvent(event)}
                                     className="flex-1 py-3 rounded-lg font-bold bg-navy-800 hover:bg-green-700 hover:text-white border border-navy-600 hover:border-green-600 text-bege-200 transition-all shadow-lg flex items-center justify-center gap-2"
                                 >
                                     <ThumbsUp className="w-4 h-4" /> Aceitar
                                 </button>
                                 <button 
                                     onClick={() => handleDeclineEvent(event)}
                                     className="py-3 px-4 rounded-lg font-bold bg-navy-900 hover:bg-red-900/50 border border-navy-700 hover:border-red-800 text-gray-400 hover:text-red-300 transition-all flex items-center justify-center"
                                     title="Não irei"
                                 >
                                     <ThumbsDown className="w-4 h-4" />
                                 </button>
                             </div>
                        )}

                        {status === AttendanceStatus.CONFIRMED && (
                             <>
                                <button 
                                    onClick={() => openCancelModal(event)}
                                    className="w-full py-3 rounded-lg font-bold bg-green-800 hover:bg-red-900/80 text-green-100 hover:text-red-200 border border-green-700 hover:border-red-800 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    Cancelar Presença
                                </button>
                                <p className="text-[10px] text-center mt-2 text-green-400 font-bold flex items-center justify-center gap-1">
                                    <Heart className="w-3 h-3 fill-current" /> Você confirmou!
                                </p>
                             </>
                        )}
                        
                        {status === AttendanceStatus.LATE_CANCEL && (
                            <button disabled className="w-full py-3 rounded-lg font-bold bg-red-900/50 text-red-300 border border-red-900 cursor-not-allowed flex items-center justify-center gap-2">
                                <X className="w-4 h-4" /> Cancelado
                            </button>
                        )}

                        {status === AttendanceStatus.DECLINED && (
                            <div className="text-center bg-navy-900/50 p-3 rounded-lg border border-navy-700">
                                <p className="text-sm text-bege-200 mb-2 font-bold flex items-center justify-center gap-2">
                                   <ThumbsDown className="w-4 h-4 text-gray-400"/> Não poderei ir
                                </p>
                                <p className="text-xs text-gray-500 mb-3 italic">Mudou de ideia?</p>
                                <button 
                                    onClick={() => handleConfirmEvent(event)}
                                    className="w-full py-2 rounded-lg font-bold bg-navy-800 hover:bg-ocre-600 text-bege-200 hover:text-white border border-navy-600 transition-all shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
                                >
                                    <ThumbsUp className="w-3 h-3" /> Reconsiderar Presença
                                </button>
                            </div>
                        )}


                        {isClosed && status !== AttendanceStatus.LATE_CANCEL && status !== AttendanceStatus.DECLINED && (
                            <p className="text-[10px] text-center mt-2 text-red-400 font-bold flex items-center justify-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Prazo Encerrado
                            </p>
                        )}
                       </>
                   )}
                </div>
              </div>

              {/* Attendance Management (Hidden unless Manager) */}
              {canManageAttendance && (
                  <div className="mt-6 pt-4 border-t border-navy-700">
                      <details className="group">
                          <summary className="cursor-pointer text-xs font-bold text-bege-200 hover:text-white flex items-center gap-2 select-none">
                              <Users className="w-4 h-4" /> Gerenciar Lista de Presença ({confirmedCount})
                          </summary>
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-navy-900/50 p-4 rounded-lg">
                              {/* Filter out DECLINED users from the management view to satisfy user requirement */}
                              {event.attendees
                                .filter(a => a.status !== AttendanceStatus.DECLINED)
                                .map(record => {
                                  const user = allUsers.find(u => u.id === record.userId);
                                  if (!user) return null;
                                  return (
                                      <div key={record.userId} className="flex items-center justify-between bg-navy-800 p-2 rounded border border-navy-700">
                                          <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${record.status === AttendanceStatus.PRESENT ? 'bg-green-500' : record.status === AttendanceStatus.ABSENT ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                                                <span className="text-xs text-bege-100 truncate w-32">{user.name}</span>
                                              </div>
                                              {record.cancellationReason && (
                                                  <p className="text-[10px] text-red-300 mt-1 italic pl-4 border-l border-red-900">
                                                      "{record.cancellationReason}"
                                                  </p>
                                              )}
                                              {record.status === AttendanceStatus.LATE_CANCEL && (
                                                   <span className="text-[9px] bg-red-900/50 px-1 rounded text-red-300 border border-red-800 ml-4">Cancelado</span>
                                              )}
                                          </div>
                                          <div className="flex gap-1">
                                              <button 
                                                onClick={() => onMarkAttendance(event.id, user.id, AttendanceStatus.PRESENT)}
                                                className={`p-1.5 rounded ${record.status === AttendanceStatus.PRESENT ? 'bg-green-600 text-white' : 'bg-navy-700 text-gray-400 hover:bg-green-900'}`}
                                                title="Presente"
                                              >
                                                  <Check className="w-3 h-3" />
                                              </button>
                                              <button 
                                                onClick={() => onMarkAttendance(event.id, user.id, AttendanceStatus.ABSENT)}
                                                className={`p-1.5 rounded ${record.status === AttendanceStatus.ABSENT ? 'bg-red-600 text-white' : 'bg-navy-700 text-gray-400 hover:bg-red-900'}`}
                                                title="Falta"
                                              >
                                                  <X className="w-3 h-3" />
                                              </button>
                                          </div>
                                      </div>
                                  )
                              })}
                              {confirmedCount === 0 && <p className="text-xs text-gray-500 col-span-3 text-center">Nenhum inscrito ativo.</p>}
                          </div>
                      </details>
                  </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CANCELLATION MODAL */}
      {cancelModalEvent && (
        <div className="fixed inset-0 bg-navy-950/90 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-navy-900 w-full max-w-md rounded-2xl border border-red-900/50 shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-bege-50 mb-2">Cancelar Presença</h3>
                    <p className="text-sm text-bege-200 mb-6">
                        Entendemos que imprevistos acontecem. Por favor, selecione o motivo do cancelamento para justificar sua ausência.
                    </p>

                    <div className="space-y-3 mb-6">
                        {[
                            'Viagem inesperada de trabalho',
                            'Doença',
                            'Doença na Família',
                            'Falta de condução',
                            'Outros'
                        ].map(reason => (
                            <div key={reason}>
                                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${cancelReason === reason ? 'bg-red-900/20 border-red-500' : 'bg-navy-800 border-navy-700 hover:border-red-500/50'}`}>
                                    <input 
                                        type="radio" 
                                        name="cancelReason" 
                                        value={reason} 
                                        checked={cancelReason === reason} 
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="w-4 h-4 accent-red-500 mr-3"
                                    />
                                    <span className="text-sm text-bege-100">{reason}</span>
                                </label>

                                {/* Conditional Sub-questions */}
                                {cancelReason === 'Doença na Família' && reason === 'Doença na Família' && (
                                    <div className="ml-8 mt-2 p-2 bg-navy-950 rounded border border-navy-800 animate-fade-in">
                                        <p className="text-xs text-gray-400 mb-2">Quem está doente?</p>
                                        <select 
                                            value={familyMember}
                                            onChange={(e) => setFamilyMember(e.target.value)}
                                            className="w-full bg-navy-800 text-sm text-bege-100 p-2 rounded border border-navy-700 outline-none focus:border-red-500"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Pai">Pai</option>
                                            <option value="Mãe">Mãe</option>
                                            <option value="Filho(a)">Filho(a)</option>
                                            <option value="Cônjuge/Esposa">Cônjuge/Esposa</option>
                                        </select>
                                    </div>
                                )}

                                {cancelReason === 'Outros' && reason === 'Outros' && (
                                     <div className="ml-8 mt-2 animate-fade-in">
                                         <textarea 
                                            placeholder="Descreva o motivo (sujeito à aprovação do gestor)..."
                                            value={otherReasonDetail}
                                            onChange={(e) => setOtherReasonDetail(e.target.value)}
                                            className="w-full bg-navy-950 text-sm text-bege-100 p-2 rounded border border-navy-800 outline-none focus:border-red-500 min-h-[80px]"
                                         />
                                         <p className="text-[10px] text-ocre-500 mt-1">* Penalidade de XP será aplicada até aprovação.</p>
                                     </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setCancelModalEvent(null)}
                            className="flex-1 py-3 text-bege-200 hover:text-white font-bold"
                        >
                            Voltar
                        </button>
                        <button 
                            onClick={submitCancellation}
                            disabled={!cancelReason || (cancelReason === 'Doença na Família' && !familyMember) || (cancelReason === 'Outros' && !otherReasonDetail)}
                            className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold shadow-lg"
                        >
                            Confirmar Cancelamento
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-navy-900/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
           <div className="bg-navy-950 w-full max-w-lg rounded-2xl border border-ocre-600/30 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-serif text-bege-50">Criar Evento</h3>
                        <p className="text-sm text-bege-200">Defina ensaios, tocatas, estudos.</p>
                    </div>
                    <button onClick={() => setShowModal(false)}><X className="text-bege-200 hover:text-white"/></button>
                 </div>

                 <div className="space-y-6">
                    {/* CATEGORY SELECTOR */}
                    <div>
                        <label className="text-xs font-bold text-bege-200 mb-2 block uppercase">Categoria do Evento</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => setSelectedType(EventType.REHEARSAL)}
                              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedType === EventType.REHEARSAL ? 'border-ocre-500 bg-ocre-900/20 text-bege-50' : 'border-navy-700 bg-navy-900 text-gray-400 hover:border-navy-500'}`}
                            >
                                <Music className="w-6 h-6" />
                                <span className="text-xs font-bold">Ensaio</span>
                                <span className="text-[10px] bg-ocre-600 text-white px-1.5 rounded">+XP</span>
                            </button>
                            <button 
                              onClick={() => setSelectedType(EventType.PERFORMANCE)}
                              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedType === EventType.PERFORMANCE ? 'border-ocre-500 bg-ocre-900/20 text-bege-50' : 'border-navy-700 bg-navy-900 text-gray-400 hover:border-navy-500'}`}
                            >
                                <Star className="w-6 h-6" />
                                <span className="text-xs font-bold">Concerto</span>
                                <span className="text-[10px] bg-ocre-600 text-white px-1.5 rounded">+XP</span>
                            </button>
                            <button 
                              onClick={() => setSelectedType(EventType.STUDY)}
                              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedType === EventType.STUDY ? 'border-ocre-500 bg-ocre-900/20 text-bege-50' : 'border-navy-700 bg-navy-900 text-gray-400 hover:border-navy-500'}`}
                            >
                                <GraduationCap className="w-6 h-6" />
                                <span className="text-xs font-bold">Estudo</span>
                                <span className="text-[10px] bg-ocre-600 text-white px-1.5 rounded">+XP</span>
                            </button>
                            <button 
                              onClick={() => setSelectedType(EventType.WORKSHOP)}
                              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedType === EventType.WORKSHOP ? 'border-ocre-500 bg-ocre-900/20 text-bege-50' : 'border-navy-700 bg-navy-900 text-gray-400 hover:border-navy-500'}`}
                            >
                                <Hammer className="w-6 h-6" />
                                <span className="text-xs font-bold">Workshop</span>
                                <span className="text-[10px] bg-ocre-600 text-white px-1.5 rounded">+XP</span>
                            </button>
                            <button 
                              onClick={() => setSelectedType(EventType.TRAVEL)}
                              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedType === EventType.TRAVEL ? 'border-ocre-500 bg-ocre-900/20 text-bege-50' : 'border-navy-700 bg-navy-900 text-gray-400 hover:border-navy-500'}`}
                            >
                                <Bus className="w-6 h-6" />
                                <span className="text-xs font-bold">Viagem/Log</span>
                                <span className="text-[10px] bg-ocre-600 text-white px-1.5 rounded">+XP</span>
                            </button>
                            <button 
                              onClick={() => setSelectedType(EventType.SOCIAL)}
                              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedType === EventType.SOCIAL ? 'border-ocre-500 bg-ocre-900/20 text-bege-50' : 'border-navy-700 bg-navy-900 text-gray-400 hover:border-navy-500'}`}
                            >
                                <PartyPopper className="w-6 h-6" />
                                <span className="text-xs font-bold">Resenha</span>
                                <span className="text-[10px] bg-ocre-600 text-white px-1.5 rounded">+XP</span>
                            </button>
                        </div>
                    </div>

                    {/* STUDY MODE TOGGLE & MATERIAL LINK */}
                    {selectedType === EventType.STUDY && (
                       <div className="bg-navy-900 p-4 rounded-lg border border-navy-700 space-y-4 animate-fade-in">
                          <div>
                            <label className="text-xs font-bold text-bege-200 mb-2 block">Modo de Estudo</label>
                            <div className="flex bg-navy-800 p-1 rounded-lg">
                                <button 
                                  onClick={() => setIsIndividualStudy(false)}
                                  className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${!isIndividualStudy ? 'bg-navy-700 text-white shadow' : 'text-gray-500'}`}
                                >
                                    <Users className="w-4 h-4" /> Em Grupo (Naipe)
                                </button>
                                <button 
                                  onClick={() => setIsIndividualStudy(true)}
                                  className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${isIndividualStudy ? 'bg-ocre-600 text-white shadow' : 'text-gray-500'}`}
                                >
                                    <UserIcon className="w-4 h-4" /> Individual
                                </button>
                            </div>
                          </div>

                          <div>
                             <label className="text-xs font-bold text-bege-200 mb-2 flex items-center gap-2">
                                <LinkIcon className="w-3 h-3 text-ocre-500" /> Vincular Material de Estudo (Opcional)
                             </label>
                             
                             <div className="max-h-40 overflow-y-auto custom-scrollbar border border-navy-700 rounded-lg">
                                {studyMaterials.length === 0 ? (
                                    <p className="p-3 text-xs text-gray-500 italic">Nenhum material de estudo cadastrado no Repertório.</p>
                                ) : (
                                    studyMaterials.map(mat => (
                                        <div 
                                          key={mat.id}
                                          onClick={() => toggleMaterial(mat.id)}
                                          className={`p-3 border-b border-navy-800 flex items-center justify-between cursor-pointer hover:bg-navy-800/50 transition-colors ${linkedMaterialIds.includes(mat.id) ? 'bg-navy-800' : ''}`}
                                        >
                                            <div className="flex-1">
                                                <p className={`text-sm font-bold ${linkedMaterialIds.includes(mat.id) ? 'text-ocre-400' : 'text-bege-100'}`}>{mat.title}</p>
                                                <p className="text-xs text-gray-500">{mat.focus} • {mat.estimatedTime} min</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${linkedMaterialIds.includes(mat.id) ? 'bg-ocre-500 border-ocre-500' : 'border-gray-600'}`}>
                                                {linkedMaterialIds.includes(mat.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                    ))
                                )}
                             </div>
                             {linkedMaterialIds.length > 0 && (
                                 <p className="text-[10px] text-ocre-400 mt-2 flex items-center gap-1">
                                     <Wand2 className="w-3 h-3" /> Título e duração ajustados automaticamente.
                                 </p>
                             )}
                          </div>
                       </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-bege-200 mb-1 block">Nome do Evento</label>
                        <input 
                          className="w-full bg-navy-900 border border-navy-700 p-3 rounded-lg text-bege-100 focus:border-ocre-500 outline-none transition-colors"
                          placeholder="Ex: Concerto de Natal Beneficente"
                          value={title} onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-bege-200 mb-1 block">Data</label>
                            <input 
                              type="date"
                              className="w-full bg-navy-900 border border-navy-700 p-3 rounded-lg text-bege-100 focus:border-ocre-500 outline-none"
                              value={date} onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-bege-200 mb-1 block">Hora Início</label>
                            <input 
                              type="time"
                              className="w-full bg-navy-900 border border-navy-700 p-3 rounded-lg text-bege-100 focus:border-ocre-500 outline-none"
                              value={time} onChange={e => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-bege-200 mb-1 block flex items-center gap-2">
                                Duração (minutos)
                                {isDurationAutoFilled && <span className="text-[9px] text-ocre-500 font-bold bg-ocre-900/20 px-1 rounded animate-pulse">SUGERIDO IA</span>}
                            </label>
                            <input 
                              type="number"
                              className={`w-full bg-navy-900 border p-3 rounded-lg text-bege-100 focus:border-ocre-500 outline-none transition-all duration-500 ${isDurationAutoFilled ? 'border-ocre-500 shadow-[0_0_10px_rgba(180,83,9,0.3)] text-ocre-400 font-bold' : 'border-navy-700'}`}
                              value={duration} onChange={e => setDuration(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="relative">
                            <label className="text-xs font-bold text-bege-200 mb-1 block">Local</label>
                            <div className="flex gap-2">
                                <input 
                                className="flex-1 bg-navy-900 border border-navy-700 p-3 rounded-lg text-bege-100 focus:border-ocre-500 outline-none text-xs truncate"
                                placeholder="Digite ou use o mapa..."
                                value={locationData ? locationData.address : locationString} 
                                onChange={e => {
                                    setLocationString(e.target.value);
                                    setLocationData(null);
                                }}
                                />
                                <button 
                                onClick={() => setShowLocationPicker(true)}
                                className={`p-3 rounded-lg border transition-colors ${locationData ? 'bg-ocre-600 border-ocre-600 text-white' : 'bg-navy-800 border-navy-600 text-gray-400 hover:text-white'}`}
                                >
                                <MapPin className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-navy-900 p-4 rounded-lg border border-navy-700">
                        <label className="text-xs font-bold text-bege-200 mb-2 block flex items-center gap-2 text-ocre-500">
                           <AlertCircle className="w-4 h-4" /> Prazo de Confirmação (RSVP)
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">Após essa data, os membros não poderão alterar a presença sem penalidade.</p>
                        <input 
                              type="date"
                              className="w-full bg-navy-950 border border-navy-700 p-2 rounded text-bege-100 focus:border-ocre-500 outline-none"
                              value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)}
                        />
                    </div>

                 </div>

                 <div className="mt-8 flex gap-4">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-bege-200 hover:text-white font-bold">Cancelar</button>
                    <button onClick={handleSubmit} className="flex-1 bg-ocre-600 hover:bg-ocre-500 text-white py-3 rounded-xl font-bold shadow-lg transform active:scale-95 transition-all">
                        Criar Evento
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showLocationPicker && (
          <LocationPicker 
            onSelect={(loc) => {
                setLocationData(loc);
                setShowLocationPicker(false);
            }} 
            onCancel={() => setShowLocationPicker(false)}
          />
      )}
    </div>
  );
};
