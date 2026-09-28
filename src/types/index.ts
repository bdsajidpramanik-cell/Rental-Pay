export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
  TENANT = 'TENANT',
}

export enum ShopStatus {
  VACANT = 'VACANT',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  INACTIVE = 'INACTIVE',
}

export enum AgreementStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRING = 'EXPIRING',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  ARCHIVED = 'ARCHIVED',
}

export enum BillStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PENDING = 'PENDING',
  PROOF_SUBMITTED = 'PROOF_SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
}

export interface Property {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
}

export interface Shop {
  id: string;
  propertyId: string;
  shopNumber: string;
  floor?: string;
  sizeSqFt?: number;
  rentAmount: number;
  status: ShopStatus;
}
