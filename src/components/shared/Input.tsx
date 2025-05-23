import React, { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface BaseInputProps {
  isDarkMode: boolean;
  label?: string;
  error?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'search';
}

interface TextInputProps extends BaseInputProps, InputHTMLAttributes<HTMLInputElement> {
  type?: 'text' | 'search' | 'number' | 'email' | 'password';
  multiline?: false;
}

interface TextareaProps extends BaseInputProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  multiline: true;
  rows?: number;
}

type InputProps = TextInputProps | TextareaProps;

// Generische Input-Komponente mit forwardRef für Referenzzugriff
const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>((props, ref) => {
  const {
    isDarkMode,
    label,
    error,
    fullWidth = false,
    variant = 'default',
    className = '',
    multiline,
    ...inputProps
  } = props;

  // Basisstile für alle Eingabeelemente
  const baseStyles = `rounded border focus:ring-2 focus:outline-none transition-colors
    ${isDarkMode 
      ? 'bg-gray-700 border-gray-600 focus:ring-blue-500 text-gray-100' 
      : 'bg-white border-gray-300 focus:ring-blue-400 text-gray-800'}
    ${error 
      ? isDarkMode ? 'border-red-500' : 'border-red-500' 
      : ''}
    ${fullWidth ? 'w-full' : ''}`;

  // Variantenstile
  const variantStyles = {
    default: 'px-3 py-2',
    search: 'pl-9 pr-3 py-2' // Platz für Such-Icon links
  };

  // Kombinierte Stilklassen
  const inputClasses = `${baseStyles} ${variantStyles[variant]} ${className}`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label 
          className={`block mb-1 font-medium text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {variant === 'search' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg 
              className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        )}
        
        {multiline ? (
          <textarea
            {...(inputProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            className={inputClasses}
            rows={(props as TextareaProps).rows || 4}
          />
        ) : (
          <input
            {...(inputProps as InputHTMLAttributes<HTMLInputElement>)}
            ref={ref as React.RefObject<HTMLInputElement>}
            className={inputClasses}
            type={(props as TextInputProps).type || 'text'}
          />
        )}
      </div>

      {error && (
        <p className={`mt-1 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </p>
      )}
    </div>
  );
});

// Display-Name für DevTools und Warnungen
Input.displayName = 'Input';

export default Input; 