import type {
  User, Vehicle, Driver, Trip, Maintenance, FuelLog, Expense, AuditLog,
} from "./types";

const now = () => new Date().toISOString();
const daysFromNow = (d: number) => new Date(Date.now() + d * 864e5).toISOString();

export const seedUsers: User[] = [
  { id: "u1", email: "admin@transitops.dev", password: "admin123", name: "Alex Admin", role: "Admin" },
  { id: "u2", email: "manager@transitops.dev", password: "manager123", name: "Morgan Fleet", role: "Fleet Manager" },
  { id: "u3", email: "driver@transitops.dev", password: "driver123", name: "Danny Driver", role: "Driver" },
  { id: "u4", email: "safety@transitops.dev", password: "safety123", name: "Sam Safety", role: "Safety Officer" },
  { id: "u5", email: "finance@transitops.dev", password: "finance123", name: "Fran Finance", role: "Financial Analyst" },
];

export const seedVehicles: Vehicle[] = [
  { id: "v1", regNumber: "VAN-05", name: "Ford Transit", type: "Van", maxLoadKg: 500, odometer: 42100, acquisitionCost: 32000, status: "Available", region: "North", createdAt: now() },
  { id: "v2", regNumber: "TRK-11", name: "Volvo FH", type: "Truck", maxLoadKg: 12000, odometer: 128400, acquisitionCost: 95000, status: "Available", region: "South", createdAt: now() },
  { id: "v3", regNumber: "VAN-07", name: "Mercedes Sprinter", type: "Van", maxLoadKg: 800, odometer: 63200, acquisitionCost: 45000, status: "In Shop", region: "North", createdAt: now() },
  { id: "v4", regNumber: "PKP-02", name: "Toyota Hilux", type: "Pickup", maxLoadKg: 1000, odometer: 22000, acquisitionCost: 38000, status: "Available", region: "East", createdAt: now() },
  { id: "v5", regNumber: "TRK-22", name: "Scania R500", type: "Truck", maxLoadKg: 15000, odometer: 210000, acquisitionCost: 110000, status: "Retired", region: "West", createdAt: now() },
];

export const seedDrivers: Driver[] = [
  { id: "d1", name: "Alex Ryder", licenseNumber: "DL-8834211", licenseCategory: "C", licenseExpiry: daysFromNow(400), phone: "+1 555 0101", safetyScore: 92, status: "Available", createdAt: now() },
  { id: "d2", name: "Priya Kapoor", licenseNumber: "DL-2210984", licenseCategory: "CE", licenseExpiry: daysFromNow(120), phone: "+1 555 0102", safetyScore: 88, status: "Available", createdAt: now() },
  { id: "d3", name: "Marco Silva", licenseNumber: "DL-5590211", licenseCategory: "B", licenseExpiry: daysFromNow(20), phone: "+1 555 0103", safetyScore: 76, status: "Off Duty", createdAt: now() },
  { id: "d4", name: "Nia Okafor", licenseNumber: "DL-7712004", licenseCategory: "C", licenseExpiry: daysFromNow(-10), phone: "+1 555 0104", safetyScore: 81, status: "Available", createdAt: now() },
  { id: "d5", name: "Chen Wei", licenseNumber: "DL-9930112", licenseCategory: "CE", licenseExpiry: daysFromNow(600), phone: "+1 555 0105", safetyScore: 95, status: "Suspended", createdAt: now() },
];

export const seedTrips: Trip[] = [
  { id: "t1", source: "Warehouse A", destination: "Retail Hub North", vehicleId: "v1", driverId: "d1", cargoWeightKg: 420, plannedDistanceKm: 180, status: "Completed", actualDistanceKm: 184, fuelConsumedL: 22, revenue: 1200, createdAt: now(), dispatchedAt: now(), completedAt: now() },
  { id: "t2", source: "Port 3", destination: "Distribution Center", vehicleId: "v2", driverId: "d2", cargoWeightKg: 9800, plannedDistanceKm: 640, status: "Completed", actualDistanceKm: 655, fuelConsumedL: 210, revenue: 5400, createdAt: now(), dispatchedAt: now(), completedAt: now() },
  { id: "t3", source: "Warehouse B", destination: "Client Site 12", vehicleId: "v4", driverId: "d1", cargoWeightKg: 720, plannedDistanceKm: 95, status: "Draft", createdAt: now() },
];

export const seedMaintenance: Maintenance[] = [
  { id: "m1", vehicleId: "v3", type: "Engine Overhaul", description: "Full engine service", cost: 2200, status: "Open", openedAt: now() },
  { id: "m2", vehicleId: "v1", type: "Oil Change", description: "Routine oil + filter", cost: 180, status: "Closed", openedAt: now(), closedAt: now() },
];

export const seedFuel: FuelLog[] = [
  { id: "f1", vehicleId: "v1", liters: 45, cost: 78, date: now() },
  { id: "f2", vehicleId: "v2", liters: 220, cost: 385, date: now() },
  { id: "f3", vehicleId: "v4", liters: 60, cost: 105, date: now() },
];

export const seedExpenses: Expense[] = [
  { id: "e1", vehicleId: "v2", category: "Toll", amount: 45, note: "Highway 5", date: now() },
  { id: "e2", vehicleId: "v1", category: "Insurance", amount: 320, note: "Monthly premium", date: now() },
];

export const seedAudit: AuditLog[] = [];
