import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCSV } from "@/lib/csv";
import { Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { state } = useStore();

  const perVehicle = useMemo(() => state.vehicles.map((v) => {
    const trips = state.trips.filter((t) => t.vehicleId === v.id && t.status === "Completed");
    const distance = trips.reduce((s, t) => s + (t.actualDistanceKm || 0), 0);
    const fuelL = trips.reduce((s, t) => s + (t.fuelConsumedL || 0), 0);
    const revenue = trips.reduce((s, t) => s + (t.revenue || 0), 0);
    const fuelCost = state.fuel.filter((f) => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
    const maintCost = state.maintenance.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
    const expCost = state.expenses.filter((e) => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0);
    const opCost = fuelCost + maintCost + expCost;
    const roi = revenue - opCost - v.acquisitionCost;
    return {
      regNumber: v.regNumber, name: v.name, distanceKm: distance, fuelL,
      kmPerL: fuelL ? +(distance / fuelL).toFixed(2) : 0,
      revenue, fuelCost, maintCost, expCost, opCost, roi,
    };
  }), [state]);

  const totalRevenue = perVehicle.reduce((s, r) => s + r.revenue, 0);
  const totalOp = perVehicle.reduce((s, r) => s + r.opCost, 0);
  const totalRoi = perVehicle.reduce((s, r) => s + r.roi, 0);
  const utilization = state.vehicles.length
    ? Math.round((state.vehicles.filter((v) => v.status === "On Trip").length / state.vehicles.length) * 100)
    : 0;

  const roiChart = perVehicle.map((r) => ({ name: r.regNumber, revenue: r.revenue, opCost: r.opCost }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground uppercase">Total Revenue</div><div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground uppercase">Operational Cost</div><div className="text-2xl font-bold">${totalOp.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground uppercase">Fleet ROI</div><div className={`text-2xl font-bold ${totalRoi >= 0 ? "text-emerald-500" : "text-red-500"}`}>${totalRoi.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground uppercase">Utilization</div><div className="text-2xl font-bold">{utilization}%</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Revenue vs. Operational Cost</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer>
            <BarChart data={roiChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="hsl(160 70% 45%)" radius={[6,6,0,0]} />
              <Bar dataKey="opCost" fill="hsl(0 75% 60%)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-sm">Per-Vehicle Report</CardTitle>
          <Button variant="outline" size="sm" onClick={() => downloadCSV("vehicle-report.csv", perVehicle as unknown as Record<string, unknown>[])}>
            <Download className="h-3 w-3 mr-1" />Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg #</TableHead><TableHead>Name</TableHead>
                <TableHead>Distance</TableHead><TableHead>Fuel</TableHead>
                <TableHead>km/L</TableHead><TableHead>Revenue</TableHead>
                <TableHead>Op Cost</TableHead><TableHead>ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perVehicle.map((r) => (
                <TableRow key={r.regNumber}>
                  <TableCell className="font-mono text-xs">{r.regNumber}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.distanceKm.toLocaleString()} km</TableCell>
                  <TableCell>{r.fuelL} L</TableCell>
                  <TableCell>{r.kmPerL}</TableCell>
                  <TableCell>${r.revenue.toLocaleString()}</TableCell>
                  <TableCell>${r.opCost.toLocaleString()}</TableCell>
                  <TableCell className={r.roi >= 0 ? "text-emerald-500" : "text-red-500"}>${r.roi.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
