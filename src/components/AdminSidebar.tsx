"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, BarChart3, LogOut,
  Building2, Package, FilePlus, Settings, Menu, X, CreditCard, TrendingUp,
  Truck, ClipboardList, FolderOpen, History,
  RefreshCw, Receipt, UserCheck, CalendarDays, Target, Bell, Mail, Clock,
  ChevronDown, ChevronRight,
} from "lucide-react";

const adminNavItems = [
  { label: "Admin Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Client Accounts", href: "/admin-clients", icon: Users },
  { label: "All Firms", href: "/admin-firms", icon: Building2 },
  { label: "All Parties", href: "/admin-parties", icon: Users },
  { label: "All Products", href: "/admin-products", icon: Package },
  { label: "All Invoices", href: "/admin-invoices", icon: FileText },
  { label: "Recurring Invoices", href: "/admin-recurring-invoices", icon: RefreshCw },
  { label: "All Expenses", href: "/admin-expenses", icon: Receipt },
  { label: "Profit & Loss", href: "/admin-profit-loss", icon: TrendingUp },
  { label: "Aging Report", href: "/admin-aging-report", icon: Clock },
  { label: "Bill Manager", href: "/admin-bill-manager", icon: FolderOpen },
  { label: "All Employees", href: "/admin-employees", icon: UserCheck },
  { label: "Salary Slips", href: "/admin-salary-slips", icon: CreditCard },
  { label: "Attendance", href: "/admin-attendance", icon: CalendarDays },
  { label: "All Leads", href: "/admin-leads", icon: Target },
  { label: "Follow-ups", href: "/admin-follow-ups", icon: Bell },
  { label: "Email Templates", href: "/admin-email-templates", icon: Mail },
  { label: "All Inventory", href: "/admin-inventory", icon: ClipboardList },
  { label: "All E-Way Bills", href: "/admin-eway-bills", icon: Truck },
  { label: "GSTR Reports", href: "/admin-gstr-reports", icon: BarChart3 },
  { label: "Reports", href: "/admin-reports", icon: BarChart3 },
  { label: "Analytics", href: "/admin-analytics", icon: TrendingUp },
  { label: "All Documents", href: "/admin-documents", icon: History },
  { label: "Document History", href: "/admin-document-history", icon: History },
  { label: "Document Settings", href: "/admin-document-settings", icon: FolderOpen },
  { label: "Site Settings", href: "/admin-site-settings", icon: CreditCard },
];

const clientNavItems = [
  { label: "My Firms", href: "/my-firms", icon: Building2 },
  { label: "Bill To (Parties)", href: "/customers", icon: Users },
  { label: "Products", href: "/products", icon: Package },
  { label: "Inventory", href: "/inventory", icon: ClipboardList },
  { label: "Create Invoice", href: "/create-invoice", icon: FilePlus },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Recurring Invoices", href: "/recurring-invoices", icon: RefreshCw },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Profit & Loss", href: "/profit-loss", icon: TrendingUp },
  { label: "Aging Report", href: "/aging-report", icon: Clock },
  { label: "E-Way Bills", href: "/eway-bills", icon: Truck },
  { label: "GSTR Reports", href: "/gstr-reports", icon: BarChart3 },
  { label: "Employees", href: "/employees", icon: UserCheck },
  { label: "Salary Slips", href: "/salary-slips", icon: CreditCard },
  { label: "Attendance", href: "/attendance", icon: CalendarDays },
  { label: "Leads", href: "/leads", icon: Target },
  { label: "Follow-ups", href: "/follow-ups", icon: Bell },
  { label: "Email Templates", href: "/email-templates", icon: Mail },
  { label: "Documents", href: "/documents", icon: FolderOpen },
  { label: "Document History", href: "/document-history", icon: History },
  { label: "Invoice Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showClient, setShowClient] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 bg-slate-900 text-white p-2 rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
      )}

      <aside className={`fixed left-0 top-0 h-screen w-[250px] bg-slate-900 text-white flex flex-col z-50 overflow-y-auto transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}>
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">GST Bill Manager</h1>
            <p className="text-xs text-slate-400 mt-0.5">Admin Panel</p>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          <p className="px-3 pt-1 pb-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Admin</p>
          {adminNavItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-slate-700">
            <button onClick={() => setShowClient(!showClient)}
              className="flex items-center justify-between w-full px-3 pt-1 pb-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold hover:text-slate-300 transition">
              <span>Client Panel Access</span>
              {showClient ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {showClient && clientNavItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    active ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white w-full transition">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
