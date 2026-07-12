import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/_app/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const { state } = useStore();
  const grouped = state.audit.reduce<Record<string, typeof state.audit>>((acc, a) => {
    const d = new Date(a.at).toLocaleDateString();
    (acc[d] ||= []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" />Activity Timeline</CardTitle></CardHeader>
        <CardContent>
          {state.audit.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{date}</div>
                  <ol className="relative border-l border-border ml-2 space-y-4">
                    {items.map((a) => (
                      <li key={a.id} className="ml-4">
                        <span className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary" />
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono">{a.action}</Badge>
                          <span className="text-sm">{a.entity}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">by {a.actor} · {new Date(a.at).toLocaleTimeString()}</div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
