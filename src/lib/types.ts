export type Role = "Admin" | "Fleet Manager" | "Driver" | "Safety Officer" | "Financial Analyst";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
}

export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export interface VehicleDocument {
  id: string;
  name: string;
  type: "Insurance" | "Registration" | "Inspection" | "Permit" | "Other";
  expiryDate: string;
}
export interface Vehicle {
  id: string;
  regNumber: string;
  name: string;
  type: string;
  maxLoadKg: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string;
  createdAt: string;
  documents?: VehicleDocument[];
  lastServiceOdometer?: number;
  serviceIntervalKm?: number; // default 10000
}

export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  phone: string;
  safetyScore: number;
  status: DriverStatus;
  createdAt: string;
}

export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  actualDistanceKm?: number;
  fuelConsumedL?: number;
  revenue?: number;
  status: TripStatus;
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
}

export type MaintenanceStatus = "Open" | "Closed";
export interface Maintenance {
  id: string;
  vehicleId: string;
  type: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  openedAt: string;
  closedAt?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
}

export type ExpenseCategory = "Toll" | "Maintenance" | "Insurance" | "Misc";
export interface Expense {
  id: string;
  vehicleId?: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
  date: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  at: string;
}
