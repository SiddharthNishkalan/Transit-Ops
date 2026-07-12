import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type {
  AuditLog, Driver, Expense, FuelLog, Maintenance, Role, Trip, User, Vehicle,
} from "./types";
import {
  seedAudit, seedDrivers, seedExpenses, seedFuel, seedMaintenance,
  seedTrips, seedUsers, seedVehicles,
} from "./seed";

const STORAGE_KEY = "transitops:v1";
const SESSION_KEY = "transitops:session";

interface State {
  users: User[];
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: Maintenance[];
  fuel: FuelLog[];
  expenses: Expense[];
  audit: AuditLog[];
}

const initialState: State = {
  users: seedUsers,
  vehicles: seedVehicles,
  drivers: seedDrivers,
  trips: seedTrips,
  maintenance: seedMaintenance,
  fuel: seedFuel,
  expenses: seedExpenses,
  audit: seedAudit,
};

const uid = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();

function loadState(): State {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return initialState;
  }
}

interface StoreCtx {
  state: State;
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  can: (action: string) => boolean;
  // Vehicle
  addVehicle: (v: Omit<Vehicle, "id" | "createdAt">) => void;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  bulkImportVehicles: (rows: Record<string, string>[]) => { added: number; skipped: number };
  bulkImportDrivers: (rows: Record<string, string>[]) => { added: number; skipped: number };
  addVehicleDocument: (vehicleId: string, doc: Omit<import("./types").VehicleDocument, "id">) => void;
  deleteVehicleDocument: (vehicleId: string, docId: string) => void;
  // Driver
  addDriver: (d: Omit<Driver, "id" | "createdAt">) => void;
  updateDriver: (id: string, patch: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  // Trip
  addTrip: (t: Omit<Trip, "id" | "createdAt" | "status"> & { status?: Trip["status"] }) => Trip | null;
  dispatchTrip: (id: string) => void;
  completeTrip: (id: string, actualDistanceKm: number, fuelConsumedL: number, revenue: number) => void;
  cancelTrip: (id: string) => void;
  deleteTrip: (id: string) => void;
  // Maintenance
  openMaintenance: (m: Omit<Maintenance, "id" | "openedAt" | "status">) => void;
  closeMaintenance: (id: string) => void;
  deleteMaintenance: (id: string) => void;
  // Fuel
  addFuel: (f: Omit<FuelLog, "id">) => void;
  deleteFuel: (id: string) => void;
  // Expense
  addExpense: (e: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  // Users
  addUser: (u: Omit<User, "id">) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

const ROLE_PERMS: Record<Role, string[]> = {
  Admin: ["*"],
  "Fleet Manager": ["vehicle.*", "driver.*", "trip.*", "maintenance.*", "fuel.*", "expense.*", "report.view"],
  Driver: ["trip.view", "trip.complete", "fuel.add"],
  "Safety Officer": ["driver.*", "vehicle.view", "trip.view", "maintenance.*", "report.view"],
  "Financial Analyst": ["report.*", "expense.*", "fuel.view", "vehicle.view", "trip.view"],
};

function permitted(role: Role, action: string) {
  const perms = ROLE_PERMS[role];
  if (perms.includes("*")) return true;
  if (perms.includes(action)) return true;
  const [ns] = action.split(".");
  return perms.includes(`${ns}.*`);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) setCurrentUser(JSON.parse(s));
    } catch { /* empty */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const audit = useCallback((action: string, entity: string) => {
    setState((s) => ({
      ...s,
      audit: [{ id: uid(), actor: currentUser?.email ?? "system", action, entity, at: nowISO() }, ...s.audit].slice(0, 200),
    }));
  }, [currentUser]);

  const login = useCallback((email: string, password: string) => {
    const u = state.users.find((x) => x.email === email && x.password === password);
    if (!u) { toast.error("Invalid email or password"); return false; }
    setCurrentUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    toast.success(`Welcome ${u.name}`);
    return true;
  }, [state.users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const can = useCallback((action: string) => {
    if (!currentUser) return false;
    return permitted(currentUser.role, action);
  }, [currentUser]);

  // Vehicles
  const addVehicle: StoreCtx["addVehicle"] = (v) => {
    if (state.vehicles.some((x) => x.regNumber.toLowerCase() === v.regNumber.toLowerCase())) {
      toast.error("Registration number must be unique"); return;
    }
    setState((s) => ({ ...s, vehicles: [{ ...v, id: uid(), createdAt: nowISO() }, ...s.vehicles] }));
    toast.success("Vehicle added"); audit("vehicle.create", v.regNumber);
  };
  const updateVehicle: StoreCtx["updateVehicle"] = (id, patch) => {
    if (patch.regNumber && state.vehicles.some((x) => x.id !== id && x.regNumber.toLowerCase() === patch.regNumber!.toLowerCase())) {
      toast.error("Registration number must be unique"); return;
    }
    setState((s) => ({ ...s, vehicles: s.vehicles.map((v) => v.id === id ? { ...v, ...patch } : v) }));
    audit("vehicle.update", id);
  };
  const deleteVehicle: StoreCtx["deleteVehicle"] = (id) => {
    setState((s) => ({ ...s, vehicles: s.vehicles.filter((v) => v.id !== id) }));
    toast.success("Vehicle removed"); audit("vehicle.delete", id);
  };

  // Drivers
  const addDriver: StoreCtx["addDriver"] = (d) => {
    setState((s) => ({ ...s, drivers: [{ ...d, id: uid(), createdAt: nowISO() }, ...s.drivers] }));
    toast.success("Driver added"); audit("driver.create", d.name);
  };
  const updateDriver: StoreCtx["updateDriver"] = (id, patch) => {
    setState((s) => ({ ...s, drivers: s.drivers.map((d) => d.id === id ? { ...d, ...patch } : d) }));
    audit("driver.update", id);
  };
  const deleteDriver: StoreCtx["deleteDriver"] = (id) => {
    setState((s) => ({ ...s, drivers: s.drivers.filter((d) => d.id !== id) }));
    toast.success("Driver removed"); audit("driver.delete", id);
  };

  // Trips
  const addTrip: StoreCtx["addTrip"] = (t) => {
    const vehicle = state.vehicles.find((v) => v.id === t.vehicleId);
    const driver = state.drivers.find((d) => d.id === t.driverId);
    if (!vehicle) { toast.error("Vehicle not found"); return null; }
    if (!driver) { toast.error("Driver not found"); return null; }
    if (vehicle.status === "Retired" || vehicle.status === "In Shop") {
      toast.error(`Vehicle is ${vehicle.status} and cannot be dispatched`); return null;
    }
    if (vehicle.status === "On Trip") { toast.error("Vehicle already on trip"); return null; }
    if (driver.status === "Suspended") { toast.error("Driver is suspended"); return null; }
    if (driver.status === "On Trip") { toast.error("Driver already on trip"); return null; }
    if (new Date(driver.licenseExpiry) < new Date()) { toast.error("Driver license has expired"); return null; }
    if (t.cargoWeightKg > vehicle.maxLoadKg) {
      toast.error(`Cargo ${t.cargoWeightKg}kg exceeds max load ${vehicle.maxLoadKg}kg`); return null;
    }
    const trip: Trip = { ...t, id: uid(), createdAt: nowISO(), status: t.status ?? "Draft" };
    setState((s) => ({ ...s, trips: [trip, ...s.trips] }));
    toast.success("Trip created"); audit("trip.create", trip.id);
    return trip;
  };

  const dispatchTrip: StoreCtx["dispatchTrip"] = (id) => {
    const trip = state.trips.find((t) => t.id === id);
    if (!trip) return;
    if (trip.status !== "Draft") { toast.error("Only draft trips can be dispatched"); return; }
    const vehicle = state.vehicles.find((v) => v.id === trip.vehicleId);
    const driver = state.drivers.find((d) => d.id === trip.driverId);
    if (!vehicle || !driver) { toast.error("Vehicle or driver missing"); return; }
    if (vehicle.status !== "Available") { toast.error(`Vehicle is ${vehicle.status}`); return; }
    if (driver.status !== "Available") { toast.error(`Driver is ${driver.status}`); return; }
    if (new Date(driver.licenseExpiry) < new Date()) { toast.error("Driver license expired"); return; }
    setState((s) => ({
      ...s,
      trips: s.trips.map((t) => t.id === id ? { ...t, status: "Dispatched", dispatchedAt: nowISO() } : t),
      vehicles: s.vehicles.map((v) => v.id === vehicle.id ? { ...v, status: "On Trip" } : v),
      drivers: s.drivers.map((d) => d.id === driver.id ? { ...d, status: "On Trip" } : d),
    }));
    toast.success("Trip dispatched"); audit("trip.dispatch", id);
  };

  const completeTrip: StoreCtx["completeTrip"] = (id, actualDistanceKm, fuelConsumedL, revenue) => {
    const trip = state.trips.find((t) => t.id === id);
    if (!trip) return;
    if (trip.status !== "Dispatched") { toast.error("Only dispatched trips can be completed"); return; }
    setState((s) => ({
      ...s,
      trips: s.trips.map((t) => t.id === id ? { ...t, status: "Completed", actualDistanceKm, fuelConsumedL, revenue, completedAt: nowISO() } : t),
      vehicles: s.vehicles.map((v) => v.id === trip.vehicleId ? { ...v, status: "Available", odometer: v.odometer + actualDistanceKm } : v),
      drivers: s.drivers.map((d) => d.id === trip.driverId ? { ...d, status: "Available" } : d),
    }));
    toast.success("Trip completed"); audit("trip.complete", id);
  };

  const cancelTrip: StoreCtx["cancelTrip"] = (id) => {
    const trip = state.trips.find((t) => t.id === id);
    if (!trip) return;
    if (trip.status === "Completed" || trip.status === "Cancelled") { toast.error("Cannot cancel this trip"); return; }
    const wasDispatched = trip.status === "Dispatched";
    setState((s) => ({
      ...s,
      trips: s.trips.map((t) => t.id === id ? { ...t, status: "Cancelled" } : t),
      vehicles: wasDispatched ? s.vehicles.map((v) => v.id === trip.vehicleId && v.status === "On Trip" ? { ...v, status: "Available" } : v) : s.vehicles,
      drivers: wasDispatched ? s.drivers.map((d) => d.id === trip.driverId && d.status === "On Trip" ? { ...d, status: "Available" } : d) : s.drivers,
    }));
    toast.success("Trip cancelled"); audit("trip.cancel", id);
  };

  const deleteTrip: StoreCtx["deleteTrip"] = (id) => {
    setState((s) => ({ ...s, trips: s.trips.filter((t) => t.id !== id) }));
    audit("trip.delete", id);
  };

  // Maintenance
  const openMaintenance: StoreCtx["openMaintenance"] = (m) => {
    const vehicle = state.vehicles.find((v) => v.id === m.vehicleId);
    if (!vehicle) { toast.error("Vehicle not found"); return; }
    if (vehicle.status === "On Trip") { toast.error("Vehicle is on trip; cannot enter maintenance"); return; }
    if (vehicle.status === "Retired") { toast.error("Vehicle is retired"); return; }
    setState((s) => ({
      ...s,
      maintenance: [{ ...m, id: uid(), openedAt: nowISO(), status: "Open" }, ...s.maintenance],
      vehicles: s.vehicles.map((v) => v.id === m.vehicleId ? { ...v, status: "In Shop" } : v),
    }));
    toast.success("Maintenance opened"); audit("maintenance.open", m.vehicleId);
  };

  const closeMaintenance: StoreCtx["closeMaintenance"] = (id) => {
    const rec = state.maintenance.find((m) => m.id === id);
    if (!rec) return;
    setState((s) => {
      const stillOpen = s.maintenance.some((m) => m.vehicleId === rec.vehicleId && m.id !== id && m.status === "Open");
      return {
        ...s,
        maintenance: s.maintenance.map((m) => m.id === id ? { ...m, status: "Closed", closedAt: nowISO() } : m),
        vehicles: s.vehicles.map((v) => {
          if (v.id !== rec.vehicleId) return v;
          if (v.status === "Retired" || stillOpen) return v;
          return { ...v, status: "Available" };
        }),
      };
    });
    toast.success("Maintenance closed"); audit("maintenance.close", id);
  };

  const deleteMaintenance: StoreCtx["deleteMaintenance"] = (id) => {
    setState((s) => ({ ...s, maintenance: s.maintenance.filter((m) => m.id !== id) }));
    audit("maintenance.delete", id);
  };

  // Vehicle documents & bulk import
  const addVehicleDocument: StoreCtx["addVehicleDocument"] = (vehicleId, doc) => {
    setState((s) => ({
      ...s,
      vehicles: s.vehicles.map((v) => v.id === vehicleId ? { ...v, documents: [...(v.documents ?? []), { ...doc, id: uid() }] } : v),
    }));
    toast.success("Document added"); audit("vehicle.document.add", vehicleId);
  };
  const deleteVehicleDocument: StoreCtx["deleteVehicleDocument"] = (vehicleId, docId) => {
    setState((s) => ({
      ...s,
      vehicles: s.vehicles.map((v) => v.id === vehicleId ? { ...v, documents: (v.documents ?? []).filter((d) => d.id !== docId) } : v),
    }));
  };
  const bulkImportVehicles: StoreCtx["bulkImportVehicles"] = (rows) => {
    let added = 0, skipped = 0;
    const existing = new Set(state.vehicles.map((v) => v.regNumber.toLowerCase()));
    const newVs: Vehicle[] = [];
    for (const r of rows) {
      const regNumber = (r.regNumber || r["Reg #"] || "").trim();
      if (!regNumber || existing.has(regNumber.toLowerCase())) { skipped++; continue; }
      existing.add(regNumber.toLowerCase());
      newVs.push({
        id: uid(), regNumber, name: r.name || "Unnamed", type: r.type || "Van",
        maxLoadKg: +(r.maxLoadKg || 500), odometer: +(r.odometer || 0),
        acquisitionCost: +(r.acquisitionCost || 0),
        status: (["Available", "On Trip", "In Shop", "Retired"].includes(r.status) ? r.status : "Available") as Vehicle["status"],
        region: r.region || "North", createdAt: nowISO(),
      });
      added++;
    }
    if (added) setState((s) => ({ ...s, vehicles: [...newVs, ...s.vehicles] }));
    audit("vehicle.import", `${added} added, ${skipped} skipped`);
    return { added, skipped };
  };
  const bulkImportDrivers: StoreCtx["bulkImportDrivers"] = (rows) => {
    let added = 0, skipped = 0;
    const newDs: Driver[] = [];
    for (const r of rows) {
      const name = (r.name || "").trim();
      const licenseNumber = (r.licenseNumber || "").trim();
      if (!name || !licenseNumber) { skipped++; continue; }
      newDs.push({
        id: uid(), name, licenseNumber,
        licenseCategory: r.licenseCategory || "C",
        licenseExpiry: r.licenseExpiry ? new Date(r.licenseExpiry).toISOString() : new Date(Date.now() + 365 * 864e5).toISOString(),
        phone: r.phone || "",
        safetyScore: +(r.safetyScore || 85),
        status: (["Available", "On Trip", "Off Duty", "Suspended"].includes(r.status) ? r.status : "Available") as Driver["status"],
        createdAt: nowISO(),
      });
      added++;
    }
    if (added) setState((s) => ({ ...s, drivers: [...newDs, ...s.drivers] }));
    audit("driver.import", `${added} added, ${skipped} skipped`);
    return { added, skipped };
  };

  // Fuel
  const addFuel: StoreCtx["addFuel"] = (f) => {
    setState((s) => ({ ...s, fuel: [{ ...f, id: uid() }, ...s.fuel] }));
    toast.success("Fuel log added"); audit("fuel.create", f.vehicleId);
  };
  const deleteFuel: StoreCtx["deleteFuel"] = (id) => {
    setState((s) => ({ ...s, fuel: s.fuel.filter((f) => f.id !== id) }));
  };

  // Expenses
  const addExpense: StoreCtx["addExpense"] = (e) => {
    setState((s) => ({ ...s, expenses: [{ ...e, id: uid() }, ...s.expenses] }));
    toast.success("Expense added"); audit("expense.create", e.category);
  };
  const deleteExpense: StoreCtx["deleteExpense"] = (id) => {
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
  };

  // Users
  const addUser: StoreCtx["addUser"] = (u) => {
    if (state.users.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) {
      toast.error("Email already in use"); return;
    }
    setState((s) => ({ ...s, users: [{ ...u, id: uid() }, ...s.users] }));
    toast.success("User created"); audit("user.create", u.email);
  };
  const updateUser: StoreCtx["updateUser"] = (id, patch) => {
    setState((s) => ({ ...s, users: s.users.map((u) => u.id === id ? { ...u, ...patch } : u) }));
  };
  const deleteUser: StoreCtx["deleteUser"] = (id) => {
    setState((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));
  };

  const value: StoreCtx = useMemo(() => ({
    state, currentUser, login, logout, can,
    addVehicle, updateVehicle, deleteVehicle, bulkImportVehicles, bulkImportDrivers,
    addVehicleDocument, deleteVehicleDocument,
    addDriver, updateDriver, deleteDriver,
    addTrip, dispatchTrip, completeTrip, cancelTrip, deleteTrip,
    openMaintenance, closeMaintenance, deleteMaintenance,
    addFuel, deleteFuel, addExpense, deleteExpense,
    addUser, updateUser, deleteUser,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state, currentUser, can]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be inside StoreProvider");
  return c;
}
