'use client';

import { Input } from './input';
import { Textarea } from './textarea';

interface I18nFieldProps {
  label: string;
  name: string;
  values: { en: string; hi: string };
  onChange: (lang: string, value: string) => void;
  multiline?: boolean;
  required?: boolean;
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
];

export function I18nField({ label, name, values, onChange, multiline = false, required = false }: I18nFieldProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {languages.map((lang) => {
          const Component = multiline ? Textarea : Input;
          return (
            <Component
              key={lang.code}
              id={`${name}-${lang.code}`}
              label={lang.label}
              value={(values as Record<string, string>)[lang.code] || ''}
              onChange={(e) => onChange(lang.code, e.target.value)}
              required={required}
              placeholder={`${label} in ${lang.label}`}
            />
          );
        })}
      </div>
    </div>
  );
}
