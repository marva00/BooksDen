import React from 'react';

const InputField = ({
  label,
  name,
  type = 'text',
  register,
  placeholder,
  registerOptions = { required: true },
  error,
  helperText,
  wrapperClassName = '',
}) => {
  const sharedClassName = `w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 ${
    error
      ? 'border-red-300 focus:border-red-600 focus:ring-red-200'
      : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/15'
  }`;

  if (type === 'textarea') {
    return (
      <div className={wrapperClassName || 'space-y-1.5'}>
        <label className="block text-sm font-semibold text-slate-700">{label}</label>
        <textarea
          {...register(name, registerOptions)}
          className={`${sharedClassName} min-h-[7.5rem] resize-y`}
          placeholder={placeholder}
        />
        {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
        {error && <p className="text-xs text-red-600">{error.message || 'This field is required.'}</p>}
      </div>
    );
  }

  return (
    <div className={wrapperClassName || 'space-y-1.5'}>
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        {...register(name, registerOptions)}
        className={sharedClassName}
        placeholder={placeholder}
      />
      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      {error && <p className="text-xs text-red-600">{error.message || 'This field is required.'}</p>}
    </div>
  );
};

export default InputField;