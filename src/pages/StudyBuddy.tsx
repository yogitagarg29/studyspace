import { useState } from 'react';
import { Bot, Sparkles, Send, User, Loader2, BookOpen } from 'lucide-react';

type Role = 'user' | 'assistant';

interface ChatMessage {
  role: Role;
  content: string;
}

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: "Hey! I'm StudyBuddy AI. What are we learning today?",
};

const SUGGESTIONS = [
  {
    label: 'Explain a difficult topic',
    icon: BookOpen,
    prompt: 'Explain a difficult topic from my course in simple words with an example.',
  },
  {
    label: 'Create my study timetable',
    icon: Sparkles,
    prompt: 'Create a weekly study timetable for me. I am a college student.',
  },
  {
    label: 'Help me prepare for exams',
    icon: BookOpen,
    prompt: 'Help me prepare for my upcoming exams with a clear plan.',
  },
  {
    label: 'Generate practice questions',
    icon: Sparkles,
    prompt: 'Generate practice questions on a topic I am studying.',
  },
];

const ERROR_MESSAGES: Record<string, string> = {
  no_api_key:
    'StudyBuddy AI is not connected yet — the GEMINI_API_KEY secret is missing from the backend.',
  invalid_key:
    'The API key was rejected. Please check that GEMINI_API_KEY is a valid Google Gemini key.',
  rate_limited:
    'StudyBuddy is getting a lot of requests right now. Please wait a moment and try again.',
  server_error: 'The AI service had a hiccup. Please try again in a little while.',
  network_error: 'I could not reach the server. Please check your connection and try again.',
};

const ENV = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
const FUNCTION_URL = `${ENV.VITE_SUPABASE_URL}/functions/v1/studybuddy-ai`;

export function StudyBuddy() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [temperature, setTemperature] = useState(0.7);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;
    setInput('');
    setError('');
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ENV.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: next, temperature }),
      });
      const data = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null;
      if (!res.ok || !data || data.error || !data.reply) {
        setError(
          ERROR_MESSAGES[data?.error ?? ''] ?? 'Something went wrong. Please try again.',
        );
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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="page-title flex items-center gap-3">
            <span className="grad-icon h-11 w-11 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 shadow-violet-500/30">
              <Bot size={22} />
            </span>
            StudyBuddy AI
          </h1>
          <p className="page-subtitle">
            Your academic study companion — concepts, timetables, exams and practice questions.
          </p>
        </div>
        <div className="card animate-fade-up stagger-1 w-full px-5 py-4 sm:w-72">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="muted">Creativity</span>
            <span className="text-violet-600 dark:text-violet-300">{temperature.toFixed(1)}</span>
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
          <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>
      </header>

      {/* Chat window */}
      <div className="card animate-fade-up stagger-2 flex h-[32rem] flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  m.role === 'assistant'
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/25'
                    : 'bg-gradient-to-br from-slate-400 to-slate-500 text-white dark:from-slate-600 dark:to-slate-700'
                }`}
              >
                {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'assistant'
                    ? 'bg-violet-500/10 text-slate-800 ring-1 ring-violet-500/15 dark:text-slate-100'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/25">
                <Bot size={16} />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl bg-violet-500/10 px-4 py-3.5 ring-1 ring-violet-500/15">
                <Loader2 size={16} className="animate-spin text-violet-500" />
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-300">
                  StudyBuddy is thinking…
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-400">
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-slate-900/5 p-4 dark:border-white/10"
        >
          <div className="flex items-center gap-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any topic, exam or study plan…"
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary shrink-0 !px-4"
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Suggested prompts */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => send(s.prompt)}
            disabled={loading}
            className={`card card-lift animate-fade-up stagger-${Math.min(i + 1, 4)} flex items-center gap-3 px-4 py-3.5 text-left disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/15 to-indigo-500/15 text-violet-500 ring-1 ring-violet-500/20 dark:text-violet-300">
              <s.icon size={17} />
            </span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
