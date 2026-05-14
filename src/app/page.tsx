import Link from "next/link";
import {
  FileText,
  Building2,
  Users,
  Calculator,
  PenTool,
  Image,
  Search,
  Repeat,
  ToggleLeft,
  Shield,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  IndianRupee,
  Sparkles,
  ClipboardList,
  Truck,
  QrCode,
  Bell,
  Download,
  Share2,
  Save,
  Package,
} from "lucide-react";
import PricingSection from "@/components/PricingSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)" }}>
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900">GST Bill Manager</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-cyan-600 transition">Features</a>
            <a href="#how-it-works" className="hover:text-cyan-600 transition">How It Works</a>
            <a href="#pricing" className="hover:text-cyan-600 transition">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-semibold text-cyan-600 hover:bg-cyan-50 rounded-lg transition">
              Login
            </Link>
            <Link href="/login" className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all" style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)" }}>
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 40%, #06b6d4 70%, #10b981 100%)" }}>
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)" }} />
        <div className="absolute top-[40%] left-[55%] w-[350px] h-[350px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #fb923c 0%, transparent 70%)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/25">
            <Zap className="w-4 h-4 text-amber-300" />
            India&apos;s Simplest GST Billing Software
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
            Create GST Invoices<br />
            <span className="text-amber-300">in Seconds</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Professional Indian GST bills with GSTIN auto-fill, inventory management, E-Way Bills,
            GSTR reports, payment reminders, WhatsApp share & PDF download. Complete GST solution!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold transition shadow-xl hover:shadow-2xl hover:scale-105 text-white" style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
              Start Free <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 text-white px-6 py-4 rounded-xl text-lg font-medium hover:bg-white/10 transition border-2 border-white/30 backdrop-blur-sm">
              See Features
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-300" /> Free to use</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-300" /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-300" /> Indian format</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80V40C240 10 480 0 720 20C960 40 1200 50 1440 30V80H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 bg-cyan-50 text-cyan-700 border border-cyan-100">
              <Sparkles className="w-3.5 h-3.5" /> FEATURES
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">25+ Features for Complete GST Management</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Everything from invoice creation to GSTR reports, inventory management, and E-Way Bills — all in one platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[
              { icon: Search, title: "GSTIN Auto-Fill", desc: "Enter GST number — State, PAN auto-fill instantly. No manual typing of party details.", bg: "#ecfdf5", iconColor: "#10b981" },
              { icon: FileText, title: "10+ Document Types", desc: "Tax Invoice, Credit/Debit Note, Quotation, Proforma, Delivery Challan, Purchase Bill & more.", bg: "#fff7ed", iconColor: "#f97316" },
              { icon: Building2, title: "My Firms", desc: "Add multiple firms with GSTIN, PAN, bank details. Switch between firms for invoicing.", bg: "#eef9ff", iconColor: "#0ea5e9" },
              { icon: Users, title: "Bill To (Parties)", desc: "Save all your parties/clients with GST details. Select and bill in one click.", bg: "#f0fdfa", iconColor: "#0d9488" },
              { icon: ClipboardList, title: "Inventory Management", desc: "Track stock in/out, purchase & selling price, low stock alerts. Item-wise stock reports.", bg: "#fef3c7", iconColor: "#d97706" },
              { icon: Truck, title: "E-Way Bill", desc: "Generate E-Way Bills from invoices. Vehicle number, transporter, distance tracking.", bg: "#fce7f3", iconColor: "#ec4899" },
              { icon: BarChart3, title: "GSTR Reports", desc: "GSTR-1, GSTR-3B, HSN Summary reports. CSV/Excel export ready for filing.", bg: "#ede9fe", iconColor: "#8b5cf6" },
              { icon: Bell, title: "Payment Reminders", desc: "Send WhatsApp reminders for pending payments. Track paid/unpaid/partial status.", bg: "#fef2f2", iconColor: "#ef4444" },
              { icon: Share2, title: "WhatsApp Share", desc: "Share invoices directly on WhatsApp with formatted message, amount & link.", bg: "#dcfce7", iconColor: "#16a34a" },
              { icon: Download, title: "PDF Download", desc: "Download invoices as high-quality A4 PDF. Print or share digitally.", bg: "#e0f2fe", iconColor: "#0284c7" },
              { icon: QrCode, title: "E-Invoice QR Code", desc: "Auto QR code on tax invoices for e-invoice compliance. IRN ready.", bg: "#eef2ff", iconColor: "#6366f1" },
              { icon: Package, title: "Tally Export", desc: "Export data in Tally-compatible XML & CSV format. Easy import to Tally.", bg: "#f0fdfa", iconColor: "#0d9488" },
              { icon: Calculator, title: "GST Include / Exclude", desc: "Enter amount with GST included or excluded. Auto reverse-calculation.", bg: "#fef3c7", iconColor: "#d97706" },
              { icon: Save, title: "Auto-Save Forms", desc: "All forms auto-save while typing. Navigate away — data stays. No data loss ever.", bg: "#ecfdf5", iconColor: "#10b981" },
              { icon: PenTool, title: "Director Signatures", desc: "Upload director signatures per firm. Select signature on each invoice.", bg: "#fef2f2", iconColor: "#ef4444" },
              { icon: Image, title: "Company Letterhead", desc: "Upload your letterhead. Invoice prints with your letterhead as background.", bg: "#e0f2fe", iconColor: "#0284c7" },
              { icon: IndianRupee, title: "Tally-Style Format", desc: "Indian GST invoice format like Tally. Bordered tables, HSN summary, Amount in Words.", bg: "#dcfce7", iconColor: "#16a34a" },
              { icon: Repeat, title: "Repeat Last Bill", desc: "Same firm + party? Settings auto-fill from last bill. Just enter new amount.", bg: "#fef9c3", iconColor: "#ca8a04" },
              { icon: ToggleLeft, title: "GST / Non-GST", desc: "Support for both GST and Non-GST firms. Toggle per firm or party.", bg: "#fce7f3", iconColor: "#ec4899" },
              { icon: Shield, title: "Admin Panel", desc: "Full admin access to all clients' data. View, edit, delete — complete control.", bg: "#ede9fe", iconColor: "#8b5cf6" },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 group bg-white hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300" style={{ background: f.bg }}>
                  <f.icon className="w-6 h-6" style={{ color: f.iconColor }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-500">From GSTIN to PDF invoice in under 30 seconds</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Add Your Firms", desc: "Add your company details — GSTIN, PAN, bank info, director signatures, letterhead. Save once, use forever.", gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)" },
              { step: "2", title: "Add Your Parties", desc: "Add your clients/customers with their GST details. Both GST and Non-GST parties supported.", gradient: "linear-gradient(135deg, #f59e0b, #f97316)" },
              { step: "3", title: "Create Invoice", desc: "Select firm → Select party → Enter amount → Done! GST auto-calculated, Indian format, ready to print.", gradient: "linear-gradient(135deg, #10b981, #14b8a6)" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg"
                  style={{ background: s.gradient }}>
                  {s.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 50%, #10b981 100%)" }}>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why GST Bill Manager?</h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">Complete GST solution — invoicing, inventory, E-Way Bills, GSTR reports, and more.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "Super Fast", desc: "Invoice ready in 30 seconds", color: "text-amber-300" },
              { icon: ClipboardList, title: "20+ Features", desc: "Invoice, Inventory, E-Way, GSTR", color: "text-emerald-300" },
              { icon: Shield, title: "100% Accurate", desc: "Auto GST calculation + HSN codes", color: "text-cyan-200" },
              { icon: Star, title: "Free to Start", desc: "No credit card required", color: "text-orange-300" },
            ].map((f) => (
              <div key={f.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/15 hover:bg-white/20 transition-all duration-300">
                <f.icon className={`w-8 h-8 mx-auto mb-3 ${f.color}`} />
                <h3 className="font-semibold text-lg mb-1 text-white">{f.title}</h3>
                <p className="text-sm text-white/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — dynamic from admin settings */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-20" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 drop-shadow-lg">Ready to Simplify Your GST Billing?</h2>
          <p className="text-lg text-white/80 mb-8">Join businesses across India who trust GST Bill Manager for their invoicing needs.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/90 transition shadow-xl hover:shadow-2xl hover:scale-105">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)" }}>
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white">GST Bill Manager</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
              <a href="#pricing" className="hover:text-white transition">Pricing</a>
              <Link href="/login" className="hover:text-white transition">Login</Link>
            </div>
            <p className="text-sm">&copy; {new Date().getFullYear()} GST Bill Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
