import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  $variant?: string;
};

export const Button = ({ children, className, $variant, ...rest }: ButtonProps) => {
  const variantClass = $variant ? `btn--${$variant}` : '';
  return (
    // note: do NOT spread `$variant` into the DOM — it's used only for styling
    <button {...rest} className={`btn ${variantClass} ${className || ''}`.trim()}>
      {children}
    </button>
  );
};

export default Button;













