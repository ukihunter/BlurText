// Toast notification utility matching BlurText app theme

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

const getToastStyles = (type: ToastType) => {
  const baseStyles = `
    position: fixed;
    z-index: 9999;
    padding: 12px 16px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    font-family: system-ui, -apple-system, sans-serif;
    color: white;
    max-width: 400px;
    word-wrap: break-word;
  `;

  switch (type) {
    case 'success':
      return baseStyles + `
        background: linear-gradient(135deg, #10b981, #059669);
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25);
      `;
    case 'error':
      return baseStyles + `
        background: linear-gradient(135deg, #ef4444, #dc2626);
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.25);
      `;
    case 'warning':
      return baseStyles + `
        background: linear-gradient(135deg, #f59e0b, #d97706);
        box-shadow: 0 4px 20px rgba(245, 158, 11, 0.25);
      `;
    case 'info':
    default:
      return baseStyles + `
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25);
      `;
  }
};

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
      `;
    case 'error':
      return `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      `;
    case 'warning':
      return `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
      `;
    case 'info':
    default:
      return `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>
      `;
  }
};

const getPositionStyles = (position: string) => {
  switch (position) {
    case 'top-left':
      return 'top: 20px; left: 20px; transform: translateX(-100%);';
    case 'bottom-right':
      return 'bottom: 20px; right: 20px; transform: translateX(100%);';
    case 'bottom-left':
      return 'bottom: 20px; left: 20px; transform: translateX(-100%);';
    case 'top-center':
      return 'top: 20px; left: 50%; transform: translateX(-50%) translateY(-100%);';
    case 'top-right':
    default:
      return 'top: 20px; right: 20px; transform: translateX(100%);';
  }
};

export const showToast = ({
  message,
  type = 'info',
  duration = 3000,
  position = 'top-right'
}: ToastOptions) => {
  // Remove any existing toasts of the same type to prevent spam
  const existingToasts = document.querySelectorAll(`[data-toast-type="${type}"]`);
  existingToasts.forEach(toast => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  });

  const toast = document.createElement('div');
  toast.setAttribute('data-toast-type', type);
  toast.style.cssText = getToastStyles(type) + getPositionStyles(position);
  
  toast.innerHTML = `
    ${getToastIcon(type)}
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    const finalTransform = position.includes('center') ? 'translateX(-50%) translateY(0)' : 
                          position.includes('left') ? 'translateX(0)' : 'translateX(0)';
    toast.style.transform = finalTransform;
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    const exitTransform = position.includes('center') ? 'translateX(-50%) translateY(-100%)' :
                         position.includes('left') ? 'translateX(-100%)' : 'translateX(100%)';
    toast.style.transform = exitTransform;
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, duration);
};

// Convenience functions
export const showSuccessToast = (message: string, duration?: number) => 
  showToast({ message, type: 'success', duration });

export const showErrorToast = (message: string, duration?: number) => 
  showToast({ message, type: 'error', duration });

export const showWarningToast = (message: string, duration?: number) => 
  showToast({ message, type: 'warning', duration });

export const showInfoToast = (message: string, duration?: number) => 
  showToast({ message, type: 'info', duration });
