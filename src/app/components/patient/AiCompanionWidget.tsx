/**
 * 小伴 — 患者端常駐 AI 陪伴助手
 * 情境感知對話 + 主動關懷 + 語音朗讀（TTS）
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Volume2, VolumeX, Sparkles, Bot, Mic } from "lucide-react";
import { POSE_IMAGE } from "../../data/companionMessages";
import {
  buildProactiveGreeting,
  replyTo,
  replyToAsync,
  QUICK_QUESTIONS,
  type AiReply,
  type ChatTurn,
} from "../../lib/companionAI";
import { LLM_HISTORY_TURNS, CHAT_STORAGE_LIMIT } from "../../lib/companionConfig";
import {
  ensureCompanionLlm,
  isCompanionLlmReady,
  isWebGpuSupported,
} from "../../lib/companionLLM";
import { markAllEncouragementsRead } from "../../data/encouragements";
import {
  speak,
  stopSpeaking,
  getVoiceEnabled,
  setVoiceEnabled as persistVoiceEnabled,
  isSpeechSupported,
} from "../../lib/speech";
import {
  isSpeechRecognitionSupported,
  listenOnce,
} from "../../lib/speechRecognition";

interface AiMessage {
  id: string;
  text: string;
  thinking?: string;
  sender: "user" | "ai";
  time: string;
}

const CHAT_KEY = "rehabbridge_companion_chat";
const BTN_SIZE = 68;
const EDGE_MARGIN = 16;
const HINT_GAP = 8;
/** 提示文字預留寬度，避免貼邊時被裁切 */
const HINT_RESERVE = 160;
/** 預設留給底部導覽 + safe area 的空間 */
const DEFAULT_BOTTOM_CLEARANCE = 102;
/** 頂部至少避開狀態列（無法量測 main 時的後備） */
const TOP_CLEARANCE = 44;
/** 頂部列小伴落點：緊接「0/6 項」右側，垂直落在標題列下緣 */
const HEADER_ANCHOR_X_GAP = 8;
const HEADER_ANCHOR_Y_OFFSET = 6;
const FALLBACK_X_RATIO = 0.34;
const FALLBACK_Y_RATIO = 0.07;

function measurePatientHeaderAnchor(): { x: number; y: number } | null {
  if (typeof document === "undefined") return null;
  const anchor = document.querySelector('[data-companion-anchor="patient-header"]');
  const header = document.querySelector(".patient-shell-header");
  if (!anchor || !header) return null;
  const anchorRect = anchor.getBoundingClientRect();
  const headerRect = header.getBoundingClientRect();
  if (headerRect.width <= 0 || headerRect.height <= 0) return null;
  return {
    // 按鈕左緣從狀態列文字右側開始，不蓋住「0/6 項」
    x: anchorRect.left + HEADER_ANCHOR_X_GAP,
    // 垂直置中於標題列，略下沉到與內容區交界
    y: headerRect.top + headerRect.height / 2 - BTN_SIZE / 2 + HEADER_ANCHOR_Y_OFFSET,
  };
}

function measureMedsCompanionAnchor(): { x: number; y: number } | null {
  if (typeof document === "undefined") return null;
  const header = document.querySelector('[data-companion-anchor="meds-noon"]');
  if (header) {
    const rect = header.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return {
        x: rect.left + rect.width / 2 - BTN_SIZE / 2,
        y: rect.top + rect.height / 2 - BTN_SIZE / 2,
      };
    }
  }
  return measureMedSlotAnchor("noon");
}

function measureMedSlotAnchor(slot: string): { x: number; y: number } | null {
  if (typeof document === "undefined") return null;
  const col = document.querySelector(`[data-med-slot="${slot}"]`);
  if (!col) return null;
  const rect = col.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: rect.left + rect.width / 2 - BTN_SIZE / 2,
    y: rect.top + 6,
  };
}

