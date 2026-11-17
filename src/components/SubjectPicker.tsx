import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { SUBJECTS, subjectColor } from '@/types';

const CUSTOM_KEY = 'studyspace:custom-subjects';

function loadCustomSubjects(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

interface SubjectPickerProps {
  value: string;
  onChange: (subject: string) => void;
}

export function SubjectPicker({ value, onChange }: SubjectPickerProps) {
  const [customSubjects, setCustomSubjects] = useState<string[]>(loadCustomSubjects);
  const [newSubject, setNewSubject] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const allSubjects = [...SUBJECTS, ...customSubjects];

  const addCustom = () => {
    const name = newSubject.trim();
    if (!name) {
      setError('Type a subject name first.');
      return;
    }
    if (allSubjects.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setError('That subject already exists.');
      return;
    }
    const next = [...customSubjects, name];
    setCustomSubjects(next);
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable — subject still usable this session
    }
    onChange(name);
    setNewSubject('');
    setError('');
    setAdding(false);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        {allSubjects.map((subject) => {
          const selected = subject === value;
          return (
            <button
              key={subject}
              type="button"
              onClick={() => onChange(subject)}
              aria-pressed={selected}
              className={`group flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                selected
                  ? `bg-gradient-to-r text-white shadow-md ${subjectColor(subject)}`
                  : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:ring-indigo-300'
              }`}
            >
              {subject}
              <Check
                size={12}
                strokeWidth={3}
                className={`transition-all duration-200 ${
                  selected
                    ? 'scale-100 opacity-100'
                    : 'scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-30'
                }`}
              />
            </button>
          );
        })}

        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setError('');
            }}
            className="flex items-center gap-1 rounded-full border border-dashed border-indigo-300 px-3 py-1.5 text-xs font-bold text-indigo-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-md active:scale-95"
          >
            <Plus size={12} strokeWidth={3} />
            New
          </button>
        )}
      </div>

      {adding && (
        <div className="flex items-center gap-2">
          <input
            value={newSubject}
            onChange={(e) => {
              setNewSubject(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
              if (e.key === 'Escape') setAdding(false);
            }}
            placeholder="Type a subject name…"
            className="input flex-1 py-2 text-xs"
            autoFocus
          />
          <button
            type="button"
            onClick={addCustom}
            className="btn-primary px-3 py-2 text-xs"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setError('');
            }}
            className="btn-secondary px-3 py-2 text-xs"
          >
            Cancel
          </button>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
