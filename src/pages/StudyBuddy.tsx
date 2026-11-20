import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  BrainCircuit,
  Sparkles,
  Send,
  User,
  Loader2,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  HelpCircle,
  Code2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

type Role = 'user' | 'assistant';

interface ChatMessage {
  role: Role;
  content: string;
}

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    "Hey! I'm MindSpark AI — the little genius living inside StudySpace. I can untangle tough concepts, build your study timetable, prep you for exams, and fire practice questions your way. What are we learning today?",
};

const SUGGESTIONS = [
  {
    label: 'Explain a difficult topic',
    category: 'Concepts',
    icon: BookOpen,
    prompt: 'Explain a difficult topic from my course in simple words with clear, real-world examples.',
  },
  {
    label: 'Create my study timetable',
    category: 'Planning',
    icon: Calendar,
    prompt: 'Create a weekly study timetable for a college student balancing 4 core subjects and revision.',
  },
  {
    label: 'Help me prepare for exams',
    category: 'Exams',
    icon: Sparkles,
    prompt: 'Give me a structured 7-day high-yield revision plan to ace my upcoming exams.',
  },
  {
    label: 'Generate practice questions',
    category: 'Practice',
    icon: Code2,
    prompt: 'Generate 5 conceptual practice questions with detailed explanations for a college course topic.',
  },
];

const ERROR_MESSAGES: Record<string, string> = {
  no_api_key:
    'MindSpark AI is not connected yet — GEMINI_API_KEY is missing from environment secrets.',
  invalid_key:
    'The Gemini API key was rejected. Please check that GEMINI_API_KEY is a valid key from Google AI Studio.',
  api_disabled:
    'The Generative Language API is disabled in your Google Cloud project. Enable it at console.cloud.google.com or create a fresh key in Google AI Studio (aistudio.google.com).',
  key_restrictions:
    'GEMINI_API_KEY has application restrictions (e.g. HTTP referrers) blocking backend server calls. In Google Cloud Console -> APIs & Services -> Credentials, set Application Restrictions to "None".',
  project_restricted:
    'Google API rejected the request with PERMISSION_DENIED. Check project restrictions in Google Cloud Console or create an unrestricted key at https://aistudio.google.com/app/apikey.',
  rate_limited:
    'MindSpark is receiving too many requests right now. Please wait a minute and try again.',
  model_unavailable:
    'The Gemini AI model is currently unavailable for this key tier. Please check Google AI Studio access.',
  server_error: 'The AI service had an unexpected issue. Please try again in a little while.',
  network_error: 'Could not reach the server. Please check your connection and try again.',
};

const FUNCTION_URL = '/api/studybuddy-ai';

function getCreativityLabel(temp: number): string {
  if (temp <= 0.3) return 'Precise & Factual';
  if (temp <= 0.7) return 'Balanced Study Guide';
  return 'Creative & Brainstorming';
}

