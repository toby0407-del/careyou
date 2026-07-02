import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  X,
  Send,
  Phone,
  User,
  ChevronDown,
} from "lucide-react";
import { getAppDisplayName } from "../../brand";

interface Message {
  id: string;
  text: string;
  sender: "user" | "support";
  time: string;
}

interface ChatWidgetProps {
  accentColor?: string;
  accentBg?: string;
  portalLabel?: string;
  /** 掛在 body 時套用大字樣式（如患者端 patient-large-text） */
  textScaleClass?: string;
}

const SUPPORT_RESPONSES = [
  `您好！我是 ${getAppDisplayName()} 客服，請問有什麼需要協助的嗎？`,
  "好的，我了解您的問題，請稍等我查詢一下。",
  "根據您的訓練紀錄，建議您可以先從較低強度的動作開始。",
  "如果有任何不適，請立即停止訓練並聯繫您的主治醫師。",
  "您的訓練進度非常好！請繼續保持。",
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    text: `您好！歡迎使用 ${getAppDisplayName()}。有任何問題請隨時告訴我。`,
    sender: "support",
    time: "10:30",
  },
];

function getTime() {
  return new Date().toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ChatWidget({
  accentColor = "bg-teal-500",
  accentBg = "bg-teal-50",
  portalLabel = "客服支援",
  textScaleClass = "",
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: "user",
      time: getTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response =
        SUPPORT_RESPONSES[Math.floor(Math.random() * SUPPORT_RESPONSES.length)];
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: response,
          sender: "support",
          time: getTime(),
        },
      ]);
    }, 1200 + Math.random() * 800);
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
              aria-label="關閉客服對話"
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
              className={`w-80 sm:w-96 portal-chat-panel bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col mb-3 ${textScaleClass}`}
              style={textScaleClass ? undefined : { height: 460 }}
            >
            {/* Header */}
            <div className={`${accentColor} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm" style={{ fontWeight: 600 }}>
                    {portalLabel}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                    <span className="text-white/80 text-xs">線上服務中</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="通話"
                >
                  <Phone className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="關閉"
                >
                  <ChevronDown className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "support" && (
                    <div className={`w-7 h-7 rounded-full ${accentColor} flex items-center justify-center flex-shrink-0 mr-2 mt-0.5`}>
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="max-w-[75%]">
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? `${accentColor} text-white rounded-tr-sm`
                          : "bg-white text-slate-700 rounded-tl-sm shadow-sm border border-slate-100"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <p className={`text-xs text-slate-400 mt-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full ${accentColor} flex items-center justify-center`}>
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-slate-100 shadow-sm px-3 py-2.5 rounded-2xl rounded-tl-sm flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-slate-400 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-slate-100 bg-white flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="輸入訊息..."
                className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-300 transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!input.trim()}
                className={`w-10 h-10 rounded-xl ${accentColor} flex items-center justify-center disabled:opacity-40 transition-opacity shadow-md`}
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </motion.div>
          )}
        </AnimatePresence>

        <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        className={`w-14 h-14 rounded-full ${accentColor} shadow-xl flex items-center justify-center relative`}
        aria-label={open ? "關閉客服對話" : "開啟客服對話"}
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
        {!open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center" style={{ fontSize: 10, fontWeight: 700 }}>
            1
          </span>
        )}
      </motion.button>
      </div>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(widget, document.body);
}
