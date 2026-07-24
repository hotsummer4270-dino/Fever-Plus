export type Coach = '力王' | '花花';

export interface Member {
  id: string;
  name: string;
  phone: string;
  gender: 'male' | 'female' | 'unknown';
  avatar: string;
  joinDate: string;
  note: string;
  status: 'active' | 'inactive';
}

export interface CoursePack {
  id: string;
  name: string; // e.g., "常规力量私教课 30节"
  totalSessions: number;
  remainingSessions: number;
  purchasedSessions?: number;
  giftedSessions?: number;
  remainingPurchasedSessions?: number;
  remainingGiftedSessions?: number;
  price: number; // Receivable amount for the package
  purchaseDate: string;
  expiresAt?: string | null; // null means valid indefinitely
  memberIds: string[]; // Can be bound to multiple members (e.g. family package)
  status: 'active' | 'completed' | 'frozen' | 'refunded';
}

export interface PaymentLog {
  id: string;
  coursePackId: string;
  coursePackName: string;
  amount: number; // Actual amount received
  receivableAmount?: number;
  discountAmount?: number;
  discountReason?: string;
  payDate: string;
  payerName: string;
  paymentMethod: 'wechat' | 'alipay' | 'cash' | 'bank';
  note: string;
  receiver?: Coach; // Received by which coach
}

export interface ClassLog {
  id: string;
  memberId: string;
  memberName: string;
  coach: Coach;
  coursePackId: string;
  coursePackName: string;
  date: string; // YYYY-MM-DD HH:mm
  duration: number; // minutes, e.g., 60
  content: string; // detailed training content
  sessionCount: number; // usually 1
  deductedPurchasedSessions?: number;
  deductedGiftedSessions?: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  note?: string;
}

export interface PlanDay {
  dayTitle: string; // e.g., "D1: 胸肩推力训练"
  exercises: Exercise[];
}

export interface TrainingPlan {
  id: string;
  memberId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  days: PlanDay[];
  isActive: boolean;
}

export interface Appointment {
  id: string;
  memberId: string;
  memberName: string;
  coach: Coach;
  startAt: string;
  duration: number;
  status: 'confirmed' | 'cancelled';
  note: string;
}

export interface GymState {
  schemaVersion?: number;
  members: Member[];
  coursePacks: CoursePack[];
  paymentLogs: PaymentLog[];
  classLogs: ClassLog[];
  trainingPlans: TrainingPlan[];
  appointments: Appointment[];
}
