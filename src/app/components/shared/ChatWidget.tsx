import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  X,
  Send,
  Stethoscope,
  Heart,
  User,
  ChevronDown,
  ChevronLeft,
  Users,
} from "lucide-react";
import { DEFAULT_PATIENT_ID, getPatientProfile } from "../../data/patientProfiles";
import {
  CARE_CHAT_ROLE_LABEL,
  formatCareChatTime,
  getAvailablePeers,
  getCareChatTotalUnread,
  getCareChatUnreadCount,
  type CareChatRole,
} from "../../data/careChat";
import { useCareChat } from "../../hooks/useCareChat";

interface DoctorChatPatient {
  id: string;
  name: string;
  diagnosis?: string;
}

interface ChatWidgetProps {
  portal: CareChatRole;
  patientId?: string;
  accentColor?: string;
  accentBg?: string;
  textScaleClass?: string;
  /** 醫師端：可選病患清單（先選病患再選對象） */
  doctorPatients?: DoctorChatPatient[];
}

const ROLE_STYLES: Record<
  CareChatRole,
  { bubble: string; badge: string; icon: typeof Stethoscope }
> = {
  doctor: {
    bubble: "bg-white text-slate-700 border-sky-100",
    badge: "bg-sky-100 text-sky-700",
    icon: Stethoscope,
  },
  family: {
    bubble: "bg-white text-slate-700 border-rose-100",
    badge: "bg-rose-100 text-rose-700",
    icon: Heart,
  },
  patient: {
    bubble: "bg-white text-slate-700 border-teal-50",
    badge: "bg-teal-50 text-teal-400",
    icon: User,
  },
};

function defaultPeer(portal: CareChatRole): CareChatRole {
  return portal === "doctor" ? "patient" : "doctor";
}

function resolveSenderName(portal: CareChatRole, patientId: string): string {
  const profile = getPatientProfile(patientId);
  if (portal === "patient") return profile?.name ?? "患者";
  if (portal === "family") return "家屬";
  return profile?.attendingPhysician ?? "主治醫師";
}

