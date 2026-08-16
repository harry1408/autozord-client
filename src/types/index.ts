export type Role = 'GLOBAL_ADMIN' | 'SHOP_ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'RECEPTIONIST' | 'CUSTOMER';

export type ROStatus =
  | 'ESTIMATE'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'INVOICED'
  | 'CLOSED'
  | 'CANCELLED';

export type EstimateStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'DECLINED' | 'EXPIRED';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';
export type PaymentMethod = 'CASH' | 'CARD' | 'CHECK' | 'FINANCING' | 'OTHER';
export type InspectionStatus = 'IN_PROGRESS' | 'COMPLETED';
export type ItemStatus = 'OK' | 'ATTENTION' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  shopId: string | null;
  isActive: boolean;
  shopStatus?: string | null;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { vehicles: number; repairOrders: number };
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  engineSize?: string;
  mileage?: number;
  createdAt: string;
  customer?: Pick<Customer, 'firstName' | 'lastName' | 'phone'>;
  _count?: { repairOrders: number };
}

export interface LaborLine {
  id: string;
  description: string;
  hours: number;
  rate: number;
  subtotal: number;
}

export interface PartsLine {
  id: string;
  partId?: string;
  name: string;
  partNumber?: string;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  subtotal: number;
}

export interface Technician {
  id: string;
  userId: string;
  specializations?: string;
  hourlyRate: number;
  isActive: boolean;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
}

export interface RepairOrder {
  id: string;
  roNumber: string;
  customerId: string;
  vehicleId: string;
  status: ROStatus;
  promisedDate?: string;
  mileageIn?: number;
  mileageOut?: number;
  customerNotes?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Pick<Customer, 'id' | 'firstName' | 'lastName' | 'phone' | 'email'>;
  vehicle?: Pick<Vehicle, 'id' | 'make' | 'model' | 'year' | 'vin' | 'licensePlate'>;
  laborLines?: LaborLine[];
  partsLines?: PartsLine[];
  technicians?: { technician: Technician & { user: Pick<User, 'id' | 'firstName' | 'lastName'> } }[];
  statusHistory?: {
    id: string;
    fromStatus?: string;
    toStatus: string;
    note?: string;
    changedAt: string;
    changedBy: Pick<User, 'firstName' | 'lastName'>;
  }[];
  invoice?: { id: string; invoiceNumber: string; status: InvoiceStatus; total: number } | null;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  customerId: string;
  vehicleId?: string;
  status: EstimateStatus;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  customer?: Pick<Customer, 'id' | 'firstName' | 'lastName' | 'phone'>;
  laborLines?: LaborLine[];
  partsLines?: PartsLine[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  repairOrderId: string;
  customerId: string;
  status: InvoiceStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes?: string;
  dueDate?: string;
  createdAt: string;
  customer?: Pick<Customer, 'id' | 'firstName' | 'lastName' | 'phone' | 'email' | 'address'>;
  repairOrder?: RepairOrder;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  paidAt: string;
}

export interface Inspection {
  id: string;
  vehicleId: string;
  repairOrderId?: string;
  technicianId?: string;
  status: InspectionStatus;
  createdAt: string;
  vehicle?: Pick<Vehicle, 'make' | 'model' | 'year' | 'vin'>;
  technician?: Technician;
  items?: InspectionItem[];
}

export interface InspectionItem {
  id: string;
  inspectionId: string;
  category: string;
  name: string;
  status: ItemStatus;
  notes?: string;
  photos?: string;
}

export interface Part {
  id: string;
  partNumber?: string;
  name: string;
  description?: string;
  category?: string;
  unitCost: number;
  sellingPrice: number;
  quantityOnHand: number;
  minStock: number;
  supplierId?: string;
  supplier?: { name: string };
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface ShopSettings {
  id: string;
  shopName: string;
  address?: string;
  phone?: string;
  email?: string;
  taxRate: number;
  laborRate: number;
  logoUrl?: string;
  gstNumber?: string;
  pstNumber?: string;
  gstRate: number;
  pstRate: number;
  // Merged in from Shop by the server - used by the public directory and
  // inquiry filtering, not by invoice printing (that still uses `address`).
  country?: Region | null;
  state?: string | null;
  city?: string | null;
  zip?: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

export interface DashboardStats {
  openRepairOrders: number;
  vehiclesInShop: number;
  pendingEstimates: number;
  todayRevenue: number;
  overdueRepairOrders: number;
}

export type PlanType = 'LIFETIME_FREE' | 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'PENDING_VERIFICATION' | 'SUSPENDED' | 'TRIAL' | 'ACTIVE' | 'EXPIRED';
export type Region = 'CA' | 'US' | 'IN';

export interface SubscriptionInfo {
  planType: PlanType | null;
  status: SubscriptionStatus;
  daysLeft?: number;
  trialEndsAt?: string;
  paidUntil?: string;
  country?: Region | null;
  currency?: string | null;
  subscriptionPrice?: number | null;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  planType?: PlanType | null;
  isVerified?: boolean;
  trialEndsAt?: string | null;
  paidUntil?: string | null;
  country?: Region | null;
  currency?: string | null;
  subscriptionPrice?: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number; customers: number; vehicles: number; repairOrders: number };
  settings?: { logoUrl?: string | null } | null;
  status?: SubscriptionStatus;
  daysLeft?: number;
}

export type EmailCategory = 'OTP' | 'PASSWORD_RESET' | 'INVOICE' | 'REGISTRATION' | 'ACCOUNT_VERIFIED' | 'DB_DUMP' | 'GENERIC';
export type EmailStatus = 'SENT' | 'FAILED';

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  category: EmailCategory;
  status: EmailStatus;
  errorMessage?: string | null;
  createdAt: string;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  shopId: string | null;
  shop?: { id: string; name: string } | null;
}

export interface ShopLogoHistoryEntry {
  id: string;
  logoUrl: string;
  createdAt: string;
}

export interface ShopDetail {
  shop: Shop;
  users: Pick<AdminUserSummary, 'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'isActive' | 'createdAt'>[];
  stats: {
    customerCount: number;
    vehicleCount: number;
    repairOrderCount: number;
    openRepairOrderCount: number;
    totalRevenue: number;
  };
}

export interface PublicShop {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: Region;
  phone?: string;
}

export type InquiryStatus = 'NEW' | 'VIEWED' | 'RESPONDED' | 'DECLINED';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vehicleInfo?: string;
  message: string;
  createdAt: string;
}

export interface InquiryShop {
  id: string;
  inquiryId: string;
  shopId: string;
  status: InquiryStatus;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  inquiry: Inquiry;
  shop?: { id: string; name: string };
}
