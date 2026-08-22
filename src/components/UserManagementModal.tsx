import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, X, UserPlus, Trash2, ShieldCheck, User as UserIcon,
  Loader2, Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import { listUsers, addUser, removeUser, UserRecord } from '../services/bookingService';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string | null;
  onToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
  onToast,
}) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // add form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listUsers();
    setLoading(false);
    if (res.ok) setUsers(res.users || []);
    else onToast(res.error || 'ดึงรายชื่อไม่สำเร็จ', 'error');
  }, [onToast]);

  useEffect(() => {
    if (isOpen) {
      load();
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      setFormError('');
      setShowPw(false);
    }
  }, [isOpen, load]);

  if (!isOpen) return null;

  const handleAdd = async () => {
    setFormError('');
    if (!newUsername.trim() || !newPassword.trim()) {
      setFormError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('รหัสผ่านต้องยาวอย่างน้อย 6 ตัว');
      return;
    }
    setBusy(true);
    const res = await addUser(newUsername.trim(), newPassword, newRole);
    setBusy(false);
    if (res.ok) {
      onToast(res.updated ? `อัปเดตผู้ใช้ ${newUsername} แล้ว` : `เพิ่มผู้ใช้ ${newUsername} แล้ว`, 'success');
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      load();
    } else {
      setFormError(res.error || 'บันทึกไม่สำเร็จ');
    }
  };

  const handleRemove = async (username: string) => {
    setBusy(true);
    const res = await removeUser(username);
    setBusy(false);
    if (res.ok) {
      onToast(`ลบผู้ใช้ ${username} แล้ว`, 'success');
      load();
    } else {
      onToast(res.error || 'ลบไม่สำเร็จ', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-indigo-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <Users className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-bold text-base font-['Prompt',sans-serif]">จัดการผู้ใช้งาน</h2>
              <p className="text-[11px] text-indigo-200/90">เพิ่ม / แก้รหัส / ลบ บัญชีเจ้าหน้าที่</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Add / update form */}
          <div className="rounded-2xl border border-stone-200 p-4 space-y-3 bg-stone-50/60">
            <div className="flex items-center space-x-2 text-sm font-semibold text-stone-800">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>เพิ่มผู้ใช้ใหม่ / แก้รหัสผ่าน</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="ชื่อผู้ใช้ (a-z, 0-9, _ . -)"
                className="px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="รหัสผ่าน (≥ 6 ตัว)"
                  className="w-full px-3 py-2 pr-9 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-stone-600">สิทธิ์:</span>
              <div className="flex rounded-lg overflow-hidden border border-stone-300 text-xs">
                <button
                  onClick={() => setNewRole('user')}
                  className={`px-3 py-1.5 font-semibold transition ${
                    newRole === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-stone-600'
                  }`}
                >
                  ผู้ใช้ทั่วไป
                </button>
                <button
                  onClick={() => setNewRole('admin')}
                  className={`px-3 py-1.5 font-semibold transition ${
                    newRole === 'admin' ? 'bg-amber-500 text-white' : 'bg-white text-stone-600'
                  }`}
                >
                  admin
                </button>
              </div>
            </div>
            {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}
            <button
              onClick={handleAdd}
              disabled={busy}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold transition disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>บันทึกผู้ใช้</span>
            </button>
            <p className="text-[11px] text-stone-400">
              * ถ้าชื่อผู้ใช้มีอยู่แล้ว จะเป็นการเปลี่ยนรหัสผ่าน/สิทธิ์ของคนนั้น
            </p>
          </div>

          {/* User list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-stone-800">รายชื่อผู้ใช้ ({users.length})</span>
              <button
                onClick={load}
                className="inline-flex items-center space-x-1 text-xs text-stone-500 hover:text-indigo-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
            </div>
            {loading ? (
              <div className="py-8 text-center text-stone-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin inline" /> กำลังโหลด...
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.username}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    <div className="flex items-center space-x-2.5">
                      {u.role === 'admin' ? (
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-stone-400" />
                      )}
                      <span className="text-sm font-medium text-stone-800">{u.username}</span>
                      {u.role === 'admin' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">
                          admin
                        </span>
                      )}
                      {u.username === currentUsername && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          คุณ
                        </span>
                      )}
                    </div>
                    {u.username !== currentUsername && (
                      <button
                        onClick={() => handleRemove(u.username)}
                        disabled={busy}
                        title="ลบผู้ใช้"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
