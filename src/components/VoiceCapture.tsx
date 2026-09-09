import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Square, Loader2, Sparkles, AlertTriangle } from "lucide-react";

// Extend Window to include webkit prefix
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface VoiceCaptureProps {
  itemId?: string;
  onParsed: (fields: {
    title?: string;
    summary?: string;
    problem?: string;
    proposedSolution?: string;
    targetAudience?: string;
    uniqueInsight?: string;
  }) => void;
  onError?: (error: string) => void;
}

type VoiceState = "idle" | "recording" | "parsing" | "done" | "error";

export function VoiceCapture({ itemId, onParsed, onError }: VoiceCaptureProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [providerInfo, setProviderInfo] = useState<{ provider?: string; model?: string; latencyMs?: number } | null>(null);
  const [parsedFields, setParsedFields] = useState<Record<string, string> | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  // Check browser support
  const isSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Duration timer
  useEffect(() => {
    if (state === "recording") {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const startRecording = useCallback(() => {
    if (!isSupported) {
      setErrorMessage("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      setState("error");
      return;
    }

    // Reset state
    setTranscript("");
    setInterimTranscript("");
    setErrorMessage("");
    setProviderInfo(null);
    setDuration(0);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) setTranscript(prev => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setErrorMessage("Microphone access denied. Please allow microphone access in your browser settings.");
      } else if (event.error === "no-speech") {
        // This is normal — just means silence, don't error
        return;
      } else {
        setErrorMessage(`Speech recognition error: ${event.error}`);
      }
      setState("error");
    };

    recognition.onend = () => {
      // If we're still in recording state, the recognition stopped unexpectedly — restart it
      if (recognitionRef.current && state === "recording") {
        try {
          recognition.start();
        } catch {
          // Already started or other issue
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState("recording");
  }, [isSupported, state]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null; // Clear ref BEFORE stopping to prevent auto-restart
      ref.stop();
    }
    setState(transcript.trim().length > 0 ? "idle" : "idle");
  }, [transcript]);

  const parseTranscript = useCallback(async () => {
    const fullTranscript = (transcript + " " + interimTranscript).trim();
    if (fullTranscript.length < 10) {
      setErrorMessage("Please record at least a few sentences about your idea.");
      return;
    }

    setState("parsing");
    setInterimTranscript("");

    try {
      const res = await fetch("/api/voice/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullTranscript, itemId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse transcript");
      }

      setProviderInfo({ provider: data.provider, model: data.model, latencyMs: data.latencyMs });
      setState("done");
      setParsedFields(data.fields);
    } catch (err: any) {
      console.error("Voice parse error:", err);
      setErrorMessage(err.message || "Failed to parse voice input.");
      setState("error");
      onError?.(err.message);
    }
  }, [transcript, interimTranscript, itemId, onError]);

  const applyParsedFields = () => {
    if (parsedFields) {
      onParsed(parsedFields);
      setParsedFields(null);
      reset();
    }
  };

  // Reset everything
  const reset = () => {
    setTranscript("");
    setInterimTranscript("");
    setErrorMessage("");
    setProviderInfo(null);
    setDuration(0);
    setState("idle");
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Voice capture requires Chrome or Edge.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Control Bar */}
      <div className="flex items-center gap-3">
        {state === "idle" || state === "done" || state === "error" ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl text-primary text-xs font-mono font-bold tracking-wider transition-all cursor-pointer group"
          >
            <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {transcript ? "RE-RECORD" : "START VOICE CAPTURE"}
          </button>
        ) : state === "recording" ? (
          <div className="flex items-center gap-3">
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono font-bold tracking-wider transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              STOP
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-400">{formatDuration(duration)}</span>
            </div>
          </div>
        ) : state === "parsing" ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-mono font-bold">
            <Loader2 className="w-4 h-4 animate-spin" />
            STRUCTURING YOUR IDEA...
          </div>
        ) : null}

        {/* Parse Button — visible when we have transcript and not recording/parsing */}
        {transcript.trim().length > 0 && state !== "recording" && state !== "parsing" && (
          <button
            onClick={parseTranscript}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-on-primary rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            PARSE & FILL CANVAS
          </button>
        )}

        {/* Reset */}
        {(transcript || state === "error" || state === "done") && state !== "recording" && state !== "parsing" && (
          <button
            onClick={reset}
            className="px-3 py-2 text-xs font-mono text-text-muted hover:text-on-surface transition-colors cursor-pointer"
          >
            CLEAR
          </button>
        )}
      </div>

      {/* Live Transcript */}
      {(state === "recording" || transcript || interimTranscript) && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 max-h-48 overflow-y-auto">
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            {state === "recording" ? "🎙️ Listening..." : "📝 Transcript"}
          </p>
          <p className="text-sm text-on-surface/90 leading-relaxed">
            {transcript}
            {interimTranscript && (
              <span className="text-text-muted/60 italic">{interimTranscript}</span>
            )}
            {state === "recording" && !transcript && !interimTranscript && (
              <span className="text-text-muted/40 italic">Start talking about your idea...</span>
            )}
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success / Preview State */}
      {state === "done" && parsedFields && (
        <div className="flex flex-col gap-3 p-4 bg-surface-container border border-primary/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-primary font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              AI EXTRACTED FIELDS
            </div>
            {providerInfo && (
              <div className="text-[10px] font-mono text-text-muted">
                {providerInfo.provider} · {(providerInfo.latencyMs! / 1000).toFixed(1)}s
              </div>
            )}
          </div>
          
          <div className="grid gap-2 text-xs">
            {Object.entries(parsedFields).map(([key, val]) => (
              val ? (
                <div key={key} className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] uppercase text-text-muted">{key}</span>
                  <span className="text-on-surface bg-surface-container-lowest p-2 rounded border border-outline-variant/30">{val}</span>
                </div>
              ) : null
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={applyParsedFields}
              className="flex-1 py-2 bg-primary text-on-primary rounded font-mono font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Apply to Canvas
            </button>
            <button
              onClick={() => {
                setParsedFields(null);
                setState("idle");
              }}
              className="px-4 py-2 bg-surface-container-highest text-on-surface rounded font-mono font-bold text-xs uppercase tracking-wider hover:bg-surface-container-highest/80 transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