function formatMessageContent(content: string) {
  // Simple, safe rendering for markdown-like formatting (paragraphs, lists, code, bold)
  const paragraphs = content.split(/\n\n+/);
  return paragraphs.map((p, idx) => {
    // Check if it's a code block
    if (p.startsWith('```') && p.endsWith('```')) {
      const lines = p.slice(3, -3).trim().split('\n');
      const lang = lines[0]?.match(/^[a-z]+/i) ? lines.shift() : '';
      return (
        <pre
          key={idx}
          className="my-2.5 overflow-x-auto rounded-xl bg-slate-900/90 p-3.5 text-xs font-mono text-slate-100 ring-1 ring-white/10 dark:bg-black/60"
        >
          {lang && <div className="mb-1 text-[10px] font-bold uppercase text-violet-400">{lang}</div>}
          <code>{lines.join('\n')}</code>
        </pre>
      );
    }

    // Check if it's a bullet list
    if (p.split('\n').every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
      const items = p.split('\n').map((l) => l.replace(/^[-*]\s+/, ''));
      return (
        <ul key={idx} className="my-2 list-inside list-disc space-y-1 text-sm leading-relaxed">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }

    // Standard paragraph with inline formatting
    return (
      <p key={idx} className="my-1.5 text-sm leading-relaxed">
        {p}
      </p>
    );
  });
}

export function StudyBuddy() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    setError('');
    setInput('');
  };

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;
    setInput('');
    setError('');
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: next, temperature }),
      });

      const data = (await res.json().catch(() => null)) as {
        reply?: string;
        error?: string;
        message?: string;
      } | null;

      if (!res.ok || !data || data.error || !data.reply) {
        const fallbackMsg =
          ERROR_MESSAGES[data?.error ?? ''] ??
          'Something went wrong while connecting to MindSpark AI.';
        setError(data?.message || fallbackMsg);
      } else {
        setMessages([...next, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setError(ERROR_MESSAGES.network_error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-fade-up">
          <div className="flex items-center gap-3">
            <span className="grad-icon h-12 w-12 animate-pulse-slow bg-gradient-to-br from-sky-400 via-violet-500 to-fuchsia-500 shadow-violet-500/30 ring-2 ring-violet-400/40">
              <BrainCircuit size={24} />
            </span>
            <div>
              <h1 className="page-title">
                MindSpark{' '}<span className="bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">AI</span>
              </h1>
              <p className="page-subtitle">
                Your spark of genius — concepts, timetables, exams & practice, all in one brain.
              </p>
            </div>
          </div>
        </div>

        {/* Temperature slider widget */}
        <div className="card animate-fade-up stagger-1 w-full px-5 py-4 sm:w-80">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="muted flex items-center gap-1.5">
              <Sparkles size={13} className="text-violet-500" />
              Creativity
            </span>
            <span className="font-bold text-violet-600 dark:text-violet-300">
              {temperature.toFixed(1)} · {getCreativityLabel(temperature)}
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="mt-2.5 w-full accent-violet-600 dark:accent-violet-400"
            aria-label="Response creativity (temperature)"
          />
          <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>0.1 Precise</span>
            <span>0.5 Balanced</span>
            <span>1.0 Creative</span>
          </div>
        </div>
      </header>

      {/* Chat Window */}
      <div className="card animate-fade-up stagger-2 flex h-[34rem] flex-col overflow-hidden shadow-xl">
        {/* Top chat bar */}
        <div className="flex items-center justify-between border-b border-slate-900/5 bg-slate-50/50 px-5 py-3 dark:border-white/5 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              MindSpark — Powered by Gemini
            </span>
          </div>
          <button
            onClick={clearChat}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
            title="Reset conversation"
          >
            <RotateCcw size={13} />
            Reset Chat
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`group flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
                  m.role === 'assistant'
                    ? 'bg-gradient-to-br from-sky-400 via-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25'
                    : 'bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-md'
                }`}
              >
                {m.role === 'assistant' ? <BrainCircuit size={17} /> : <User size={17} />}
              </div>

              <div className="relative max-w-[85%] sm:max-w-[78%]">
                <div
                  className={`rounded-2xl px-4 py-3.5 leading-relaxed ${
                    m.role === 'assistant'
                      ? 'bg-violet-500/[0.08] text-slate-800 ring-1 ring-violet-500/15 backdrop-blur-sm dark:bg-white/[0.04] dark:text-slate-100 dark:ring-white/10'
                      : 'bg-gradient-to-r from-sky-500 via-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/20'
                  }`}
                >
                  {m.role === 'assistant' ? formatMessageContent(m.content) : m.content}
                </div>

                {/* Copy button for assistant responses */}
                {m.role === 'assistant' && i > 0 && (
                  <div className="mt-1 flex items-center justify-end">
                    <button
                      onClick={() => copyToClipboard(m.content, i)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-slate-400 opacity-70 transition-all hover:bg-slate-200/50 hover:text-slate-700 hover:opacity-100 dark:hover:bg-white/10 dark:hover:text-slate-200"
                    >
                      {copiedIndex === i ? (
                        <>
                          <Check size={11} className="text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking loader */}
          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25">
                <BrainCircuit size={17} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-violet-500/10 px-4 py-3.5 ring-1 ring-violet-500/15 dark:bg-white/[0.04] dark:ring-white/10">
                <Loader2 size={16} className="animate-spin text-violet-500" />
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-300">
                  MindSpark is having a big-brain moment…
                </span>
              </div>
            </div>
          )}

          {/* Error alert with friendly instructions */}
          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm dark:bg-rose-950/20">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <div className="space-y-1 text-slate-800 dark:text-slate-200">
                  <p className="font-semibold text-rose-700 dark:text-rose-300">
                    MindSpark Connection Notice
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-slate-900/5 bg-white/50 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.02]"
        >
          <div className="flex items-center gap-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Spark a question — topics, exams, timetables, anything academic…"
              className="input flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary shrink-0 !px-5"
              aria-label="Send message"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </form>
      </div>

      {/* Suggested prompt chips */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Suggested Academic Prompts
          </p>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <HelpCircle size={12} />
            Click any prompt to ask
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => send(s.prompt)}
              disabled={loading}
              className={`card card-lift animate-fade-up stagger-${Math.min(i + 1, 4)} group flex items-start gap-3 p-4 text-left disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-indigo-500/15 text-violet-600 ring-1 ring-violet-500/20 transition-all duration-200 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white dark:text-violet-300">
                <s.icon size={17} />
              </span>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                  {s.category}
                </span>
                <span className="mt-0.5 block text-xs font-bold text-slate-800 transition-colors group-hover:text-violet-600 dark:text-slate-200 dark:group-hover:text-violet-300">
                  {s.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
