import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Send, CheckCircle, XCircle, Trash2 } from "lucide-react";
import type { Trip, TripStatus } from "@/lib/types";
import { downloadCSV } from "@/lib/csv";

export const Route = createFileRoute("/_app/trips")({
  component: TripsPage,
});

const statusVariant = (s: TripStatus) =>
  s === "Draft" ? "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
  : s === "Dispatched" ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
  : s === "Completed" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
  : "bg-red-500/15 text-red-500 border-red-500/30";

function TripsPage() {
  const { state, addTrip, dispatchTrip, completeTrip, cancelTrip, deleteTrip, can } = useStore();
  const [open, setOpen] = useState(false);
  const [completeFor, setCompleteFor] = useState<Trip | null>(null);
  const [completion, setCompletion] = useState({ distance: 0, fuel: 0, revenue: 0 });
  const canWrite = can("trip.*") || can("trip.create");

  // eligible: not retired/in shop/on trip
  const eligibleVehicles = state.vehicles.filter((v) => v.status === "Available");
  const eligibleDrivers = state.drivers.filter((d) => d.status === "Available" && new Date(d.licenseExpiry) > new Date());

  const [form, setForm] = useState({
    source: "", destination: "", vehicleId: "", driverId: "",
    cargoWeightKg: 0, plannedDistanceKm: 0,
  });

  const selectedVehicle = state.vehicles.find((v) => v.id === form.vehicleId);
  const cargoInvalid = selectedVehicle && form.cargoWeightKg > selectedVehicle.maxLoadKg;

  const submit = () => {
    if (!form.source || !form.destination || !form.vehicleId || !form.driverId) return;
    const trip = addTrip(form);
    if (trip) {
      setOpen(false);
      setForm({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeightKg: 0, plannedDistanceKm: 0 });
    }
  };

  const rows = useMemo(() => state.trips.map((t) => ({
    ...t,
    vehicle: state.vehicles.find((v) => v.id === t.vehicleId)?.regNumber ?? "—",
    driver: state.drivers.find((d) => d.id === t.driverId)?.name ?? "—",
  })), [state.trips, state.vehicles, state.drivers]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Button variant="outline" onClick={() => downloadCSV("trips.csv", rows as unknown as Record<string, unknown>[])}>Export CSV</Button>
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="ml-auto"><Plus className="h-4 w-4 mr-1" />New Trip</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create trip</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
                <div><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
                <div className="col-span-2"><Label>Vehicle (Available only)</Label>
                  <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {eligibleVehicles.length === 0 && <SelectItem value="__" disabled>None available</SelectItem>}
                      {eligibleVehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.regNumber} — {v.name} (max {v.maxLoadKg}kg)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Driver (eligible only)</Label>
                  <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                    <SelectContent>
                      {eligibleDrivers.length === 0 && <SelectItem value="__" disabled>None eligible</SelectItem>}
                      {eligibleDrivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} — {d.licenseCategory}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Cargo (kg)</Label>
                  <Input type="number" value={form.cargoWeightKg} onChange={(e) => setForm({ ...form, cargoWeightKg: +e.target.value })} />
                  {cargoInvalid && <p className="text-xs text-red-500 mt-1">Exceeds vehicle max load ({selectedVehicle!.maxLoadKg}kg)</p>}
                </div>
                <div><Label>Planned Distance (km)</Label><Input type="number" value={form.plannedDistanceKm} onChange={(e) => setForm({ ...form, plannedDistanceKm: +e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={submit} disabled={!!cargoInvalid}>Create as Draft</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead><TableHead>Vehicle</TableHead><TableHead>Driver</TableHead>
                <TableHead>Cargo</TableHead><TableHead>Planned km</TableHead><TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No trips yet.</TableCell></TableRow>}
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell><div className="font-medium">{t.source}</div><div className="text-xs text-muted-foreground">→ {t.destination}</div></TableCell>
                  <TableCell className="font-mono text-xs">{t.vehicle}</TableCell>
                  <TableCell>{t.driver}</TableCell>
                  <TableCell>{t.cargoWeightKg} kg</TableCell>
                  <TableCell>{t.plannedDistanceKm} km</TableCell>
                  <TableCell><Badge variant="outline" className={statusVariant(t.status)}>{t.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {canWrite && t.status === "Draft" && <Button size="sm" variant="outline" onClick={() => dispatchTrip(t.id)}><Send className="h-3 w-3 mr-1" />Dispatch</Button>}
                      {canWrite && t.status === "Dispatched" && (
                        <Button size="sm" variant="outline" onClick={() => { setCompleteFor(t); setCompletion({ distance: t.plannedDistanceKm, fuel: 0, revenue: 0 }); }}>
                          <CheckCircle className="h-3 w-3 mr-1" />Complete
                        </Button>
                      )}
                      {canWrite && (t.status === "Draft" || t.status === "Dispatched") && (
                        <Button size="sm" variant="ghost" onClick={() => cancelTrip(t.id)}><XCircle className="h-3 w-3" /></Button>
                      )}
                      {canWrite && <Button size="icon" variant="ghost" onClick={() => deleteTrip(t.id)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!completeFor} onOpenChange={(o) => !o && setCompleteFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Complete trip</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Actual km</Label><Input type="number" value={completion.distance} onChange={(e) => setCompletion({ ...completion, distance: +e.target.value })} /></div>
            <div><Label>Fuel used (L)</Label><Input type="number" value={completion.fuel} onChange={(e) => setCompletion({ ...completion, fuel: +e.target.value })} /></div>
            <div><Label>Revenue ($)</Label><Input type="number" value={completion.revenue} onChange={(e) => setCompletion({ ...completion, revenue: +e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => { if (completeFor) { completeTrip(completeFor.id, completion.distance, completion.fuel, completion.revenue); setCompleteFor(null); } }}>
              Mark Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
