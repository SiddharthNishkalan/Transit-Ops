import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckCircle, Trash2 } from "lucide-react";
import { downloadCSV } from "@/lib/csv";

export const Route = createFileRoute("/_app/maintenance")({
  component: MaintenancePage,
});

function MaintenancePage() {
  const { state, openMaintenance, closeMaintenance, deleteMaintenance, can } = useStore();
  const [open, setOpen] = useState(false);
  const canWrite = can("maintenance.*") || can("maintenance.open");

  const eligible = state.vehicles.filter((v) => v.status !== "On Trip" && v.status !== "Retired");
  const [form, setForm] = useState({ vehicleId: "", type: "Oil Change", description: "", cost: 0 });

  const submit = () => {
    if (!form.vehicleId) return;
    openMaintenance(form);
    setOpen(false);
    setForm({ vehicleId: "", type: "Oil Change", description: "", cost: 0 });
  };

  const rows = state.maintenance.map((m) => ({
    ...m,
    vehicle: state.vehicles.find((v) => v.id === m.vehicleId)?.regNumber ?? "—",
  }));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Button variant="outline" onClick={() => downloadCSV("maintenance.csv", rows as unknown as Record<string, unknown>[])}>Export CSV</Button>
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="ml-auto"><Plus className="h-4 w-4 mr-1" />Open Maintenance</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Open maintenance record</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Vehicle</Label>
                  <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {eligible.map((v) => <SelectItem key={v.id} value={v.id}>{v.regNumber} — {v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Oil Change", "Tire Change", "Brake Service", "Engine Overhaul", "Inspection", "Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Cost ($)</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={submit}>Open (sets vehicle to In Shop)</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead>
                <TableHead>Cost</TableHead><TableHead>Opened</TableHead><TableHead>Closed</TableHead>
                <TableHead>Status</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No maintenance records.</TableCell></TableRow>}
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.vehicle}</TableCell>
                  <TableCell>{m.type}</TableCell>
                  <TableCell className="max-w-[240px] truncate">{m.description}</TableCell>
                  <TableCell>${m.cost.toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{new Date(m.openedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">{m.closedAt ? new Date(m.closedAt).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={m.status === "Open" ? "border-amber-500/40 text-amber-500" : "border-emerald-500/40 text-emerald-500"}>{m.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {canWrite && m.status === "Open" && <Button size="sm" variant="outline" onClick={() => closeMaintenance(m.id)}><CheckCircle className="h-3 w-3 mr-1" />Close</Button>}
                      {canWrite && <Button size="icon" variant="ghost" onClick={() => deleteMaintenance(m.id)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Opening maintenance sets vehicle to In Shop and removes it from dispatch. Closing restores Available (unless Retired).</p>
    </div>
  );
}
