import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'export';
  isDarkMode?: boolean;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  variant = 'primary',
  isDarkMode = false,
  size = 'md',
  title,
  icon
}) => {
  // Base classes for all buttons
  const baseClasses = [
    'rounded-lg',
    'font-medium',
    'transition-all',
    'duration-200',
    'shadow-sm',
    'hover:shadow-md',
    'flex',
    'items-center',
    'justify-center',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
  ];

  // Size classes
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-1.5'
    : size === 'lg' 
      ? 'text-base px-5 py-2.5' 
      : 'text-sm px-4 py-2';

  // Variant-specific classes
  let variantClasses: string;
  
  if (variant === 'primary') {
    variantClasses = isDarkMode
      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800'
      : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700';
  } else if (variant === 'danger') {
    variantClasses = isDarkMode
      ? 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900'
      : 'bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800';
  } else if (variant === 'export') {
    variantClasses = isDarkMode
      ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800'
      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700';
  } else {
    // Secondary (outline) style
    variantClasses = isDarkMode
      ? 'border border-gray-600 bg-transparent text-gray-200 hover:bg-gray-700 hover:border-gray-500'
      : 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-400';
  }

  const allClasses = [...baseClasses, sizeClasses, variantClasses, className].join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={allClasses}
      title={title}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;