import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  isDarkMode?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = '',
  type = 'button',
  isDarkMode = false,
  variant = 'primary',
  size = 'md',
  disabled = false,
}) => {
  const baseStyles = 'font-medium rounded-lg transition-colors duration-200 focus:outline-none';
  
  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }[size];
  
  const variantStyles = {
    primary: isDarkMode
      ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400'
      : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300',
    secondary: isDarkMode
      ? 'bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-400'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400',
    outline: isDarkMode
      ? 'border border-blue-500 text-blue-500 hover:bg-blue-800 hover:bg-opacity-10 disabled:text-blue-300 disabled:border-blue-300'
      : 'border border-blue-500 text-blue-500 hover:bg-blue-100 disabled:text-blue-300 disabled:border-blue-300',
  }[variant];
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
    >
      {children}
    </button>
  );
};

export { Button };
export default Button; 