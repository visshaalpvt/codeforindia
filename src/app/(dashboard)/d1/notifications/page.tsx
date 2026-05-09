"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  Radio,
  FileText,
  CheckCheck,
  MapPin,
  Camera,
  X,
  Phone,
  ToggleLeft,
  ToggleRight,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { useData } from "@/lib/store";
import { getSocket } from "@/lib/socket";
import type { Notification, NotificationType } from "@/types";

type FilterTab = NotificationType | "all" | "resolved";

const tabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "alert", label: "Alerts" },
  { id: "sensor", label: "Sensors" },
  { id: "evidence", label: "Evidence" },
  { id: "system", label: "System" },
  { id: "resolved", label: "Resolved" },
];

const iconMap: Record<NotificationType, typeof Bell> = {
  system: Bell,
  alert: AlertTriangle,
  sensor: Radio,
  evidence: FileText,
  resolved: Bell,
};

const severityBarColor: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

function getSeverityForType(type: NotificationType, severity?: string): string {
  if (severity) return severity;
  if (type === "alert") return "warning";
  if (type === "sensor") return "info";
  if (type === "evidence") return "warning";
  return "info";
}

function ToastNotification({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const Icon = iconMap[notification.type] ?? Bell;
  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      className="pointer-events-auto backdrop-blur-xl bg-red-900/60 border border-red-500/30 rounded-xl p-4 shadow-xl shadow-red-500/10 w-full max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{notification.title}</p>
          <p className="text-xs text-gray-300 mt-0.5 line-clamp-2">{notification.description}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-500 hover:text-gray-300 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, dispatch } = useData();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [smsCritical, setSmsCritical] = useState(true);
  const [smsAll, setSmsAll] = useState(false);
  const toastId = useRef(0);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    if (activeTab === "resolved")
      return notifications.filter((n) => n.read);
    return notifications.filter((n) => n.type === activeTab);
  }, [notifications, activeTab]);

  const markAllRead = useCallback(() => {
    markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  const dismissNotification = useCallback((id: string) => {
    deleteNotification(id);
  }, [deleteNotification]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handler = (data: unknown) => {
      const notif = data as Notification;
      if (!notif.id) return;
      dispatch({ type: "ADD_NOTIFICATION", payload: notif });
      if (notif.severity === "critical") {
        const id = `toast-${++toastId.current}`;
        setToasts((prev) => [...prev, { ...notif, id }]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 6000);
      }
    };

    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notifications</h1>
          <p className="text-sm text-gray-400 mt-1">Stay informed about case activity and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            <span className="text-cyan-400 font-semibold">{unreadCount}</span> unread
          </span>
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400
              hover:bg-cyan-500/10 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark All Read
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === tab.id
                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                : "text-gray-400 hover:text-gray-300 border border-transparent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div layout className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-gray-500"
            >
              <Bell className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">No notifications</p>
            </motion.div>
          ) : (
            filteredNotifications.map((notif) => {
              const Icon = iconMap[notif.type] ?? Bell;
              const sev = getSeverityForType(notif.type, notif.severity);
              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={() => markNotificationRead(notif.id)}
                  className="relative glass rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-colors cursor-pointer"
                >
                  <div className="flex">
                    <div className={cn("w-1 shrink-0", severityBarColor[sev] ?? "bg-gray-500")} />
                    <div className="flex items-start gap-3 p-4 flex-1 min-w-0">
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                      )}
                      <div
                        className={cn(
                          "p-2 rounded-xl shrink-0",
                          sev === "critical"
                            ? "bg-red-500/20 text-red-400"
                            : sev === "warning"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-blue-500/20 text-blue-400"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={cn(
                              "text-sm",
                              !notif.read ? "font-bold text-white" : "font-medium text-gray-300"
                            )}
                          >
                            {notif.title}
                          </h3>
                          <span className="text-[10px] text-gray-500 shrink-0">
                            {timeAgo(notif.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                          {notif.description}
                        </p>
                        {notif.actionable && (
                          <div className="flex items-center gap-2 mt-2.5">
                            {notif.actionLabel && (
                              <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 text-[10px] font-medium transition-all">
                                {notif.actionLabel === "View on Map" && <MapPin className="w-3 h-3" />}
                                {notif.actionLabel === "View Snapshot" && <Camera className="w-3 h-3" />}
                                {notif.actionLabel === "Review" && <Eye className="w-3 h-3" />}
                                {notif.actionLabel === "View Evidence" && <FileText className="w-3 h-3" />}
                                {notif.actionLabel === "View Analysis" && <FileText className="w-3 h-3" />}
                                {notif.actionLabel}
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 text-[10px] font-medium transition-all"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Phone className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">GSM Alert Integration</h3>
            <p className="text-xs text-gray-400">SMS Integration &mdash; Twilio</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Critical alerts will be sent to: <span className="text-cyan-400 font-mono">+91-XXXXXXXXXX</span>
        </p>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-gray-300">Enable SMS for Critical alerts</span>
            <button
              onClick={() => setSmsCritical(!smsCritical)}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                smsCritical ? "bg-cyan-500" : "bg-gray-600"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                  smsCritical ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </label>
          <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-gray-300">Enable SMS for All alerts</span>
            <button
              onClick={() => setSmsAll(!smsAll)}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                smsAll ? "bg-cyan-500" : "bg-gray-600"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                  smsAll ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </label>
        </div>
      </motion.div>

      <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastNotification notification={t} onDismiss={() => dismissToast(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
