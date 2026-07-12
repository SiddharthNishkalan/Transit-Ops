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
import { Plus, Trash2, AlertTriangle, Upload } from "lucide-react";
import type { Driver, DriverStatus } from "@/lib/types";
import { downloadCSV } from "@/lib/csv";
import { parseCSV } from "@/lib/csv-import";
import { driverCompliance, complianceBand } from "@/lib/derived";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/drivers")({
  component: DriversPage,
});

const statuses: DriverStatus[] = ["Available", "On Trip", "Off Duty", "Suspended"];

function DriversPage() {
  const { state, addDriver, updateDriver, deleteDriver, bulkImportDrivers, can } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "compliance" | "expiry" | "safety">("name");
  const fileRef = useRef<HTMLInputElement>(null);
  const canWrite = can("driver.create") || can("driver.*");

  const onImport = async (f: File) => {
    const text = await f.text();
    const res = bulkImportDrivers(parseCSV(text));
    toast.success(`Imported ${res.added} drivers, skipped ${res.skipped}`);
  };

  const [form, setForm] = useState<Omit<Driver, "id" | "createdAt">>({
    name: "", licenseNumber: "", licenseCategory: "C", licenseExpiry: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
    phone: "", safetyScore: 85, status: "Available",
  });

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    const rows = state.drivers.filter((d) => !t || d.name.toLowerCase().includes(t) || d.licenseNumber.toLowerCase().includes(t));
    return rows.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "expiry") return new Date(a.licenseExpiry).getTime() - new Date(b.licenseExpiry).getTime();
      if (sortBy === "safety") return b.safetyScore - a.safetyScore;
      return driverCompliance(b).score - driverCompliance(a).score;
    });
  }, [state.drivers, q, sortBy]);

  const submit = () => {
    if (!form.name.trim() || !form.licenseNumber.trim()) return;
    addDriver(form);
    setOpen(false);
    setForm({ name: "", licenseNumber: "", licenseCategory: "C", licenseExpiry: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10), phone: "", safetyScore: 85, status: "Available" });
  };

  const licenseState = (iso: string) => {
    const d = new Date(iso).getTime() - Date.now();
    if (d < 0) return { color: "text-red-500", label: "Expired" };
    if (d < 30 * 864e5) return { color: "text-amber-500", label: "Expiring soon" };
    return { color: "text-emerald-500", label: "Valid" };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Search name or license" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="compliance">Sort: Compliance</SelectItem>
            <SelectItem value="expiry">Sort: License expiry</SelectItem>
            <SelectItem value="safety">Sort: Safety score</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => downloadCSV("drivers.csv", filtered as unknown as Record<string, unknown>[])}>Export CSV</Button>
        {canWrite && (
          <>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
            <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-1" />Import CSV</Button>
          </>
        )}
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="ml-auto"><Plus className="h-4 w-4 mr-1" />New Driver</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add driver</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>License #</Label><Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} /></div>
                <div><Label>Category</Label>
                  <Select value={form.licenseCategory} onValueChange={(v) => setForm({ ...form, licenseCategory: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["A", "B", "C", "CE", "D"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>License Expiry</Label><Input type="date" value={form.licenseExpiry.slice(0, 10)} onChange={(e) => setForm({ ...form, licenseExpiry: new Date(e.target.value).toISOString() })} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Safety Score</Label><Input type="number" min={0} max={100} value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: +e.target.value })} /></div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as DriverStatus })}>
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
                <TableHead>Name</TableHead><TableHead>License</TableHead><TableHead>Cat.</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Safety</TableHead><TableHead>Compliance</TableHead>
                <TableHead>Status</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No drivers.</TableCell></TableRow>}
              {filtered.map((d) => {
                const ls = licenseState(d.licenseExpiry);
                const comp = driverCompliance(d);
                const band = complianceBand(comp.score);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}<div className="text-[10px] text-muted-foreground">{d.phone}</div></TableCell>
                    <TableCell className="font-mono text-xs">{d.licenseNumber}</TableCell>
                    <TableCell>{d.licenseCategory}</TableCell>
                    <TableCell className={`text-xs ${ls.color}`}>
                      <div className="flex items-center gap-1">
                        {ls.label !== "Valid" && <AlertTriangle className="h-3 w-3" />}
                        {new Date(d.licenseExpiry).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={d.safetyScore >= 90 ? "border-emerald-500/40 text-emerald-500" : d.safetyScore >= 80 ? "border-amber-500/40 text-amber-500" : "border-red-500/40 text-red-500"}>
                        {d.safetyScore}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Badge variant="outline" className={band.color}>{comp.score} · {band.label}</Badge>
                        {comp.issues[0] && <span className="text-[10px] text-muted-foreground">{comp.issues[0]}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={d.status} onValueChange={(s) => updateDriver(d.id, { status: s as DriverStatus })} disabled={!canWrite}>
                        <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{canWrite && <Button size="icon" variant="ghost" onClick={() => deleteDriver(d.id)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Drivers with expired licenses or Suspended status cannot be dispatched.</p>
    </div>
  );
}
