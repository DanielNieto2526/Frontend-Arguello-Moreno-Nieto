import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'cancel' | 'outline' | 'pill';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  type = 'button',
  ...restProps
}: ButtonProps) {
  const classes = [
    'app-button',
    `app-button--${variant}`,
    `app-button--${size}`,
    fullWidth ? 'app-button--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...restProps}>
      {children}
    </button>
  );
}

export default Button;
