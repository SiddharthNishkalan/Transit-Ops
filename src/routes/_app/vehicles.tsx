import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Search, Upload, FileText, ArrowUpDown } from "lucide-react";
import type { Vehicle, VehicleDocument, VehicleStatus } from "@/lib/types";
import { downloadCSV } from "@/lib/csv";
import { parseCSV } from "@/lib/csv-import";
import { maintenanceDue } from "@/lib/derived";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/vehicles")({
  component: VehiclesPage,
});

const statuses: VehicleStatus[] = ["Available", "On Trip", "In Shop", "Retired"];

const statusColor = (s: VehicleStatus) =>
  s === "Available" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
  : s === "On Trip" ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
  : s === "In Shop" ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
  : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";

function VehiclesPage() {
  const { state, addVehicle, updateVehicle, deleteVehicle, bulkImportVehicles, addVehicleDocument, deleteVehicleDocument, can } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortKey, setSortKey] = useState<keyof Vehicle>("regNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [docsFor, setDocsFor] = useState<Vehicle | null>(null);
  const [newDoc, setNewDoc] = useState<Omit<VehicleDocument, "id">>({ name: "", type: "Insurance", expiryDate: new Date(Date.now() + 180 * 864e5).toISOString().slice(0, 10) });
  const fileRef = useRef<HTMLInputElement>(null);
  const canWrite = can("vehicle.create") || can("vehicle.*");

  const [form, setForm] = useState<Omit<Vehicle, "id" | "createdAt">>({
    regNumber: "", name: "", type: "Van", maxLoadKg: 500, odometer: 0,
    acquisitionCost: 0, status: "Available", region: "North",
  });

  const onImport = async (f: File) => {
    const text = await f.text();
    const res = bulkImportVehicles(parseCSV(text));
    toast.success(`Imported ${res.added}, skipped ${res.skipped}`);
  };

  const toggleSort = (k: keyof Vehicle) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    const rows = state.vehicles.filter((v) => {
      const matchQ = !term || v.regNumber.toLowerCase().includes(term) || v.name.toLowerCase().includes(term);
      const matchS = filterStatus === "all" || v.status === filterStatus;
      return matchQ && matchS;
    });
    return rows.sort((a, b) => {
      const av = a[sortKey] ?? ""; const bv = b[sortKey] ?? "";
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [state.vehicles, q, filterStatus, sortKey, sortDir]);

  const currentDocs = docsFor ? (state.vehicles.find((v) => v.id === docsFor.id)?.documents ?? []) : [];

  const submit = () => {
    if (!form.regNumber.trim() || !form.name.trim()) return;
    addVehicle(form);
    setOpen(false);
    setForm({ regNumber: "", name: "", type: "Van", maxLoadKg: 500, odometer: 0, acquisitionCost: 0, status: "Available", region: "North" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search reg # or name" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => downloadCSV("vehicles.csv", filtered as unknown as Record<string, unknown>[])}>Export CSV</Button>
        {canWrite && (
          <>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
            <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-1" />Import CSV</Button>
          </>
        )}
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="ml-auto"><Plus className="h-4 w-4 mr-1" />New Vehicle</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Register vehicle</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1"><Label>Registration #</Label><Input value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })} /></div>
                <div className="col-span-1"><Label>Name / Model</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Van", "Truck", "Pickup", "Bus", "Car"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Region</Label>
                  <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["North", "South", "East", "West"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Max Load (kg)</Label><Input type="number" value={form.maxLoadKg} onChange={(e) => setForm({ ...form, maxLoadKg: +e.target.value })} /></div>
                <div><Label>Odometer</Label><Input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: +e.target.value })} /></div>
                <div><Label>Acquisition Cost</Label><Input type="number" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: +e.target.value })} /></div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as VehicleStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={submit}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {([
                  ["regNumber", "Reg #"], ["name", "Name"], ["type", "Type"], ["region", "Region"],
                  ["maxLoadKg", "Max Load"], ["odometer", "Odometer"], ["acquisitionCost", "Cost"],
                ] as [keyof Vehicle, string][]).map(([k, label]) => (
                  <TableHead key={k}>
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(k)}>
                      {label}<ArrowUpDown className="h-3 w-3 opacity-50" />
                    </button>
                  </TableHead>
                ))}
                <TableHead>Service</TableHead><TableHead>Status</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No vehicles yet.</TableCell></TableRow>
              )}
              {filtered.map((v) => {
                const svc = maintenanceDue(v);
                const docCount = (v.documents ?? []).length;
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.regNumber}</TableCell>
                    <TableCell>{v.name}</TableCell>
                    <TableCell>{v.type}</TableCell>
                    <TableCell>{v.region}</TableCell>
                    <TableCell>{v.maxLoadKg} kg</TableCell>
                    <TableCell>{v.odometer.toLocaleString()} km</TableCell>
                    <TableCell>${v.acquisitionCost.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={svc.due ? "border-amber-500/40 text-amber-500 text-[10px]" : "border-emerald-500/40 text-emerald-500 text-[10px]"}>
                        {svc.due ? "Due" : "OK"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={v.status} onValueChange={(s) => updateVehicle(v.id, { status: s as VehicleStatus })} disabled={!canWrite}>
                        <SelectTrigger className={`h-7 text-xs w-[110px] ${statusColor(v.status)}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => setDocsFor(v)}>
                          <FileText className="h-3 w-3" /><span className="text-[10px]">{docCount}</span>
                        </Button>
                        {canWrite && <Button size="icon" variant="ghost" onClick={() => deleteVehicle(v.id)}><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!docsFor} onOpenChange={(o) => !o && setDocsFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Documents — {docsFor?.regNumber}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-60 overflow-auto">
            {currentDocs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No documents yet.</p>}
            {currentDocs.map((d) => {
              const days = (new Date(d.expiryDate).getTime() - Date.now()) / 864e5;
              const cls = days < 0 ? "text-red-500" : days < 30 ? "text-amber-500" : "text-emerald-500";
              return (
                <div key={d.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">{d.type} · <span className={cls}>expires {new Date(d.expiryDate).toLocaleDateString()}</span></div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => docsFor && deleteVehicleDocument(docsFor.id, d.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              );
            })}
          </div>
          <div className="border-t pt-3 grid grid-cols-2 gap-2">
            <div className="col-span-2"><Label>Document name</Label><Input value={newDoc.name} onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })} placeholder="e.g. Certificate 2026" /></div>
            <div><Label>Type</Label>
              <Select value={newDoc.type} onValueChange={(v) => setNewDoc({ ...newDoc, type: v as VehicleDocument["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Insurance", "Registration", "Inspection", "Permit", "Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Expiry</Label><Input type="date" value={newDoc.expiryDate.slice(0, 10)} onChange={(e) => setNewDoc({ ...newDoc, expiryDate: new Date(e.target.value).toISOString() })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              if (!docsFor || !newDoc.name.trim()) return;
              addVehicleDocument(docsFor.id, newDoc);
              setNewDoc({ name: "", type: "Insurance", expiryDate: new Date(Date.now() + 180 * 864e5).toISOString().slice(0, 10) });
            }}>Add document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">Retired and In Shop vehicles are automatically hidden from trip dispatch. CSV import supports columns: regNumber, name, type, maxLoadKg, odometer, acquisitionCost, status, region.</p>
    </div>
  );
}
