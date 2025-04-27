//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import styled from 'styled-components';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 5000 }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to complete before removing
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <StyledToast 
      className={`toast ${type} ${isVisible ? 'visible' : 'hidden'}`}
      role="alert"
    >
      <div className="icon">{getIcon()}</div>
      <div className="message">{message}</div>
      <button className="close-btn" onClick={() => setIsVisible(false)}>
        <X className="h-4 w-4" />
      </button>
    </StyledToast>
  );
};

const StyledToast = styled.div`
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 16px;
  padding: 12px 16px;
  transition: all 0.3s ease;
  overflow: hidden;
  max-width: 450px;
  width: 100%;
  position: relative;

  &.hidden {
    transform: translateX(100%);
    opacity: 0;
  }

  &.visible {
    transform: translateX(0);
    opacity: 1;
  }

  &.success {
    border-left: 4px solid #10b981;
  }

  &.error {
    border-left: 4px solid #ef4444;
  }

  &.info {
    border-left: 4px solid #8b5cf6;
  }

  .icon {
    margin-right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .message {
    flex: 1;
    font-size: 0.9rem;
    color: #374151;
  }

  .close-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    padding: 4px;
    border-radius: 4px;
    margin-left: 8px;
    transition: all 0.2s;

    &:hover {
      background-color: #f3f4f6;
      color: #4b5563;
    }
  }
`;

export default Toast; 