function getDefaultPosition(resetKey?: string): { x: number; y: number } {
  if (resetKey === "meds") {
    const noon = measureMedsCompanionAnchor();
    if (noon) return clampPosition(noon.x, noon.y);
  }

  const header = measurePatientHeaderAnchor();
  if (header) return clampPosition(header.x, header.y);

  if (typeof window === "undefined") return { x: EDGE_MARGIN, y: TOP_CLEARANCE + 80 };
  const w = window.innerWidth;
  const h = window.innerHeight;
  return clampPosition(w * FALLBACK_X_RATIO, TOP_CLEARANCE + h * FALLBACK_Y_RATIO);
}

function getBottomClearance(): number {
  if (typeof window === "undefined") return DEFAULT_BOTTOM_CLEARANCE;
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;bottom:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;";
  document.body.appendChild(probe);
  const safeBottom = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return DEFAULT_BOTTOM_CLEARANCE + safeBottom;
}

function clampPosition(x: number, y: number): { x: number; y: number } {
  if (typeof window === "undefined") return { x, y };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const bottomClearance = getBottomClearance();
  let cx = Math.min(Math.max(EDGE_MARGIN, x), w - BTN_SIZE - EDGE_MARGIN);
  const cy = Math.min(
    Math.max(TOP_CLEARANCE, y),
    h - BTN_SIZE - bottomClearance
  );

  const onRight = cx + BTN_SIZE / 2 > w / 2;
  if (onRight) {
    cx = Math.max(cx, HINT_RESERVE + HINT_GAP);
  } else {
    cx = Math.min(cx, w - BTN_SIZE - HINT_RESERVE - HINT_GAP - EDGE_MARGIN);
  }

  return { x: cx, y: cy };
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
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-CHAT_STORAGE_LIMIT)));
  } catch {
    /* ignore */
  }
}

