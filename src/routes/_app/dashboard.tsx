import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, CheckCircle2, Wrench, Route as RouteIcon, Clock, Users, Activity, ShieldCheck, DollarSign } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { driverCompliance } from "@/lib/derived";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const COLORS = ["hsl(220 90% 56%)", "hsl(160 70% 45%)", "hsl(35 90% 55%)", "hsl(0 75% 60%)", "hsl(280 65% 60%)"];

function Kpi({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: React.ElementType; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
          </div>
          <div className="h-9 w-9 rounded-md bg-primary/10 text-primary grid place-items-center">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { state, currentUser } = useStore();
  const role = currentUser?.role;
  const showFinance = role === "Admin" || role === "Fleet Manager" || role === "Financial Analyst";
  const showSafety = role === "Admin" || role === "Fleet Manager" || role === "Safety Officer";
  const [vType, setVType] = useState<string>("all");
  const [vStatus, setVStatus] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");

  const vehicles = useMemo(() => state.vehicles.filter((v) =>
    (vType === "all" || v.type === vType) &&
    (vStatus === "all" || v.status === vStatus) &&
    (region === "all" || v.region === region)
  ), [state.vehicles, vType, vStatus, region]);

  const types = Array.from(new Set(state.vehicles.map((v) => v.type)));
  const regions = Array.from(new Set(state.vehicles.map((v) => v.region)));

  const active = vehicles.filter((v) => v.status === "On Trip").length;
  const available = vehicles.filter((v) => v.status === "Available").length;
  const inShop = vehicles.filter((v) => v.status === "In Shop").length;
  const activeTrips = state.trips.filter((t) => t.status === "Dispatched").length;
  const pendingTrips = state.trips.filter((t) => t.status === "Draft").length;
  const driversOnDuty = state.drivers.filter((d) => d.status === "On Trip" || d.status === "Available").length;
  const utilization = vehicles.length ? Math.round((active / vehicles.length) * 100) : 0;

  const statusData = ["Available", "On Trip", "In Shop", "Retired"].map((s) => ({
    name: s, value: vehicles.filter((v) => v.status === s).length,
  }));

  const tripStatusData = ["Draft", "Dispatched", "Completed", "Cancelled"].map((s) => ({
    name: s, count: state.trips.filter((t) => t.status === s).length,
  }));

  const efficiencyData = state.trips.filter((t) => t.status === "Completed" && t.fuelConsumedL && t.actualDistanceKm)
    .slice(0, 8).reverse().map((t, i) => ({
      name: `Trip ${i + 1}`,
      kmPerL: +((t.actualDistanceKm! / (t.fuelConsumedL || 1))).toFixed(2),
    }));

  const costByVehicle = state.vehicles.map((v) => {
    const fuel = state.fuel.filter((f) => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
    const maint = state.maintenance.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
    const exp = state.expenses.filter((e) => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0);
    return { name: v.regNumber, cost: fuel + maint + exp };
  }).filter((x) => x.cost > 0).slice(0, 8);

  const avgCompliance = state.drivers.length
    ? Math.round(state.drivers.map((d) => driverCompliance(d).score).reduce((a, b) => a + b, 0) / state.drivers.length)
    : 0;
  const totalRevenue = state.trips.filter((t) => t.status === "Completed").reduce((s, t) => s + (t.revenue || 0), 0);


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={vType} onValueChange={setVType}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={vStatus} onValueChange={setVStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["Available", "On Trip", "In Shop", "Retired"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Active Vehicles" value={active} icon={Truck} />
        <Kpi label="Available" value={available} icon={CheckCircle2} />
        <Kpi label="In Maintenance" value={inShop} icon={Wrench} />
        <Kpi label="Active Trips" value={activeTrips} icon={RouteIcon} />
        <Kpi label="Pending Trips" value={pendingTrips} icon={Clock} />
        <Kpi label="Drivers On Duty" value={driversOnDuty} icon={Users} />
        <Kpi label="Fleet Utilization" value={`${utilization}%`} icon={Activity} hint="On-trip / filtered fleet" />
        {showSafety && <Kpi label="Avg Compliance" value={avgCompliance} icon={ShieldCheck} hint="Driver compliance index" />}
        {showFinance && <Kpi label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} hint="Completed trips" />}
        <Kpi label="Fleet Size" value={vehicles.length} icon={Truck} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Vehicle Status</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Trips by Status</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={tripStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Fuel Efficiency (km/L)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <LineChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="kmPerL" stroke={COLORS[1]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Operational Cost by Vehicle</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={costByVehicle}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="cost" fill={COLORS[2]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {state.audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet. Perform an action to see it here.</p>
          ) : (
            <ul className="space-y-2">
              {state.audit.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px]">{a.action}</Badge>
                    <span>{a.entity}</span>
                    <span className="text-xs text-muted-foreground">by {a.actor}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
