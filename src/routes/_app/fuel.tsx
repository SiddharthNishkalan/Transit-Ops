import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import type { ExpenseCategory } from "@/lib/types";
import { downloadCSV } from "@/lib/csv";

export const Route = createFileRoute("/_app/fuel")({
  component: FuelPage,
});

function FuelPage() {
  const { state, addFuel, deleteFuel, addExpense, deleteExpense, can } = useStore();
  const [openFuel, setOpenFuel] = useState(false);
  const [openExp, setOpenExp] = useState(false);
  const canFuel = can("fuel.*") || can("fuel.add") || can("fuel.create");
  const canExp = can("expense.*") || can("expense.create");

  const [fuel, setFuel] = useState({ vehicleId: "", liters: 0, cost: 0, date: new Date().toISOString().slice(0, 10) });
  const [exp, setExp] = useState<{ vehicleId: string; category: ExpenseCategory; amount: number; note: string; date: string }>({
    vehicleId: "", category: "Toll", amount: 0, note: "", date: new Date().toISOString().slice(0, 10),
  });

  const fuelRows = state.fuel.map((f) => ({ ...f, vehicle: state.vehicles.find((v) => v.id === f.vehicleId)?.regNumber ?? "—" }));
  const expRows = state.expenses.map((e) => ({ ...e, vehicle: state.vehicles.find((v) => v.id === e.vehicleId)?.regNumber ?? "—" }));

  return (
    <div className="space-y-4">
      <Tabs defaultValue="fuel">
        <TabsList>
          <TabsTrigger value="fuel">Fuel Logs</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="fuel" className="space-y-4">
          <div className="flex gap-2 items-center">
            <Button variant="outline" onClick={() => downloadCSV("fuel.csv", fuelRows as unknown as Record<string, unknown>[])}>Export CSV</Button>
            {canFuel && (
              <Dialog open={openFuel} onOpenChange={setOpenFuel}>
                <DialogTrigger asChild><Button className="ml-auto"><Plus className="h-4 w-4 mr-1" />New Fuel Log</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add fuel log</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Vehicle</Label>
                      <Select value={fuel.vehicleId} onValueChange={(v) => setFuel({ ...fuel, vehicleId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                        <SelectContent>{state.vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.regNumber}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Liters</Label><Input type="number" value={fuel.liters} onChange={(e) => setFuel({ ...fuel, liters: +e.target.value })} /></div>
                    <div><Label>Cost ($)</Label><Input type="number" value={fuel.cost} onChange={(e) => setFuel({ ...fuel, cost: +e.target.value })} /></div>
                    <div className="col-span-2"><Label>Date</Label><Input type="date" value={fuel.date} onChange={(e) => setFuel({ ...fuel, date: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button onClick={() => { if (fuel.vehicleId) { addFuel({ ...fuel, date: new Date(fuel.date).toISOString() }); setOpenFuel(false); setFuel({ vehicleId: "", liters: 0, cost: 0, date: new Date().toISOString().slice(0, 10) }); } }}>Add</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Liters</TableHead><TableHead>Cost</TableHead><TableHead>Date</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {fuelRows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No fuel logs.</TableCell></TableRow>}
                {fuelRows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs">{f.vehicle}</TableCell>
                    <TableCell>{f.liters} L</TableCell>
                    <TableCell>${f.cost.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{new Date(f.date).toLocaleDateString()}</TableCell>
                    <TableCell>{canFuel && <Button size="icon" variant="ghost" onClick={() => deleteFuel(f.id)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex gap-2 items-center">
            <Button variant="outline" onClick={() => downloadCSV("expenses.csv", expRows as unknown as Record<string, unknown>[])}>Export CSV</Button>
            {canExp && (
              <Dialog open={openExp} onOpenChange={setOpenExp}>
                <DialogTrigger asChild><Button className="ml-auto"><Plus className="h-4 w-4 mr-1" />New Expense</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add expense</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Vehicle</Label>
                      <Select value={exp.vehicleId} onValueChange={(v) => setExp({ ...exp, vehicleId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                        <SelectContent>{state.vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.regNumber}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Category</Label>
                      <Select value={exp.category} onValueChange={(v) => setExp({ ...exp, category: v as ExpenseCategory })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["Toll", "Maintenance", "Insurance", "Misc"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Amount</Label><Input type="number" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: +e.target.value })} /></div>
                    <div className="col-span-2"><Label>Note</Label><Input value={exp.note} onChange={(e) => setExp({ ...exp, note: e.target.value })} /></div>
                    <div className="col-span-2"><Label>Date</Label><Input type="date" value={exp.date} onChange={(e) => setExp({ ...exp, date: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button onClick={() => { if (exp.vehicleId) { addExpense({ ...exp, date: new Date(exp.date).toISOString() }); setOpenExp(false); } }}>Add</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Note</TableHead><TableHead>Date</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {expRows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No expenses.</TableCell></TableRow>}
                {expRows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.vehicle}</TableCell>
                    <TableCell>{e.category}</TableCell>
                    <TableCell>${e.amount.toLocaleString()}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{e.note}</TableCell>
                    <TableCell className="text-xs">{new Date(e.date).toLocaleDateString()}</TableCell>
                    <TableCell>{canExp && <Button size="icon" variant="ghost" onClick={() => deleteExpense(e.id)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
      <Card>
        <CardHeader><CardTitle className="text-sm">Totals</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><div className="text-muted-foreground text-xs">Total Fuel Cost</div><div className="text-xl font-bold">${state.fuel.reduce((s, f) => s + f.cost, 0).toLocaleString()}</div></div>
          <div><div className="text-muted-foreground text-xs">Total Liters</div><div className="text-xl font-bold">{state.fuel.reduce((s, f) => s + f.liters, 0).toLocaleString()} L</div></div>
          <div><div className="text-muted-foreground text-xs">Total Expenses</div><div className="text-xl font-bold">${state.expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</div></div>
        </CardContent>
      </Card>
    </div>
  );
}
