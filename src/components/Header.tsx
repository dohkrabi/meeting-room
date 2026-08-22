import React, { useState, useEffect } from 'react';
import {
  CalendarPlus,
  Building2,
  Code2,
  Sparkles,
  Info,
  RefreshCw,
  Clock,
  Bell,
  ShieldCheck,
  LogIn,
  LogOut,
  UserCircle2,
  Users,
} from 'lucide-react';
import { formatThaiDateWithDay } from '../utils/thaiDate';

interface HeaderProps {
  onOpenBook: () => void;
  onOpenGasModal: () => void;
  onOpenNotificationModal: () => void;
  onOpenRoomInfo: () => void;
  onOpenUserManagement: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isLive: boolean;
  isAuthed: boolean;
  isAdmin: boolean;
  username: string | null;
  onLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBook,
  onOpenGasModal,
  onOpenNotificationModal,
  onOpenRoomInfo,
  onOpenUserManagement,
  onRefresh,
  isLoading,
  isLive,
  isAuthed,
  isAdmin,
  username,
  onLogin,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds} น.`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = formatThaiDateWithDay(new Date());

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-700/20 shrink-0">
              <Building2 className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base md:text-lg font-bold text-stone-900 tracking-tight leading-none font-['Prompt',sans-serif]">
                  ระบบจองห้องประชุม
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  ชั้น 3
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 hidden sm:block">
                แขวงทางหลวงกระบี่ · กรมทางหลวง กระทรวงคมนาคม
              </p>
            </div>
          </div>

          {/* Center Info on Desktop: Thai Date & Time */}
          <div className="hidden lg:flex items-center space-x-4 px-4 py-1.5 rounded-full bg-stone-100/80 border border-stone-200/70 text-xs text-stone-600">
            <span className="font-medium text-stone-800">{todayStr}</span>
            <span className="w-1 h-1 rounded-full bg-stone-300"></span>
            <div className="flex items-center space-x-1.5 font-mono text-stone-700">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{currentTime}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-stone-300"></span>
            <div className="flex items-center space-x-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              ></span>
              <span className="text-[11px]">
                {isLive ? 'เชื่อมต่อ Sheets แล้ว' : 'โหมดแคช/พร้อมใช้งาน'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="รีเฟรชข้อมูล"
              className="p-2 rounded-lg text-stone-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-700' : ''}`} />
            </button>

            {/* Notification Center (admin เท่านั้น) */}
            {isAdmin && (
              <button
                onClick={onOpenNotificationModal}
                title="ระบบแจ้งเตือน 4 ระดับ (เมื่อจองสำเร็จ / 1 วัน / 1 ชม. / 30 นาที)"
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors"
              >
                <Bell className="w-3.5 h-3.5 text-indigo-700 animate-bounce" />
                <span className="hidden sm:inline">การแจ้งเตือน 4 ระดับ</span>
                <span className="sm:hidden">แจ้งเตือน</span>
              </button>
            )}

            <button
              onClick={onOpenRoomInfo}
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-stone-500" />
              <span>ข้อมูลห้อง</span>
            </button>

            {/* จัดการผู้ใช้ (admin เท่านั้น) */}
            {isAdmin && (
              <button
                onClick={onOpenUserManagement}
                className="hidden md:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-stone-500" />
                <span>จัดการผู้ใช้</span>
              </button>
            )}

            {/* Apps Script (admin เท่านั้น) */}
            {isAdmin && (
              <button
                onClick={onOpenGasModal}
                className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5 text-stone-500" />
                <span>โค้ด Apps Script</span>
              </button>
            )}

            {isAuthed ? (
              <>
                <button
                  onClick={onOpenBook}
                  className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 shadow-md shadow-indigo-700/25 transition-all transform hover:-translate-y-0.5"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>จองห้องประชุม</span>
                </button>

                {/* ชื่อผู้ใช้ + ออกจากระบบ */}
                <div className="flex items-center space-x-1.5 pl-1.5 ml-0.5 border-l border-stone-200">
                  <span className="hidden md:inline-flex items-center space-x-1 text-xs font-semibold text-stone-700">
                    <UserCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{username}</span>
                    {isAdmin && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">
                        admin
                      </span>
                    )}
                  </span>
                  <button
                    onClick={onLogout}
                    title="ออกจากระบบ"
                    className="p-2 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 shadow-md shadow-indigo-700/25 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบเจ้าหน้าที่</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