function familyDisplayName(patientId: string): string {
  const profile = getPatientProfile(patientId);
  if (!profile?.emergencyContact) return "家屬";
  const match = profile.emergencyContact.match(/^([^（(]+)/);
  return match?.[1]?.trim() || "家屬";
}

function peerDisplayName(peer: CareChatRole, patientId: string): string {
  const profile = getPatientProfile(patientId);
  if (peer === "doctor") return profile?.attendingPhysician ?? "主治醫師";
  if (peer === "patient") return profile?.name ?? "患者";
  return familyDisplayName(patientId);
}

function inputPlaceholder(portal: CareChatRole, peer: CareChatRole, patientId: string): string {
  if (peer === "family") return "傳訊給家屬...";
  return `傳訊給${peerDisplayName(peer, patientId)}...`;
}

export function ChatWidget({
  portal,
  patientId = DEFAULT_PATIENT_ID,
  accentColor = "bg-teal-300",
  accentBg = "bg-teal-50",
  textScaleClass = "",
  doctorPatients,
}: ChatWidgetProps) {
  const isDoctorPortal = portal === "doctor";
  const resolvedTextScaleClass =
    textScaleClass ||
    (portal === "doctor" || portal === "family" ? "portal-chat-text-scale" : "");
  const [doctorPatientId, setDoctorPatientId] = useState<string | null>(null);
  const activePatientId = isDoctorPortal ? doctorPatientId ?? DEFAULT_PATIENT_ID : patientId;
  const doctorPatientPicker = isDoctorPortal && doctorPatientId === null;

  const profile = getPatientProfile(activePatientId);
  const activePatientName =
    doctorPatients?.find((p) => p.id === activePatientId)?.name ?? profile?.name ?? "病患";
  const peers = useMemo(
    () => (isDoctorPortal ? (["patient", "family"] as CareChatRole[]) : getAvailablePeers(portal)),
    [portal, isDoctorPortal]
  );

  const [open, setOpen] = useState(false);
  const [peer, setPeer] = useState<CareChatRole>(() => defaultPeer(portal));

  useEffect(() => {
    if (!open) {
      setDoctorPatientId(null);
      setPeer(defaultPeer(portal));
    }
  }, [open, portal]);

  useEffect(() => {
    if (!isDoctorPortal) setPeer(defaultPeer(portal));
  }, [patientId, portal, isDoctorPortal]);

  const { messages, totalUnread, send, markRead } = useCareChat(activePatientId, portal, peer);
  const badgeUnread =
    isDoctorPortal && doctorPatients
      ? doctorPatients.reduce((sum, p) => sum + getCareChatTotalUnread(p.id, "doctor"), 0)
      : totalUnread;

  const chatReady = !doctorPatientPicker;

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const senderName = resolveSenderName(portal, activePatientId);

  const headerTitle = doctorPatientPicker
    ? "傳送訊息"
    : isDoctorPortal
      ? activePatientName
      : peerDisplayName(peer, activePatientId);

  const headerSub = doctorPatientPicker
    ? "請先選擇病患"
    : isDoctorPortal
      ? peer === "patient"
        ? `與患者 ${activePatientName} 對話`
        : `與${familyDisplayName(activePatientId)}對話`
      : null;

  useEffect(() => {
    if (!open || !chatReady) return;
    markRead();
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [open, peer, markRead, chatReady, activePatientId]);

  useEffect(() => {
    if (!open || !chatReady) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, peer, chatReady]);

  const sendMessage = () => {
    if (!input.trim()) return;
    send(senderName, input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const widget = (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/20"
          >
            <button
              type="button"
              className="absolute inset-0 w-full h-full cursor-default"
              aria-label="關閉訊息"
              onClick={() => setOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div
              key="chat-panel"
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: "spring", damping: 22, stiffness: 320 }}
              className={`w-80 sm:w-96 portal-chat-panel bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col mb-3 ${resolvedTextScaleClass}`}
              style={resolvedTextScaleClass ? undefined : { height: 500 }}
            >
              <div className={`${accentColor} px-4 py-3 flex items-center justify-between gap-2`}>
                <div className="flex items-center gap-2 min-w-0">
                  {isDoctorPortal && !doctorPatientPicker && (
                    <button
                      type="button"
                      onClick={() => setDoctorPatientId(null)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
                      aria-label="返回選擇病患"
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    {doctorPatientPicker ? (
                      <Users className="w-5 h-5 text-white" />
                    ) : (
                      (() => {
                        const Icon = ROLE_STYLES[peer].icon;
                        return <Icon className="w-5 h-5 text-white" />;
                      })()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate" style={{ fontWeight: 600 }}>
                      {headerTitle}
                    </p>
                    {headerSub && (
                      <p className="text-white/80 text-xs truncate">{headerSub}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
                  aria-label="關閉"
                >
                  <ChevronDown className="w-4 h-4 text-white" />
                </button>
              </div>

              {doctorPatientPicker ? (
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50/50">
                  {(doctorPatients ?? []).map((patient) => {
                    const unread = getCareChatTotalUnread(patient.id, "doctor");
                    return (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setDoctorPatientId(patient.id);
                          setPeer("patient");
                        }}
                        className="w-full text-left bg-white rounded-xl border border-slate-100 px-4 py-3 hover:border-sky-200 hover:bg-sky-50/50 transition-colors flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0 text-sm" style={{ fontWeight: 700 }}>
                          {patient.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-sm truncate" style={{ fontWeight: 700 }}>
                            {patient.name}
                          </p>
                          {patient.diagnosis && (
                            <p className="text-slate-400 text-xs truncate mt-0.5">{patient.diagnosis}</p>
                          )}
                        </div>
                        {unread > 0 && (
                          <span className="min-w-[1.25rem] h-5 px-1.5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center flex-shrink-0" style={{ fontWeight: 700 }}>
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
              <div className={`px-3 py-2 border-b border-slate-100 ${accentBg} flex gap-1.5`}>
                {peers.map((option) => {
                  const active = peer === option;
                  const unread = getCareChatUnreadCount(activePatientId, portal, option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPeer(option)}
                      className={`relative flex-1 min-w-0 px-2 py-2.5 rounded-xl text-xs transition-all ${
                        active
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:bg-white/60"
                      }`}
                      style={{ fontWeight: active ? 700 : 600 }}
                    >
                      <span className="block truncate">
                        {peerDisplayName(option, activePatientId)}
                      </span>
                      {unread > 0 && !active && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                    <div
                      className={`w-12 h-12 rounded-2xl ${accentBg} flex items-center justify-center mb-3`}
                    >
                      <MessageCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm" style={{ fontWeight: 600 }}>
                      尚無訊息
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      傳第一則訊息給{peerDisplayName(peer, activePatientId)}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.from === portal;
                    const roleStyle = ROLE_STYLES[msg.from];
                    const RoleIcon = roleStyle.icon;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        {!isOwn && (
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 ${roleStyle.badge}`}
                          >
                            <RoleIcon className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="max-w-[78%]">
                          {!isOwn && (
                            <p className="text-[10px] text-slate-400 mb-0.5 ml-1">
                              {msg.senderName}
                              <span className="mx-1">·</span>
                              {CARE_CHAT_ROLE_LABEL[msg.from]}
                            </p>
                          )}
                          <div
                            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed border ${
                              isOwn
                                ? `${accentColor} text-white border-transparent rounded-tr-sm`
                                : `${roleStyle.bubble} rounded-tl-sm shadow-sm`
                            }`}
                          >
                            {msg.text}
                          </div>
                          <p
                            className={`text-xs text-slate-400 mt-1 ${
                              isOwn ? "text-right" : "text-left"
                            }`}
                          >
                            {formatCareChatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-3 py-3 border-t border-slate-100 bg-white flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={inputPlaceholder(portal, peer, activePatientId)}
                  className={`flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 transition-all ${portal === "patient" ? "focus:ring-teal-100" : portal === "family" ? "focus:ring-rose-200" : "focus:ring-sky-200"}`}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className={`w-10 h-10 rounded-xl ${accentColor} flex items-center justify-center disabled:opacity-40 transition-opacity shadow-md`}
                  aria-label="送出訊息"
                >
                  <Send className="w-4 h-4 text-white" />
                </motion.button>
              </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setOpen((v) => !v)}
          className={`w-14 h-14 rounded-full ${accentColor} shadow-xl flex items-center justify-center relative`}
          aria-label={open ? "關閉訊息" : "開啟訊息"}
          aria-expanded={open}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
          {!open && badgeUnread > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 bg-red-500 rounded-full text-white flex items-center justify-center"
              style={{ fontSize: 10, fontWeight: 700 }}
            >
              {badgeUnread > 9 ? "9+" : badgeUnread}
            </span>
          )}
        </motion.button>
      </div>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(widget, document.body);
}
