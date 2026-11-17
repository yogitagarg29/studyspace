import { Check } from 'lucide-react';
import { SUBJECTS, subjectColor } from '@/types';

interface SubjectPickerProps {
  value: string;
  onChange: (subject: string) => void;
}

export function SubjectPicker({ value, onChange }: SubjectPickerProps) {
  return (
    <div
      role="listbox"
      aria-label="Subject"
      className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3"
    >
      {SUBJECTS.map((subject) => {
        const selected = subject === value;
        return (
          <button
            key={subject}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onChange(subject)}
            className={`group relative flex items-center justify-between gap-1 rounded-xl px-3 py-2 text-left text-xs font-bold transition-all duration-200 active:scale-95 ${
              selected
                ? `bg-gradient-to-r text-white shadow-md ${subjectColor(subject)}`
                : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:ring-indigo-300'
            }`}
          >
            <span className="truncate">{subject}</span>
            <Check
              size={13}
              strokeWidth={3}
              className={`shrink-0 transition-all duration-200 ${
                selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-30'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
