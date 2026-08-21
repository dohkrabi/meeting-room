import React, { useEffect } from 'react';
import { Check, X, AlertTriangle, Info, HelpCircle, KeyRound } from 'lucide-react';
import { hashStr, ADMIN_PIN_HASH } from '../utils/thaiDate';

export type SwalIconType = 'success' | 'error' | 'warning' | 'info' | 'question';

export interface SwalOptions {
  id?: string;
  isOpen: boolean;
  icon?: SwalIconType;
  title: string;
  text?: string;
  html?: React.ReactNode;
  confirmButtonText?: string;
  confirmButtonColor?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue';
  showCancelButton?: boolean;
  cancelButtonText?: string;
  showDenyButton?: boolean;
  denyButtonText?: string;
  showPinInput?: boolean;
  pinPlaceholder?: string;
  onConfirm?: (pinValue?: string) => void | Promise<void>;
  onCancel?: () => void;
  onDeny?: () => void;
  onClose: () => void;
  timer?: number; // Auto close in ms
}

export interface SwalToastProps {
  isOpen: boolean;
  icon: SwalIconType;
  title: string;
  position?: 'top-end' | 'top-center' | 'bottom-end';
  onClose: () => void;
  duration?: number;
}

/**
 * Signature Animated SweetAlert2 Icon
 */
export const SwalIcon: React.FC<{ type: SwalIconType; size?: 'sm' | 'md' | 'lg' }> = ({
  type,
  size = 'lg',
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12 border-3',
    md: 'w-16 h-16 border-4',
    lg: 'w-20 h-20 border-4',
  }[size];

  if (type === 'success') {
    return (
      <div className="flex items-center justify-center my-2">
        <div
          className={`${sizeClasses} rounded-full border-emerald-500 text-emerald-500 flex items-center justify-center relative animate-in zoom-in-75 duration-300 shadow-sm`}
        >
          <div className="absolute inset-0 rounded-full bg-emerald-50/70 -z-10 animate-ping opacity-20" />
          <svg
            className="w-10 h-10 stroke-emerald-500 stroke-[3] fill-none"
            viewBox="0 0 48 48"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 24 l7 7 l14 -14"
              className="origin-center"
              style={{
                strokeDasharray: 50,
                strokeDashoffset: 0,
                animation: 'swalCheck 0.4s ease-in-out forwards',
              }}
            />
          </svg>
        </div>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="flex items-center justify-center my-2">
        <div
          className={`${sizeClasses} rounded-full border-rose-500 text-rose-500 flex items-center justify-center relative animate-in zoom-in-75 duration-300 shadow-sm`}
        >
          <div className="absolute inset-0 rounded-full bg-rose-50/70 -z-10 animate-pulse opacity-30" />
          <svg className="w-10 h-10 stroke-rose-500 stroke-[3.5] fill-none" viewBox="0 0 48 48">
            <path strokeLinecap="round" d="M16 16 L32 32 M32 16 L16 32" />
          </svg>
        </div>
      </div>
    );
  }

  if (type === 'warning') {
    return (
      <div className="flex items-center justify-center my-2">
        <div
          className={`${sizeClasses} rounded-full border-amber-500 text-amber-500 flex items-center justify-center relative animate-in zoom-in-75 duration-300 shadow-sm`}
        >
          <span className="text-3xl sm:text-4xl font-bold font-mono animate-bounce">!</span>
        </div>
      </div>
    );
  }

  if (type === 'question') {
    return (
      <div className="flex items-center justify-center my-2">
        <div
          className={`${sizeClasses} rounded-full border-indigo-500 text-indigo-500 flex items-center justify-center relative animate-in zoom-in-75 duration-300 shadow-sm`}
        >
          <HelpCircle className="w-10 h-10 stroke-[2.5]" />
        </div>
      </div>
    );
  }

  // Info
  return (
    <div className="flex items-center justify-center my-2">
      <div
        className={`${sizeClasses} rounded-full border-blue-500 text-blue-500 flex items-center justify-center relative animate-in zoom-in-75 duration-300 shadow-sm`}
      >
        <span className="text-3xl sm:text-4xl font-bold font-serif italic">i</span>
      </div>
    </div>
  );
};

