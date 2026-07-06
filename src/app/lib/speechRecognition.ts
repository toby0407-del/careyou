/**
 * 語音輸入 — Web Speech API（SpeechRecognition）
 * iOS Safari / WKWebView 使用 webkitSpeechRecognition
 */

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() != null;
}

export interface ListenOptions {
  lang?: string;
  /** 最長聆聽秒數 */
  maxSeconds?: number;
  onInterim?: (text: string) => void;
}

/** 單次語音辨識，回傳最終文字；失敗或無內容則 reject */
export function listenOnce(options: ListenOptions = {}): Promise<string> {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    return Promise.reject(new Error("此裝置不支援語音輸入"));
  }

  const { lang = "zh-TW", maxSeconds = 12, onInterim } = options;

  return new Promise((resolve, reject) => {
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let settled = false;
    let finalText = "";

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      fn();
    };

    const timer = window.setTimeout(() => {
      finish(() => {
        if (finalText.trim()) resolve(finalText.trim());
        else reject(new Error("沒有聽到聲音，請再試一次"));
      });
    }, maxSeconds * 1000);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      if (interim && onInterim) onInterim((finalText + interim).trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const code = event.error;
      if (code === "aborted") return;
      if (code === "no-speech") {
        finish(() => reject(new Error("沒有聽到聲音，請再試一次")));
        return;
      }
      if (code === "not-allowed") {
        finish(() => reject(new Error("請允許麥克風權限才能語音輸入")));
        return;
      }
      finish(() => reject(new Error("語音辨識失敗，請改用打字")));
    };

    recognition.onend = () => {
      finish(() => {
        const text = finalText.trim();
        if (text) resolve(text);
        else reject(new Error("沒有聽到聲音，請再試一次"));
      });
    };

    try {
      recognition.start();
    } catch {
      finish(() => reject(new Error("無法啟動語音辨識")));
    }
  });
}
