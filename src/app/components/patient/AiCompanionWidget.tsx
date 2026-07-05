/**
 * 小伴 — 患者端常駐 AI 陪伴助手
 * 情境感知對話 + 主動關懷 + 語音朗讀（TTS）
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Volume2, VolumeX, Sparkles } from "lucide-react";
import { POSE_IMAGE } from "../../data/companionMessages";
import {
  buildProactiveGreeting,
  replyTo,
  QUICK_QUESTIONS,
  type AiReply,
} from "../../lib/companionAI";
import { markAllEncouragementsRead } from "../../data/encouragements";
import {
  speak,
  stopSpeaking,
  getVoiceEnabled,
  setVoiceEnabled as persistVoiceEnabled,
  isSpeechSupported,
} from "../../lib/speech";

interface AiMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  time: string;
}

const CHAT_KEY = "rehabbridge_companion_chat";
const POS_KEY = "rehabbridge_companion_pos";
const BTN_SIZE = 72;
const EDGE_MARGIN = 16;
/** 預設留給底部導覽 + safe area 的空間 */
const DEFAULT_BOTTOM_CLEARANCE = 84;

function clampPosition(x: number, y: number): { x: number; y: number } {
  if (typeof window === "undefined") return { x, y };
  const maxX = window.innerWidth - BTN_SIZE - EDGE_MARGIN;
  const maxY = window.innerHeight - BTN_SIZE - EDGE_MARGIN;
  return {
    x: Math.min(Math.max(EDGE_MARGIN, x), maxX),
    y: Math.min(Math.max(EDGE_MARGIN, y), maxY),
  };
}

function getDefaultPosition(): { x: number; y: number } {
  if (typeof window === "undefined") return { x: EDGE_MARGIN, y: EDGE_MARGIN };
  return clampPosition(
    window.innerWidth - BTN_SIZE - EDGE_MARGIN,
    window.innerHeight - BTN_SIZE - DEFAULT_BOTTOM_CLEARANCE
  );
}

function loadPosition(): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { x?: number; y?: number };
      if (typeof p.x === "number" && typeof p.y === "number") {
        return clampPosition(p.x, p.y);
      }
    }
  } catch {
    /* ignore */
  }
  return getDefaultPosition();
}

function savePosition(pos: { x: number; y: number }) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

function getTime() {
  return new Date().toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function loadChat(): AiMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? (JSON.parse(raw) as AiMessage[]) : [];
  } catch {
    return [];
  }
}

function saveChat(messages: AiMessage[]) {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-50)));
  } catch {
    /* ignore */
  }
}

