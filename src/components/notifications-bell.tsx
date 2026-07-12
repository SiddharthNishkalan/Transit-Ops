import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, AlertTriangle, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { buildNotifications } from "@/lib/derived";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificationsBell() {
  const { state } = useStore();
  const notifs = useMemo(() => buildNotifications(state), [state]);
  const highCount = notifs.filter((n) => n.severity === "high").length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {notifs.length > 0 && (
            <span className={`absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full text-[9px] font-bold grid place-items-center text-white ${highCount ? "bg-red-500" : "bg-amber-500"}`}>
              {notifs.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-semibold">Notifications</div>
          <Badge variant="outline" className="text-[10px]">{notifs.length}</Badge>
        </div>
        <ScrollArea className="max-h-80">
          {notifs.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">All clear. No alerts right now.</div>
          ) : (
            <ul>
              {notifs.map((n) => {
                const Icon = n.severity === "high" ? AlertTriangle : Clock;
                const color = n.severity === "high" ? "text-red-500" : n.severity === "medium" ? "text-amber-500" : "text-blue-400";
                const content = (
                  <div className="px-3 py-2.5 hover:bg-accent border-b last:border-0 flex gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{n.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{n.detail}</div>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? <Link to={n.link}>{content}</Link> : content}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
