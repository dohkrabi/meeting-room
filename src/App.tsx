import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ListFilter,
  Building2,
  CalendarPlus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bell,
  Sparkles,
} from 'lucide-react';
import { Booking } from './types';
import {
  fetchBookings,
  createBooking,
  updateBooking,
  cancelOrDeleteBooking,
} from './services/bookingService';
import { Header } from './components/Header';
import { RoomHero } from './components/RoomHero';
import { CalendarView } from './components/CalendarView';
import { TimelineDayView } from './components/TimelineDayView';
import { BookingCardList } from './components/BookingCardList';
import { BookingModal } from './components/BookingModal';
import { ActionAuthModal } from './components/ActionAuthModal';
import { DayDetailModal } from './components/DayDetailModal';
import { LineInviteModal } from './components/LineInviteModal';
import { GasSetupModal } from './components/GasSetupModal';
import { RoomFacilitiesModal } from './components/RoomFacilitiesModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { useAuth } from './context/AuthContext';
import { SwalModal, SwalToast, SwalOptions, SwalIconType } from './components/SweetAlert';

export default function App() {
  const { isAuthed, isAdmin, username, expiresAt, logout } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'timeline' | 'list'>('calendar');

  // Login modal
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginLockedUser, setLoginLockedUser] = useState<string | null>(null);
  const [loginReason, setLoginReason] = useState<string | null>(null);
  const [expiryWarned, setExpiryWarned] = useState(false);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [initialBookDate, setInitialBookDate] = useState<string | undefined>(undefined);
  const [initialBookStartTime, setInitialBookStartTime] = useState<string | undefined>(undefined);

  const [selectedDayForModal, setSelectedDayForModal] = useState<string | null>(null);

  const [actionType, setActionType] = useState<'edit' | 'cancel' | 'delete' | null>(null);
  const [actionTargetBooking, setActionTargetBooking] = useState<Booking | null>(null);

  const [lineInviteBooking, setLineInviteBooking] = useState<Booking | null>(null);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isRoomInfoOpen, setIsRoomInfoOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationModalBooking, setNotificationModalBooking] = useState<Booking | null>(null);

  // SweetAlert2 Dialog State
  const [swalState, setSwalState] = useState<SwalOptions>({
    isOpen: false,
    title: '',
    onClose: () => setSwalState((prev) => ({ ...prev, isOpen: false })),
  });

  // SweetAlert2 Toast State
  const [toastState, setToastState] = useState<{
    isOpen: boolean;
    icon: SwalIconType;
    title: string;
  }>({
    isOpen: false,
    icon: 'success',
    title: '',
  });

  const showToast = (title: string, icon: SwalIconType = 'success') => {
    setToastState({ isOpen: true, icon, title });
  };

  const fireSwal = (options: Partial<SwalOptions>) => {
    setSwalState({
      isOpen: true,
      title: options.title || '',
      text: options.text,
      html: options.html,
      icon: options.icon || 'info',
      confirmButtonText: options.confirmButtonText || 'ตกลง',
      confirmButtonColor: options.confirmButtonColor || 'indigo',
      showCancelButton: options.showCancelButton || false,
      cancelButtonText: options.cancelButtonText || 'ยกเลิก',
      showPinInput: options.showPinInput || false,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      timer: options.timer,
      onClose: () => {
        setSwalState((prev) => ({ ...prev, isOpen: false }));
        if (options.onClose) options.onClose();
      },
    });
  };

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetchBookings();
      setBookings(res.data);
      setIsLive(res.isLive);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // B2: เตือนก่อนเซสชันหมด 5 นาที + ต่ออายุ / ออกจากระบบเมื่อหมด
  useEffect(() => {
    if (!isAuthed || !expiresAt) return;
    setExpiryWarned(false);
    const timer = setInterval(() => {
      const msLeft = expiresAt - Date.now();
      if (msLeft <= 0) {
        logout();
        showToast('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 'warning');
      } else if (msLeft <= 5 * 60 * 1000 && !expiryWarned) {
        setExpiryWarned(true);
        const currentUser = username;
        fireSwal({
          icon: 'warning',
          title: 'เซสชันใกล้หมดอายุ',
          text: 'อีกประมาณ 5 นาทีเซสชันของคุณจะหมดอายุ ต้องการต่ออายุการใช้งานหรือไม่?',
          confirmButtonText: 'ต่ออายุเซสชัน',
          confirmButtonColor: 'indigo',
          showCancelButton: true,
          cancelButtonText: 'ออกจากระบบ',
          onConfirm: () => {
            setLoginLockedUser(currentUser);
            setLoginReason('ยืนยันรหัสผ่านอีกครั้งเพื่อต่ออายุเซสชัน');
            setLoginOpen(true);
          },
          onCancel: () => logout(),
        });
      }
    }, 15 * 1000);
    return () => clearInterval(timer);
  }, [isAuthed, expiresAt, username, logout, expiryWarned]);

  // เปิดหน้า login (ใช้เมื่อยังไม่ได้ล็อกอินแล้วพยายามกระทำการ)
  const promptLogin = (reason?: string) => {
    setLoginLockedUser(null);
    setLoginReason(reason || 'กรุณาเข้าสู่ระบบเจ้าหน้าที่ก่อนดำเนินการ');
    setLoginOpen(true);
  };

  // ครอบ action ที่ต้องล็อกอิน: ถ้ายังไม่ล็อกอิน → เด้ง login แทน
  const requireAuth = (fn: () => void) => {
    if (!isAuthed) {
      promptLogin();
      return;
    }
    fn();
  };

  // ครอบ action ที่ต้องเป็น admin เท่านั้น
  const requireAdmin = (fn: () => void) => {
    if (!isAuthed) {
      promptLogin('กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแล (admin)');
      return;
    }
    if (!isAdmin) {
      showToast('เฉพาะผู้ดูแลระบบ (admin) เท่านั้น', 'warning');
      return;
    }
    fn();
  };

  // Handlers
  const handleOpenBookModal = (dateStr?: string, suggestedStart?: string) => {
    requireAuth(() => {
      setInitialBookDate(dateStr);
      setInitialBookStartTime(suggestedStart);
      setIsBookModalOpen(true);
    });
  };

  const handleSaveNewBooking = async (
    bookingData: Omit<Booking, 'row' | 'status'>
  ): Promise<boolean> => {
    const res = await createBooking(bookingData);
    if (res.ok) {
      fireSwal({
        icon: 'success',
        title: 'จองห้องประชุมสำเร็จ!',
        text: 'ระบบได้บันทึกข้อมูลและส่งแจ้งเตือนเข้าสู่กลุ่ม LINE แขวงทางหลวงกระบี่เรียบร้อยแล้ว',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: 'emerald',
      });
      await loadData(true);
      return true;
    } else {
      fireSwal({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการจอง',
        text: res.error || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: 'rose',
      });
      return false;
    }
  };

  const handleOpenAction = (action: 'edit' | 'cancel' | 'delete', booking: Booking) => {
    requireAuth(() => {
      setActionType(action);
      setActionTargetBooking(booking);
    });
  };

  const handleConfirmCancelOrDelete = async (
    action: 'cancel' | 'delete',
    target: Booking
  ): Promise<boolean> => {
    const res = await cancelOrDeleteBooking(action, target.row, target.id);
    if (res.ok) {
      showToast(
        action === 'cancel' ? 'ยกเลิกการจองสำเร็จ' : 'ลบรายการจองสำเร็จแล้ว',
        'success'
      );
      await loadData(true);
      return true;
    } else {
      fireSwal({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: res.error || 'ไม่สามารถทำรายการได้',
        confirmButtonColor: 'rose',
      });
      return false;
    }
  };

  const handleConfirmEdit = async (updated: Booking): Promise<boolean> => {
    const res = await updateBooking(updated);
    if (res.ok) {
      fireSwal({
        icon: 'success',
        title: 'บันทึกการแก้ไขสำเร็จ!',
        text: 'ข้อมูลการจองห้องประชุมได้รับการอัปเดตเรียบร้อยแล้ว',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: 'indigo',
      });
      await loadData(true);
      return true;
    } else {
      fireSwal({
        icon: 'error',
        title: 'แก้ไขไม่สำเร็จ',
        text: res.error || 'กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: 'rose',
      });
      return false;
    }
  };

  const handleOpenNotificationModalWith = (booking?: Booking) => {
    requireAdmin(() => {
      setNotificationModalBooking(booking || (bookings.length > 0 ? bookings[0] : null));
      setIsNotificationModalOpen(true);
    });
  };

  const handleOpenGasModal = () => {
    requireAdmin(() => setIsGasModalOpen(true));
  };

  const handleOpenUserManagement = () => {
    requireAdmin(() => setUserMgmtOpen(true));
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-['Sarabun',sans-serif]">
      {/* SweetAlert2 Toast */}
      <SwalToast
        isOpen={toastState.isOpen}
        icon={toastState.icon}
        title={toastState.title}
        position="top-end"
        onClose={() => setToastState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* SweetAlert2 Global Dialog */}
      <SwalModal {...swalState} />

      {/* Main App Header */}
      <Header
        onOpenBook={() => handleOpenBookModal()}
        onOpenGasModal={handleOpenGasModal}
        onOpenNotificationModal={() => handleOpenNotificationModalWith()}
        onOpenRoomInfo={() => setIsRoomInfoOpen(true)}
        onOpenUserManagement={handleOpenUserManagement}
        onRefresh={() => {
          loadData();
          showToast('รีเฟรชข้อมูลล่าสุดเรียบร้อย', 'info');
        }}
        isLoading={isLoading}
        isLive={isLive}
        isAuthed={isAuthed}
        isAdmin={isAdmin}
        username={username}
        onLogin={() => {
          setLoginLockedUser(null);
          setLoginReason(null);
          setLoginOpen(true);
        }}
        onLogout={() => {
          logout();
          showToast('ออกจากระบบเรียบร้อย', 'info');
        }}
      />

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Room Status & Information Hero Banner */}
        <RoomHero
          bookings={bookings}
          onOpenBook={() => handleOpenBookModal()}
          onOpenRoomInfo={() => setIsRoomInfoOpen(true)}
        />

        {/* 4-Stage Notification Ribbon (admin เท่านั้น) */}
        {isAdmin && (
        <div className="mb-6 bg-linear-to-r from-indigo-900 via-indigo-800 to-stone-900 text-white rounded-3xl p-4 sm:p-5 shadow-md border border-indigo-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/15 shadow-inner">
              <Bell className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm font-['Prompt',sans-serif]">
                  ระบบแจ้งเตือนอัตโนมัติ 4 ระดับ (LINE Notification)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold">
                  เปิดใช้งาน
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 mt-0.5">
                1. เมื่อจองสำเร็จ · 2. ล่วงหน้า 1 วัน · 3. ล่วงหน้า 1 ชม. · 4. ล่วงหน้า 30 นาที
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={() => handleOpenNotificationModalWith()}
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-98 text-white font-semibold text-xs border border-white/20 transition flex items-center space-x-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ดูข้อความ & ทดสอบส่ง</span>
            </button>
          </div>
        </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="inline-flex p-1 rounded-2xl bg-stone-200/80 border border-stone-300/60 shadow-xs self-start">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>ปฏิทินรายเดือน</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>ไทม์ไลน์รายชั่วโมง</span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>รายการจองทั้งหมด ({bookings.length})</span>
            </button>
          </div>

          <div className="text-xs text-stone-500 hidden sm:block">
            ระบบอัปเดตอัตโนมัติทุก 3 นาที
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'calendar' && (
          <CalendarView
            bookings={bookings}
            onSelectDate={(dateStr) => setSelectedDayForModal(dateStr)}
            onBookOnDate={(dateStr) => handleOpenBookModal(dateStr)}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineDayView
            bookings={bookings}
            onBookOnDate={(dateStr, suggestedStart) => handleOpenBookModal(dateStr, suggestedStart)}
            onOpenAction={handleOpenAction}
          />
        )}

        {activeTab === 'list' && (
          <BookingCardList
            bookings={bookings}
            onOpenAction={handleOpenAction}
            onOpenLineInvite={(b) => setLineInviteBooking(b)}
            onOpenBook={() => handleOpenBookModal()}
            onOpenNotificationModalWithBooking={(b) => handleOpenNotificationModalWith(b)}
          />
        )}

        {/* Bottom CTA Banner */}
        <div className="mt-8 rounded-3xl bg-linear-to-r from-indigo-800 to-indigo-900 text-white p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold font-['Prompt',sans-serif]">
              ต้องการจองห้องประชุมสำหรับการประชุมครั้งถัดไป?
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100/90 max-w-xl font-light">
              สามารถกรอกแบบฟอร์มเพื่อตรวจสอบเวลาว่างและบันทึกการจองได้ทันที
              ระบบจะส่งสัญญาณยืนยันไปยัง LINE กลุ่มงานของแขวงทางหลวงกระบี่ทันที
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => handleOpenNotificationModalWith()}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm border border-white/20 transition flex items-center space-x-1.5"
            >
              <Bell className="w-4 h-4 text-amber-300" />
              <span>ระบบแจ้งเตือน 4 ระดับ</span>
            </button>
            <button
              onClick={() => handleOpenBookModal()}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs sm:text-sm hover:bg-indigo-50 active:scale-98 transition shadow-md flex items-center space-x-2"
            >
              <CalendarPlus className="w-4 h-4 text-indigo-700" />
              <span>กรอกแบบฟอร์มจอง</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-700" />
            <span className="font-semibold text-stone-700">แขวงทางหลวงกระบี่</span>
            <span>·</span>
            <span>กรมทางหลวง กระทรวงคมนาคม</span>
          </div>

          <div className="flex items-center space-x-4">
            {isAdmin && (
              <button
                onClick={() => handleOpenNotificationModalWith()}
                className="hover:text-indigo-700 underline transition"
              >
                การแจ้งเตือน 4 ระดับ
              </button>
            )}
            {isAdmin && (
              <button
                onClick={handleOpenGasModal}
                className="hover:text-indigo-700 underline transition"
              >
                การตั้งค่า Apps Script
              </button>
            )}
            <button
              onClick={() => setIsRoomInfoOpen(true)}
              className="hover:text-indigo-700 underline transition"
            >
              ข้อปฏิบัติการใช้ห้อง
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BookingModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSave={handleSaveNewBooking}
        existingBookings={bookings}
        initialDate={initialBookDate}
        initialStartTime={initialBookStartTime}
      />

      <ActionAuthModal
        isOpen={!!actionType}
        onClose={() => {
          setActionType(null);
          setActionTargetBooking(null);
        }}
        action={actionType}
        booking={actionTargetBooking}
        onConfirmCancelOrDelete={handleConfirmCancelOrDelete}
        onConfirmEdit={handleConfirmEdit}
      />

      <DayDetailModal
        isOpen={!!selectedDayForModal}
        onClose={() => setSelectedDayForModal(null)}
        dateStr={selectedDayForModal}
        bookings={bookings}
        onBookOnDate={(d) => handleOpenBookModal(d)}
        onOpenLineInvite={(b) => setLineInviteBooking(b)}
        onOpenAction={handleOpenAction}
      />

      <LineInviteModal
        isOpen={!!lineInviteBooking}
        onClose={() => setLineInviteBooking(null)}
        booking={lineInviteBooking}
      />

      <GasSetupModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        onRefresh={loadData}
      />

      <RoomFacilitiesModal
        isOpen={isRoomInfoOpen}
        onClose={() => setIsRoomInfoOpen(false)}
        onOpenBook={() => handleOpenBookModal()}
        isAdmin={isAdmin}
        onToast={showToast}
      />

      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        sampleBooking={notificationModalBooking}
      />

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        lockedUsername={loginLockedUser}
        reason={loginReason}
        onSuccess={(u) => {
          showToast(`เข้าสู่ระบบสำเร็จ · ${u}`, 'success');
          setExpiryWarned(false);
        }}
      />

      <UserManagementModal
        isOpen={userMgmtOpen}
        onClose={() => setUserMgmtOpen(false)}
        currentUsername={username}
        onToast={showToast}
      />
    </div>
  );
}
