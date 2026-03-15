import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "../api/axios.js";

function cx(...c) { return c.filter(Boolean).join(" "); }

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  async function fetchNotifications() {
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data?.notifications || []);
      setUnread(res.data?.unreadCount || 0);
    } catch {}
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      try { await api.patch("/api/notifications/read"); setUnread(0); setNotifications((n) => n.map((x) => ({ ...x, is_read: true }))); }
      catch {}
    }
  }

  function handleClick(n) {
    setOpen(false);
    if (n.query_id) navigate(`/queries/${n.query_id}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {notifications.length > 0 && (
              <span className="text-xs text-slate-400">{notifications.length} total</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cx(
                    "w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800 transition-colors",
                    !n.is_read && "bg-indigo-950/30"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />}
                    <div className={cx("flex-1 min-w-0", n.is_read && "pl-4")}>
                      <p className="text-sm text-slate-200 break-words">{n.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