/**
 * SweetAlert2 Modal Dialog Component
 */
export const SwalModal: React.FC<SwalOptions> = ({
  isOpen,
  icon = 'info',
  title,
  text,
  html,
  confirmButtonText = 'ตกลง',
  confirmButtonColor = 'indigo',
  showCancelButton = false,
  cancelButtonText = 'ยกเลิก',
  showPinInput = false,
  pinPlaceholder = 'กรอกรหัสผ่านเจ้าหน้าที่',
  onConfirm,
  onCancel,
  onClose,
  timer,
}) => {
  const [pinValue, setPinValue] = React.useState('');
  const [pinError, setPinError] = React.useState('');

  useEffect(() => {
    if (isOpen) {
      setPinValue('');
      setPinError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !timer) return;
    const timeout = setTimeout(() => {
      onClose();
    }, timer);
    return () => clearTimeout(timeout);
  }, [isOpen, timer, onClose]);

  if (!isOpen) return null;

  const btnColorClasses = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-600/30',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-600/30',
    rose: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-rose-600/30',
    amber: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-amber-600/30',
    blue: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-600/30',
  }[confirmButtonColor];

  const handleConfirmClick = () => {
    if (showPinInput) {
      if (hashStr(pinValue.trim()) !== ADMIN_PIN_HASH) {
        setPinError('รหัสผ่านไม่ถูกต้อง');
        return;
      }
    }
    if (onConfirm) {
      onConfirm(pinValue);
    } else {
      onClose();
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 flex flex-col items-center text-center border border-stone-100 animate-in zoom-in-95 fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* SweetAlert Icon */}
        <SwalIcon type={icon} size="lg" />

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-stone-800 font-['Prompt',sans-serif] mt-3 tracking-tight">
          {title}
        </h3>

        {/* Text / HTML */}
        {text && (
          <p className="text-sm text-stone-600 mt-2.5 font-normal leading-relaxed max-w-xs">
            {text}
          </p>
        )}

        {html && <div className="mt-3 w-full text-left">{html}</div>}

        {/* Optional PIN Input */}
        {showPinInput && (
          <div className="w-full mt-4 space-y-1 text-left">
            <label className="text-xs font-semibold text-stone-700 flex items-center space-x-1">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>รหัสผ่านเจ้าหน้าที่</span>
            </label>
            <input
              type="password"
              value={pinValue}
              onChange={(e) => {
                setPinValue(e.target.value);
                setPinError('');
              }}
              placeholder={pinPlaceholder}
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-stone-50"
            />
            {pinError && (
              <p className="text-xs text-rose-600 font-medium pt-1 animate-in fade-in">
                {pinError}
              </p>
            )}

          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-3 w-full mt-6">
          {showCancelButton && (
            <button
              type="button"
              onClick={handleCancelClick}
              className="flex-1 py-2.5 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-700 font-semibold text-sm transition-all shadow-xs"
            >
              {cancelButtonText}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmClick}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm shadow-md transition-all transform active:scale-98 ${btnColorClasses}`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * SweetAlert2 Toast Component (Corner Popups)
 */
export const SwalToast: React.FC<SwalToastProps> = ({
  isOpen,
  icon,
  title,
  position = 'top-end',
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const positionClasses = {
    'top-end': 'top-5 right-5',
    'top-center': 'top-5 left-1/2 -translate-x-1/2',
    'bottom-end': 'bottom-5 right-5',
  }[position];

  return (
    <div
      className={`fixed ${positionClasses} z-50 animate-in fade-in slide-in-from-top-4 duration-300`}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/80 px-4 py-3 flex items-center space-x-3 min-w-[280px] max-w-sm">
        <SwalIcon type={icon} size="sm" />
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-bold text-stone-800 font-['Prompt',sans-serif]">
            {title}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 p-1 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
