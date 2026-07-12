import type { Driver, Vehicle, Maintenance, Trip } from "./types";

export interface Notification {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  link?: string;
  at: string;
}

export function driverCompliance(d: Driver): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  const days = (new Date(d.licenseExpiry).getTime() - Date.now()) / 864e5;
  if (days < 0) { score -= 50; issues.push("License expired"); }
  else if (days < 30) { score -= 20; issues.push("License expiring within 30 days"); }
  else if (days < 90) { score -= 8; issues.push("License expiring within 90 days"); }
  if (d.status === "Suspended") { score -= 40; issues.push("Suspended"); }
  score = Math.round(score * 0.6 + d.safetyScore * 0.4);
  return { score: Math.max(0, Math.min(100, score)), issues };
}

export function complianceBand(n: number) {
  if (n >= 85) return { label: "Excellent", color: "border-emerald-500/40 text-emerald-500" };
  if (n >= 70) return { label: "Good", color: "border-lime-500/40 text-lime-500" };
  if (n >= 50) return { label: "Watch", color: "border-amber-500/40 text-amber-500" };
  return { label: "Critical", color: "border-red-500/40 text-red-500" };
}

export function maintenanceDue(v: Vehicle): { due: boolean; message: string } {
  const interval = v.serviceIntervalKm ?? 10000;
  const last = v.lastServiceOdometer ?? 0;
  const kmSince = v.odometer - last;
  if (kmSince >= interval) return { due: true, message: `Service overdue by ${kmSince - interval} km` };
  if (kmSince >= interval * 0.9) return { due: true, message: `Service due in ${interval - kmSince} km` };
  return { due: false, message: `${interval - kmSince} km until next service` };
}

export function buildNotifications(state: {
  drivers: Driver[]; vehicles: Vehicle[]; maintenance: Maintenance[]; trips: Trip[];
}): Notification[] {
  const list: Notification[] = [];
  state.drivers.forEach((d) => {
    const days = (new Date(d.licenseExpiry).getTime() - Date.now()) / 864e5;
    if (days < 0) list.push({ id: `lic-${d.id}`, severity: "high", title: `${d.name} — license expired`, detail: `Expired ${Math.abs(Math.round(days))} days ago`, link: "/drivers", at: new Date().toISOString() });
    else if (days < 30) list.push({ id: `lic-${d.id}`, severity: "medium", title: `${d.name} — license expiring`, detail: `Expires in ${Math.round(days)} days`, link: "/drivers", at: new Date().toISOString() });
  });
  state.vehicles.forEach((v) => {
    if (v.status === "Retired") return;
    const m = maintenanceDue(v);
    if (m.due) list.push({ id: `svc-${v.id}`, severity: "medium", title: `${v.regNumber} — ${m.message}`, detail: `Odometer ${v.odometer.toLocaleString()} km`, link: "/maintenance", at: new Date().toISOString() });
    (v.documents ?? []).forEach((doc) => {
      const days = (new Date(doc.expiryDate).getTime() - Date.now()) / 864e5;
      if (days < 0) list.push({ id: `doc-${doc.id}`, severity: "high", title: `${v.regNumber} — ${doc.name} expired`, detail: `${doc.type}`, link: "/vehicles", at: new Date().toISOString() });
      else if (days < 30) list.push({ id: `doc-${doc.id}`, severity: "medium", title: `${v.regNumber} — ${doc.name} expiring`, detail: `${doc.type} in ${Math.round(days)}d`, link: "/vehicles", at: new Date().toISOString() });
    });
  });
  const drafts = state.trips.filter((t) => t.status === "Draft").length;
  if (drafts > 0) list.push({ id: `drafts`, severity: "low", title: `${drafts} draft trip${drafts > 1 ? "s" : ""} awaiting dispatch`, detail: "Review and dispatch", link: "/trips", at: new Date().toISOString() });
  return list.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : b.severity === "high" ? 1 : a.severity === "medium" ? -1 : 1));
}
