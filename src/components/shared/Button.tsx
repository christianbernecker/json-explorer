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
  title
}) => {
  const baseClasses = [
    'rounded-md',
    'font-medium',
    'transition-colors',
    'duration-200',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    'text-white',
    variant === 'primary'
      ? isDarkMode
        ? 'bg-blue-600 hover:bg-blue-700'
        : 'bg-blue-500 hover:bg-blue-600'
      : variant === 'danger'
        ? isDarkMode
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-red-500 hover:bg-red-600'
        : variant === 'export'
          ? isDarkMode
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-green-500 hover:bg-green-600'
          : isDarkMode
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-gray-500 hover:bg-gray-600',
    size === 'sm' ? 'text-xs px-2 py-1' : size === 'lg' ? 'text-base px-4 py-2' : 'text-sm px-3 py-1.5',
    className
  ].join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      title={title}
    >
      {children}
    </button>
  );
};

export default Button;