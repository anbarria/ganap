"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Beef, MapPin, Store, Users, BarChart3, Menu, X, LogOut } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { useProfile } from "../../lib/useProfile";
import { ROL_LABEL } from "../../lib/helpers";

const LINKS = [
  { href: "/dashboard", label: "Inicio", icon: Home, exact: true },
  { href: "/dashboard/ganado", label: "Ganado", icon: Beef },
  { href: "/dashboard/fincas", label: "Fincas y Hatos", icon: MapPin },
  { href: "/dashboard/mercado", label: "Mercado", icon: Store },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useProfile();
  const [mobileNav, setMobileNav] = useState(false);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const links = [...LINKS];
  if (profile && ["superadmin", "propietario", "administrador"].includes(profile.rol)) {
    links.push({ href: "/dashboard/usuarios", label: "Usuarios", icon: Users });
  }

  function isActive(link) {
    return link.exact ? pathname === link.href : pathname.startsWith(link.href);
  }

  return (
    <div className="h-screen w-full bg-stone-100 flex overflow-hidden font-sans">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 text-stone-200 shrink-0">
        <Brand />
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((l) => (
            <NavItem key={l.href} link={l} active={isActive(l)} />
          ))}
        </nav>
        <UserFooter profile={profile} loading={loading} onLogout={logout} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-slate-950 text-stone-100 flex items-center justify-between px-4 h-14">
        <Brand compact />
        <button onClick={() => setMobileNav(true)} className="p-2">
          <Menu size={22} />
        </button>
      </div>

      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileNav(false)}>
          <div
            className="absolute right-0 top-0 h-full w-64 bg-slate-950 text-stone-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileNav(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 space-y-1">
              {links.map((l) => (
                <NavItem key={l.href} link={l} active={isActive(l)} onClick={() => setMobileNav(false)} />
              ))}
            </nav>
            <UserFooter profile={profile} loading={loading} onLogout={logout} />
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-slate-950 text-slate-300 flex justify-around items-center h-16 px-1">
        {LINKS.map((l) => (
          <BottomTab key={l.href} link={l} active={isActive(l)} />
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pt-14 pb-20 md:pt-0 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

function Brand({ compact }) {
  return (
    <div className={`flex items-center gap-2 px-4 ${compact ? "" : "h-16 border-b border-slate-800"}`}>
      <div className="h-8 w-8 rounded-md bg-amber-500 flex items-center justify-center shrink-0">
        <Beef size={18} className="text-slate-950" />
      </div>
      <div>
        <p className="font-serif font-bold text-amber-400 leading-tight text-sm">GANAP</p>
        {!compact && <p className="text-[10px] text-slate-400 tracking-wide">Gestión ganadera</p>}
      </div>
    </div>
  );
}

function NavItem({ link, active, onClick }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
        active ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"
      }`}
    >
      <Icon size={18} />
      {link.label}
    </Link>
  );
}

function BottomTab({ link, active }) {
  const Icon = link.icon;
  return (
    <Link href={link.href} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg ${active ? "text-amber-400" : "text-slate-400"}`}>
      <Icon size={20} />
      <span className="text-[10px] font-medium">{link.label}</span>
    </Link>
  );
}

function UserFooter({ profile, loading, onLogout }) {
  return (
    <div className="border-t border-slate-800 p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-xs">
          {loading ? "…" : (profile?.nombre || "?").split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-stone-100 truncate">{loading ? "Cargando…" : profile?.nombre}</p>
          <p className="text-[10px] text-slate-400">{profile ? ROL_LABEL[profile.rol] : ""}</p>
        </div>
      </div>
      <button onClick={onLogout} className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 px-1 py-1">
        <LogOut size={13} /> Cerrar sesión
      </button>
    </div>
  );
}
