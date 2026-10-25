import React from 'react';

export default function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helperText,
  className = '',
  inputClassName = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-mute">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-[#232826] transition-colors duration-150 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 disabled:bg-stone-50 disabled:text-stone-400 ${
          error ? 'border-rose-400 ring-2 ring-rose-100' : ''
        } ${inputClassName}`}
        {...props}
      />
      {helperText && !error && <span className="text-xs text-mute">{helperText}</span>}
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </div>
  );
}
