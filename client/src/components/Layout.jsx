import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LayoutDashboard, Plus, Settings, LogOut, Shield, Menu, X, BookOpen } from "lucide-react";
import NotificationBell from "./NotificationBell.jsx";

function cx(...c) { return c.filter(Boolean).join(" "); }

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const authPaths = ["/login", "/register"];
  if (authPaths.some((p) => location.pathname.startsWith(p))) {
    return <>{children}</>;
  }

  const role = user?.role || "";
  const isStudent    = role === "student" || role === "member";
  const isAdminLevel = role === "admin" || role === "superadmin";
  const isSuperadmin = role === "superadmin";

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const navLink = (to, label, Icon) => (
    <Link to={to} onClick={() => setMenuOpen(false)}
      className={cx(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
        isActive(to)
          ? "bg-indigo-600 text-white"
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      )}>
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );

  return (
    <div className="layout-wrapper">
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo only on left */}
            <img
              src="https://www.ecell.in/assets/images/logo.webp"
              alt="E-Cell IIT Bombay"
              className="h-10 w-auto cursor-pointer"
              onClick={() => navigate("/dashboard")}
            />

            {/* Right side: nav links + avatar + logout */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1">
                {navLink("/dashboard", "Dashboard", LayoutDashboard)}
                {isStudent && navLink("/queries/new", "New Query", Plus)}
                {navLink("/faq", "FAQ", BookOpen)}
                {isAdminLevel && navLink("/admin", isSuperadmin ? "Superadmin Panel" : "Admin Panel", isSuperadmin ? Shield : Settings)}
              </div>

              {user && (
                <>
                  <NotificationBell />
                  <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md ml-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold text-white leading-none">{user.name}</p>
                      <p className="text-xs text-slate-400 capitalize mt-0.5">{user.role}</p>
                    </div>
                  </div>
                  <button onClick={logout}
                    className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-sm font-medium rounded-md transition-all">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              )}

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="md:hidden p-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="md:hidden pb-4 pt-1 border-t border-slate-700 space-y-1">
              {navLink("/dashboard", "Dashboard", LayoutDashboard)}
              {isStudent && navLink("/queries/new", "New Query", Plus)}
              {navLink("/faq", "FAQ", BookOpen)}
              {isAdminLevel && navLink("/admin", isSuperadmin ? "Superadmin Panel" : "Admin Panel", isSuperadmin ? Shield : Settings)}
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
