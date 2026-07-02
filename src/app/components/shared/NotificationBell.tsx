import { useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import {
  NOTIFICATIONS_BY_VARIANT,
  type NotificationVariant,
} from "../../data/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const TYPE_STYLES = {
  alert: "bg-amber-50 border-amber-100 text-amber-800",
  info: "bg-sky-50 border-sky-100 text-sky-800",
  success: "bg-emerald-50 border-emerald-100 text-emerald-800",
} as const;

interface NotificationBellProps {
  variant: NotificationVariant;
  buttonClassName?: string;
  iconClassName?: string;
  badgeClassName?: string;
  align?: "start" | "center" | "end";
}

export function NotificationBell({
  variant,
  buttonClassName = "w-10 h-10 rounded-xl bg-white/60 border border-sky-100 flex items-center justify-center relative hover:bg-white/80 transition-colors",
  iconClassName = "w-5 h-5 text-sky-500",
  badgeClassName = "absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full",
  align = "end",
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const items = NOTIFICATIONS_BY_VARIANT[variant];
  const unreadCount = useMemo(
    () => items.filter((n) => n.unread && !readIds.has(n.id)).length,
    [items, readIds]
  );

  const markAllRead = () => {
    setReadIds(new Set(items.map((n) => n.id)));
  };

  const markRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={buttonClassName} aria-label="通知">
          <Bell className={iconClassName} />
          {unreadCount > 0 && <span className={badgeClassName} />}
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-80 p-0 overflow-hidden z-[100]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <p className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>
              通知
            </p>
            {unreadCount > 0 && (
              <p className="text-slate-400 text-xs">{unreadCount} 則未讀</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              全部已讀
            </button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">目前沒有通知</p>
          ) : (
            items.map((n) => {
              const isUnread = n.unread && !readIds.has(n.id);
              const typeStyle = TYPE_STYLES[n.type ?? "info"];
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                    isUnread ? "bg-slate-50/80" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                    )}
                    <div className={`flex-1 min-w-0 ${isUnread ? "" : "pl-4"}`}>
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-slate-800 text-sm truncate" style={{ fontWeight: 600 }}>
                          {n.title}
                        </p>
                        <span className="text-slate-400 text-[10px] flex-shrink-0 whitespace-nowrap">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">{n.body}</p>
                      {n.type && (
                        <span
                          className={`inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded border ${typeStyle}`}
                        >
                          {n.type === "alert" ? "需注意" : n.type === "success" ? "好消息" : "提醒"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
