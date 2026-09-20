import React from 'react';
import './Button.css';

export const Button = ({ children, onClick, type = 'button', variant = 'primary' }) => {
  return (
    <button type={type} className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
};
