import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Eye, EyeOff, LogIn, Loader2, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (username: string) => void;
  lockedUsername?: string | null; // สำหรับต่ออายุเซสชัน (ล็อกชื่อผู้ใช้เดิม)
  reason?: string | null; // ข้อความอธิบายเหตุผล เช่น เซสชันหมดอายุ
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lockedUsername,
  reason,
}) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername(lockedUsername || '');
      setPassword('');
      setError('');
      setBusy(false);
      setShowPw(false);
    }
  }, [isOpen, lockedUsername]);

  if (!isOpen) return null;

  const submit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    setBusy(true);
    setError('');
    const res = await login(username.trim(), password);
    setBusy(false);
    if (res.ok) {
      if (onSuccess) onSuccess(username.trim());
      onClose();
    } else {
      setError(res.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !busy) submit();
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-800 to-indigo-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-bold text-base font-['Prompt',sans-serif]">เข้าสู่ระบบเจ้าหน้าที่</h2>
              <p className="text-[11px] text-indigo-200/90">เฉพาะเจ้าหน้าที่ที่ได้รับสิทธิ์</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {reason && (
            <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-3 py-2">
              {reason}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-600 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span>ชื่อผู้ใช้</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onKey}
              readOnly={!!lockedUsername}
              autoFocus={!lockedUsername}
              placeholder="ชื่อผู้ใช้เจ้าหน้าที่"
              className={`w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                lockedUsername ? 'bg-stone-100 text-stone-500' : ''
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-600 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>รหัสผ่าน</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKey}
                autoFocus={!!lockedUsername}
                placeholder="รหัสผ่าน"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <div className="text-xs text-rose-600 font-medium">{error}</div>}

          <button
            onClick={submit}
            disabled={busy}
            className="w-full mt-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white font-semibold text-sm shadow-md shadow-indigo-700/25 transition disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
