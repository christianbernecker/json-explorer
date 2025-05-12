import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'export' | 'danger';
  isDarkMode: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isDarkMode,
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}) => {
  // Basisstile für alle Buttons
  const baseStyles = 'rounded-md shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center justify-center';
  
  // Größenstile
  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-5 py-3 text-lg'
  };
  
  // Variantenstile
  const variantStyles = {
    primary: isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600',
    export: isDarkMode ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-green-500 hover:bg-green-600 text-white',
    danger: isDarkMode ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
  };
  
  // Breite
  const widthStyle = fullWidth ? 'w-full' : '';
  
  // Kombinieren der Stilklassen
  const buttonClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`;
  
  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
};

export default Button; 