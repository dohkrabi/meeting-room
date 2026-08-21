export interface Booking {
  row?: number;
  id?: string;
  name: string;
  dept: string;
  date: string; // YYYY-MM-DD
  time_start: string; // HH:MM
  time_end: string; // HH:MM
  topic: string;
  attendees: number | string;
  equipment?: string;
  use_zoom?: boolean;
  zoom_url?: string;
  meeting_id?: string;
  passcode?: string;
  note?: string;
  status: 'จอง' | 'ชนกัน' | 'ยกเลิก' | 'เสร็จสิ้น';
  timestamp?: string;
  sent_ok?: boolean;
  sent_1day?: boolean;
  sent_1hr?: boolean;
  sent_30min?: boolean;
}

export const DEPARTMENTS = [
  'งานสารบรรณ',
  'งานพัสดุและสัญญา',
  'งานสารสนเทศ',
  'งานการเงินและบัญชี',
  'งานแผนงาน',
  'งานควบคุมงาน',
  'งานไฟฟ้า',
  'งานปรับซ่อม',
  'งานอำนวยความปลอดภัย',
  'หมวดทางหลวงอ่าวนาง',
  'หมวดทางหลวงอาวุโสกระบี่',
  'หมวดทางหลวงเขาพนม',
  'หมวดทางหลวงคลองท่อม',
  'หมวดทางหลวงห้วยน้ำขาว',
  'หมวดทางหลวงทรายขาว',
  'ฝ่ายบริหารงานทั่วไป',
  'ฝ่ายวิศวกรรม',
] as const;

export const EQUIPMENT_OPTIONS = [
  'โปรเจกเตอร์ & จอรับภาพ 120 นิ้ว',
  'ไมโครโฟนตั้งโต๊ะ / ไมค์ลอย',
  'เครื่องเสียง & ลำโพง',
  'กระดานไวท์บอร์ด & ปากกา',
  'โทรทัศน์ Smart TV 65 นิ้ว',
  'ชุดโต๊ะจัดเลี้ยงอาหารว่าง/เบรค',
  'ปลั๊กพ่วงสายไฟสำหรับโน้ตบุ๊ก',
  'กล้อง Web Conference สำหรับ Zoom',
] as const;

export interface RoomDetails {
  name: string;
  building: string;
  floor: string;
  capacity: string;
  features: string[];
  contact: string;
}

export const ROOM_INFO: RoomDetails = {
  name: 'ห้องประชุมกลาง แขวงทางหลวงกระบี่',
  building: 'อาคารสำนักงานแขวงทางหลวงกระบี่',
  floor: 'ชั้น 3',
  capacity: '20 – 30 ที่นั่ง (จัดแบบ Conference / U-Shape)',
  features: [
    'เครื่องปรับอากาศ 2 เครื่อง',
    'จอโปรเจกเตอร์ความละเอียดสูง 120"',
    'ระบบเสียงและไมโครโฟนไร้สาย',
    'รองรับ Zoom / Google Meet / MS Teams',
    'Wi-Fi อินเทอร์เน็ตความเร็วสูง',
    'จุดบริการน้ำดื่มและอาหารว่างด้านหน้าห้อง',
  ],
  contact: 'งานสารสนเทศ / งานสารบรรณ แขวงทางหลวงกระบี่',
};

export interface NotificationRule {
  id: 'on_book' | '1_day' | '1_hour' | '30_min';
  title: string;
  timing: string;
  description: string;
  badgeColor: string;
  icon: string;
}

export const NOTIFICATION_RULES: NotificationRule[] = [
  {
    id: 'on_book',
    title: 'เมื่อจองสำเร็จ',
    timing: 'ทันทีที่บันทึกการจอง',
    description: 'ส่งข้อความยืนยันการจอง สรุปหัวข้อ วัน-เวลา ผู้จอง และอุปกรณ์ เข้า LINE กลุ่มงานทันที',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: 'CheckCircle2',
  },
  {
    id: '1_day',
    title: 'ล่วงหน้า 1 วัน',
    timing: '24 ชั่วโมงก่อนเริ่มการประชุม (1440 นาที)',
    description: 'ส่งข้อความเตือนความจำล่วงหน้า 1 วัน เพื่อให้เตรียมเอกสารและผู้เข้าร่วมประชุมทราบ',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: 'Bell',
  },
  {
    id: '1_hour',
    title: 'ล่วงหน้า 1 ชม.',
    timing: '60 นาทีก่อนเริ่มการประชุม',
    description: 'แจ้งเตือน 1 ชั่วโมงก่อนเริ่มประชุม พร้อมส่งลิงก์ Zoom, Meeting ID และ Passcode',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: 'Clock',
  },
  {
    id: '30_min',
    title: 'ล่วงหน้า 30 นาที',
    timing: '30 นาทีก่อนเริ่มการประชุม',
    description: 'แจ้งเตือนด่วน 30 นาทีก่อนเริ่ม เพื่อให้เจ้าหน้าที่เปิดแอร์ เครื่องเสียง และเตรียมพร้อมระบบ',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: 'AlertCircle',
  },
];
