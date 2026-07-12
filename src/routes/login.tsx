import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const demoAccounts = [
  { role: "Admin", email: "admin@transitops.dev", password: "admin123" },
  { role: "Fleet Manager", email: "manager@transitops.dev", password: "manager123" },
  { role: "Safety Officer", email: "safety@transitops.dev", password: "safety123" },
  { role: "Financial Analyst", email: "finance@transitops.dev", password: "finance123" },
  { role: "Driver", email: "driver@transitops.dev", password: "driver123" },
];

function LoginPage() {
  const { login, currentUser } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("manager@transitops.dev");
  const [password, setPassword] = useState("manager123");

  useEffect(() => {
    if (currentUser) navigate({ to: "/dashboard", replace: true });
  }, [currentUser, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-primary/20 via-background to-background border-r">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">T</div>
          <span className="font-semibold">TransitOps</span>
        </div>
        <div>
          <Truck className="h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl font-bold leading-tight">Smart transport operations, unified.</h1>
          <p className="mt-3 text-muted-foreground max-w-md">Vehicles, drivers, trips, maintenance, fuel, and analytics — all in one operations console.</p>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} TransitOps</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use a demo account or your own credentials.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">Sign in</Button>
            </form>
            <div className="mt-6">
              <div className="text-xs font-medium text-muted-foreground mb-2">Demo accounts</div>
              <div className="grid gap-1">
                {demoAccounts.map((a) => (
                  <button key={a.email} type="button" onClick={() => { setEmail(a.email); setPassword(a.password); }}
                    className="text-left text-xs px-3 py-2 rounded-md border hover:bg-accent transition">
                    <span className="font-medium">{a.role}</span> — {a.email}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