export function AiCompanionWidget({
  patientName,
  resetKey,
}: {
  patientName: string;
  /** 切換分頁時，小伴回到該分頁預設落點（復健等：頂部列；用藥：中午欄） */
  resetKey?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(() => getDefaultPosition(resetKey));
  const [messages, setMessages] = useState<AiMessage[]>(() => loadChat());
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(QUICK_QUESTIONS);
  const [voiceOn, setVoiceOn] = useState(() => getVoiceEnabled());
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listenError, setListenError] = useState<string | null>(null);
  const [llmReady, setLlmReady] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmLoadText, setLlmLoadText] = useState("");
  const openRef = useRef(open);
  const greetedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listeningRef = useRef(false);
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
    openRef.current = open;
  }, [open]);

  const closeCompanion = useCallback(() => {
    stopSpeaking();
    listeningRef.current = false;
    setIsListening(false);
    setListenError(null);
    setOpen(false);
  }, []);

  useEffect(() => {
    saveChat(messages);
  }, [messages]);

  useEffect(() => {
    const syncPosition = () => {
      if (resetKey) {
        setPos(getDefaultPosition(resetKey));
      } else {
        setPos((p) => clampPosition(p.x, p.y));
      }
    };
    syncPosition();
    requestAnimationFrame(() => {
      requestAnimationFrame(syncPosition);
    });
    window.addEventListener("resize", syncPosition);
    return () => window.removeEventListener("resize", syncPosition);
  }, [resetKey]);

  /* 開啟對話時預載本機 LLM */
  useEffect(() => {
    if (!open) return;
    if (!isWebGpuSupported()) {
      setLlmReady(false);
      setLlmLoading(false);
      return;
    }
    if (isCompanionLlmReady()) {
      setLlmReady(true);
      setLlmLoading(false);
      return;
    }
    setLlmLoading(true);
    setLlmLoadText("正在準備本機 AI…");
    ensureCompanionLlm((p) => {
      setLlmLoadText(p.text || "正在下載開源語言模型…");
    })
      .then((eng) => {
        setLlmReady(!!eng);
      })
      .finally(() => {
        setLlmLoading(false);
      });
  }, [open]);

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
      setPos((p) => clampPosition(p.x, p.y));
      return;
    }
    setOpen((v) => {
      if (v) stopSpeaking();
      return !v;
    });
  };

  const panelAlignEnd = pos.x + BTN_SIZE / 2 > window.innerWidth / 2;

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages, isTyping]);

  const maybeSpeak = useCallback(
    (text: string) => {
      if (!openRef.current) return;
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
        {
          id: `ai-${Date.now()}`,
          text: reply.text,
          thinking: reply.thinking,
          sender: "ai",
          time: getTime(),
        },
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

  const sendText = async (raw: string) => {
    const text = raw.trim();
    if (!text || isTyping) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, text, sender: "user", time: getTime() },
    ]);
    setInput("");
    setIsTyping(true);

    const history: ChatTurn[] = messages.slice(-LLM_HISTORY_TURNS).map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }));

    try {
      const reply = await replyToAsync(text, patientName, history, (p) => {
        if (p.text) setLlmLoadText(p.text);
      });
      pushAiReply(reply);
    } catch {
      pushAiReply(replyTo(text, patientName));
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    persistVoiceEnabled(next);
    if (!next) stopSpeaking();
  };

  const toggleListen = async () => {
    if (isTyping) return;
    if (listeningRef.current) {
      listeningRef.current = false;
      setIsListening(false);
      return;
    }
    if (!isSpeechRecognitionSupported()) {
      setListenError("此裝置不支援語音輸入，請改用打字");
      return;
    }
    setListenError(null);
    listeningRef.current = true;
    setIsListening(true);
    try {
      const text = await listenOnce({
        onInterim: (partial) => setInput(partial),
      });
      if (listeningRef.current) {
        setInput(text);
        sendText(text);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "語音辨識失敗";
      setListenError(msg);
    } finally {
      listeningRef.current = false;
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (!open) {
      stopSpeaking();
      listeningRef.current = false;
      setIsListening(false);
      setListenError(null);
    }
  }, [open]);

  useEffect(() => () => stopSpeaking(), []);

  const widget = (
    <>
      {/* 全螢幕對話框 — 置中顯示，不受浮動按鈕位置影響 */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="ai-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9998] bg-black/40"
            >
              <button
                type="button"
                className="absolute inset-0 w-full h-full cursor-default"
                aria-label="關閉小伴對話"
                onClick={closeCompanion}
              />
            </motion.div>

            <motion.div
              key="ai-panel"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", damping: 24, stiffness: 320 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="patient-large-text patient-chat-panel pointer-events-auto w-full max-w-[min(480px,calc(100vw-2rem))] bg-white rounded-3xl shadow-2xl border border-teal-50 overflow-hidden flex flex-col max-h-[min(640px,calc(100dvh-4rem))]"
                role="dialog"
                aria-modal="true"
                aria-label="小伴 AI 陪伴對話"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-300 to-emerald-300 px-4 py-3 flex items-center justify-between flex-shrink-0">
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
                        <span className="text-white/85 text-xs">
                          {llmLoading
                            ? llmLoadText || "正在載入本機 AI…"
                            : llmReady
                              ? "本機 AI · 可查資料聊天"
                              : isWebGpuSupported()
                                ? "智慧陪伴 · 離線規則引擎"
                                : "本機運行 · 無需網路"}
                        </span>
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
                      onClick={closeCompanion}
                      className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                      aria-label="關閉小伴"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gradient-to-b from-teal-50/40 to-white min-h-[240px]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.sender === "ai" && (
                        <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-50 overflow-hidden flex-shrink-0 mr-2 mt-0.5">
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
                              ? "bg-teal-300 text-white rounded-tr-sm"
                              : "bg-white text-slate-700 rounded-tl-sm shadow-sm border border-teal-50/70"
                          }`}
                        >
                          {msg.sender === "ai" && msg.thinking && (
                            <p className="text-[11px] text-slate-400 mb-1.5 pb-1.5 border-b border-slate-100">
                              思考：{msg.thinking}
                            </p>
                          )}
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
                      <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-50 overflow-hidden">
                        <img
                          src={POSE_IMAGE.tip}
                          alt=""
                          className="w-full h-full object-cover object-top scale-[1.6] translate-y-1.5"
                          aria-hidden
                        />
                      </div>
                      <div className="bg-white border border-teal-50 shadow-sm px-3 py-2.5 rounded-2xl rounded-tl-sm flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-teal-200 rounded-full"
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
                  <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-teal-50 bg-white flex-shrink-0">
                    {suggestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendText(q)}
                        className="px-3.5 py-2 rounded-full bg-teal-50 border border-teal-50 text-teal-400 text-xs hover:bg-teal-50 transition-colors"
                        style={{ fontWeight: 700 }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="px-3 py-3 border-t border-teal-50 bg-white flex-shrink-0">
                  {listenError && (
                    <p className="text-xs text-rose-500 mb-2 px-1" role="alert">
                      {listenError}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        if (listenError) setListenError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendText(input);
                        }
                      }}
                      placeholder={isListening ? "正在聽你說話…" : "跟小伴說說話..."}
                      aria-label="輸入訊息給小伴"
                      disabled={isListening}
                      className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-100 transition-all disabled:opacity-70"
                    />
                    {isSpeechRecognitionSupported() && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleListen}
                        disabled={isTyping}
                        aria-label={isListening ? "停止語音輸入" : "語音輸入"}
                        aria-pressed={isListening}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-md ${
                          isListening
                            ? "bg-rose-500 text-white animate-pulse"
                            : "bg-teal-50 border border-teal-50 text-teal-300 hover:bg-teal-50"
                        } disabled:opacity-40`}
                      >
                        <Mic className="w-5 h-5" />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => sendText(input)}
                      disabled={!input.trim() || isListening}
                      aria-label="送出訊息"
                      className="w-12 h-12 rounded-xl bg-teal-300 flex items-center justify-center disabled:opacity-40 transition-opacity shadow-md"
                    >
                      <Send className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 浮動小伴按鈕 — 對話開啟時隱藏，避免與對話框重疊 */}
      {!open && (
      <div
        className="fixed z-[9997] select-none"
        style={{ left: pos.x, top: pos.y, width: BTN_SIZE, height: BTN_SIZE }}
      >
          <AnimatePresence>
            {!open && !isDragging && (
              <motion.p
                key="companion-hint"
                initial={{ opacity: 0, x: panelAlignEnd ? 6 : -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: panelAlignEnd ? 4 : -4 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-teal-300/80 text-[11px] whitespace-nowrap leading-none ${
                  panelAlignEnd
                    ? "right-full mr-2 text-right"
                    : "left-full ml-2 text-left"
                }`}
                style={{ fontWeight: 600 }}
              >
                點小伴聊聊 · 可拖曳
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={isDragging ? undefined : { scale: 1.05 }}
            whileTap={isDragging ? undefined : { scale: 0.96 }}
            onPointerDown={handleFabPointerDown}
            onPointerMove={handleFabPointerMove}
            onPointerUp={finishFabDrag}
            onPointerCancel={finishFabDrag}
            onClick={(e) => e.preventDefault()}
            style={{ width: BTN_SIZE, height: BTN_SIZE }}
            className={`absolute inset-0 rounded-full touch-none shadow-xl border-[3px] border-white overflow-hidden ${
              isDragging ? "cursor-grabbing scale-105 shadow-2xl" : "cursor-grab"
            }`}
            aria-label="開啟小伴 AI 陪伴（按住可拖曳調整位置）"
            aria-expanded={false}
          >
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-teal-300 via-teal-300 to-emerald-300" />
                <div className="absolute inset-[9px] rounded-full bg-white/12 border border-white/25 flex items-center justify-center">
                  <Bot className="w-9 h-9 text-white drop-shadow-sm" strokeWidth={1.75} aria-hidden />
                </div>
                <span
                  className="absolute top-[7px] left-1/2 -translate-x-1/2 w-1 h-2 rounded-full bg-white/70"
                  aria-hidden
                />
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-white/50"
                  animate={{ scale: [1, 1.14, 1], opacity: [0.55, 0, 0.55] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                  aria-hidden
                />
                <span
                  className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-200 border-2 border-white shadow-sm"
                  title="在線"
                  aria-hidden
                />
              </>
          </motion.button>
        </div>
      )}
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(widget, document.body);
}
