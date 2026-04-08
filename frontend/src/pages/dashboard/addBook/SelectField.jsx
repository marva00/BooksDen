import React from 'react';

const SelectField = ({
  label,
  name,
  options,
  register,
  registerOptions = { required: true },
  error,
  helperText,
  wrapperClassName = '',
}) => {
  return (
    <div className={wrapperClassName || 'space-y-1.5'}>
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      <select
        {...register(name, registerOptions)}
        className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-300 focus:border-red-600 focus:ring-red-200'
            : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/15'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      {error && <p className="text-xs text-red-600">{error.message || 'Please select an option.'}</p>}
    </div>
  );
};

export default SelectField;