export function AiCompanionWidget({ patientName }: { patientName: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(() => loadPosition());
  const [messages, setMessages] = useState<AiMessage[]>(() => loadChat());
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(QUICK_QUESTIONS);
  const [voiceOn, setVoiceOn] = useState(() => getVoiceEnabled());
  const [isDragging, setIsDragging] = useState(false);
  const greetedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    pointerId: -1,
  });

  useEffect(() => {
    saveChat(messages);
  }, [messages]);

  useEffect(() => {
    const onResize = () => setPos((p) => clampPosition(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (open) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      pointerId: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleFabPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 8) return;
    d.moved = true;
    setIsDragging(true);
    setPos(clampPosition(d.origX + dx, d.origY + dy));
  };

  const finishFabDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    d.active = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (d.moved) {
      setPos((p) => {
        savePosition(p);
        return p;
      });
      return;
    }
    setOpen((v) => !v);
  };

  const panelAlignEnd = pos.x + BTN_SIZE / 2 > window.innerWidth / 2;

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, messages, isTyping]);

  const maybeSpeak = useCallback(
    (text: string) => {
      if (voiceOn && isSpeechSupported()) {
        speak(text.replace(/[💚💌🎉🥺😌🙈]/gu, ""), { interrupt: true });
      }
    },
    [voiceOn]
  );

  const pushAiReply = useCallback(
    (reply: AiReply) => {
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, text: reply.text, sender: "ai", time: getTime() },
      ]);
      setSuggestions(reply.suggestions ?? QUICK_QUESTIONS);
      maybeSpeak(reply.text);
    },
    [maybeSpeak]
  );

  // 開啟時主動問候（情境感知：進度、記憶、家人鼓勵）
  useEffect(() => {
    if (!open || greetedRef.current) return;
    greetedRef.current = true;
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      pushAiReply(buildProactiveGreeting(patientName));
      markAllEncouragementsRead();
    }, 700);
    return () => clearTimeout(timer);
  }, [open, patientName, pushAiReply]);

  const sendText = (raw: string) => {
    const text = raw.trim();
    if (!text || isTyping) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, text, sender: "user", time: getTime() },
    ]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      pushAiReply(replyTo(text, patientName));
    }, 700 + Math.random() * 500);
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    persistVoiceEnabled(next);
    if (!next) stopSpeaking();
  };

  const widget = (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="ai-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/20"
          >
            <button
              type="button"
              className="absolute inset-0 w-full h-full cursor-default"
              aria-label="關閉小伴對話"
              onClick={() => setOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`fixed z-[9999] flex flex-col gap-3 select-none ${panelAlignEnd ? "items-end" : "items-start"}`}
        style={{ left: pos.x, top: pos.y }}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              key="ai-panel"
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              transition={{ type: "spring", damping: 22, stiffness: 320 }}
              className="patient-large-text patient-chat-panel w-[420px] max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-2xl border border-teal-100 overflow-hidden flex flex-col mb-3"
              role="dialog"
              aria-label="小伴 AI 陪伴對話"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/90 border-2 border-white overflow-hidden flex-shrink-0">
                    <img
                      src={POSE_IMAGE.greet}
                      alt=""
                      className="w-full h-full object-cover object-top scale-[1.6] translate-y-2"
                      aria-hidden
                    />
                  </div>
                  <div>
                    <p className="text-white text-base leading-tight" style={{ fontWeight: 800 }}>
                      小伴 · AI 陪伴
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      <span className="text-white/85 text-xs">本機運行 · 無需網路</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSpeechSupported() && (
                    <button
                      onClick={toggleVoice}
                      className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                      aria-label={voiceOn ? "關閉語音朗讀" : "開啟語音朗讀"}
                      aria-pressed={voiceOn}
                      title={voiceOn ? "語音朗讀：開" : "語音朗讀：關"}
                    >
                      {voiceOn ? (
                        <Volume2 className="w-4 h-4 text-white" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    aria-label="關閉小伴"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gradient-to-b from-teal-50/40 to-white min-h-[280px] max-h-[46vh]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "ai" && (
                      <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-200 overflow-hidden flex-shrink-0 mr-2 mt-0.5">
                        <img
                          src={POSE_IMAGE.cheer}
                          alt=""
                          className="w-full h-full object-cover object-top scale-[1.6] translate-y-1.5"
                          aria-hidden
                        />
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                          msg.sender === "user"
                            ? "bg-teal-500 text-white rounded-tr-sm"
                            : "bg-white text-slate-700 rounded-tl-sm shadow-sm border border-teal-100/70"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <p
                        className={`text-xs text-slate-400 mt-1 ${
                          msg.sender === "user" ? "text-right" : "text-left"
                        }`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-200 overflow-hidden">
                      <img
                        src={POSE_IMAGE.tip}
                        alt=""
                        className="w-full h-full object-cover object-top scale-[1.6] translate-y-1.5"
                        aria-hidden
                      />
                    </div>
                    <div className="bg-white border border-teal-100 shadow-sm px-3 py-2.5 rounded-2xl rounded-tl-sm flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-teal-400 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions */}
              {!isTyping && suggestions.length > 0 && (
                <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-teal-50 bg-white">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendText(q)}
                      className="px-3.5 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs hover:bg-teal-100 transition-colors"
                      style={{ fontWeight: 700 }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-3 py-3 border-t border-teal-50 bg-white flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendText(input);
                    }
                  }}
                  placeholder="跟小伴說說話..."
                  aria-label="輸入訊息給小伴"
                  className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-300 transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendText(input)}
                  disabled={!input.trim()}
                  aria-label="送出訊息"
                  className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center disabled:opacity-40 transition-opacity shadow-md"
                >
                  <Send className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating button — 按住拖曳調整位置，輕點開啟 */}
        <motion.button
          whileHover={isDragging ? undefined : { scale: 1.06 }}
          whileTap={isDragging ? undefined : { scale: 0.94 }}
          onPointerDown={handleFabPointerDown}
          onPointerMove={handleFabPointerMove}
          onPointerUp={finishFabDrag}
          onPointerCancel={finishFabDrag}
          onClick={(e) => {
            if (open) {
              e.preventDefault();
              setOpen(false);
            }
          }}
          className={`relative w-[72px] h-[72px] rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 shadow-xl border-[3px] border-white flex items-center justify-center overflow-hidden touch-none ${
            isDragging ? "cursor-grabbing scale-105 shadow-2xl" : "cursor-grab"
          }`}
          aria-label={
            open
              ? "關閉小伴 AI 陪伴"
              : "開啟小伴 AI 陪伴（按住可拖曳調整位置）"
          }
          aria-expanded={open}
        >
          {open ? (
            <X className="w-7 h-7 text-white" />
          ) : (
            <img
              src={POSE_IMAGE.greet}
              alt=""
              className="w-full h-full object-cover object-top scale-[1.55] translate-y-3"
              aria-hidden
            />
          )}
          {!open && (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-teal-300"
              animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              aria-hidden
            />
          )}
        </motion.button>
        {!open && !isDragging && (
          <span
            className="absolute -top-2 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[11px] px-2.5 py-0.5 rounded-full shadow whitespace-nowrap pointer-events-none"
            style={{ fontWeight: 700 }}
          >
            按住可拖曳
          </span>
        )}
      </div>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(widget, document.body);
}
