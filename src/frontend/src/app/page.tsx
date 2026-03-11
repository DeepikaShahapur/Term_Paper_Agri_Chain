"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { WalletConnect } from "@/components/WalletConnect";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { RegisterProductForm } from "@/components/RegisterProductForm";
import { AdminPanel } from "@/components/AdminPanel";
import { useAgriChain } from "@/hooks/useAgriChain";
import { USER_ROLES } from "@/lib/contracts";
import {
  Leaf, Package, Users, Shield, Zap, TrendingUp, Globe, CheckCircle,
  BarChart3, Plus, RefreshCw, AlertCircle, ChevronRight,
} from "lucide-react";

export default function Home() {
  const { isConnected } = useAccount();
  const { role, isVerified, userProducts, totalProducts } = useAgriChain();
  const [tab, setTab]           = useState<"overview" | "products" | "admin">("overview");
  const [selectedId, setSelectedId] = useState<bigint | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Deduplicate product IDs (same address can appear multiple times as different roles)
  const uniqueProducts = [...new Set(userProducts.map(id => id.toString()))].map(BigInt);
  const canCreate = (role === USER_ROLES.FARMER || role === USER_ROLES.OWNER) && isVerified;
  const isOwner   = role === USER_ROLES.OWNER;

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* ── Nav ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center shadow-sm shadow-green-200">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg leading-none">AgriChain</span>
              <span className="ml-2 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">v2.0</span>
            </div>
          </div>

          {isConnected && (
            <nav className="hidden md:flex items-center gap-1">
              {(["overview", "products"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                    tab === t ? "bg-green-50 text-green-700" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t}
                </button>
              ))}
              {isOwner && (
                <button
                  onClick={() => setTab("admin")}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    tab === "admin" ? "bg-rose-50 text-rose-700" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Admin
                </button>
              )}
            </nav>
          )}

          <WalletConnect />
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Not connected ── */}
        {!isConnected && <LandingHero />}

        {/* ── Connected ── */}
        {isConnected && (
          <>
            {/* Mobile tabs */}
            <div className="flex gap-1 mb-6 md:hidden">
              {(["overview", "products"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize ${tab === t ? "bg-green-50 text-green-700" : "bg-white border border-slate-200 text-slate-500"}`}
                >{t}</button>
              ))}
              {isOwner && (
                <button onClick={() => setTab("admin")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium ${tab === "admin" ? "bg-rose-50 text-rose-700" : "bg-white border border-slate-200 text-slate-500"}`}
                >Admin</button>
              )}
            </div>

            {/* Not verified warning */}
            {!isVerified && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Account not verified</p>
                  <p className="text-xs text-amber-600 mt-0.5">Ask the contract owner to verify your address before creating or transacting with products.</p>
                </div>
              </div>
            )}

            {/* ── Overview tab ── */}
            {tab === "overview" && (
              <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Products",   value: totalProducts.toString(), icon: Package,    color: "text-blue-500",   bg: "bg-blue-50"   },
                    { label: "Your Products",     value: uniqueProducts.length,      icon: TrendingUp, color: "text-green-500",  bg: "bg-green-50"  },
                    { label: "Role",              value: role,                     icon: Shield,     color: "text-purple-500", bg: "bg-purple-50" },
                    { label: "Verified",          value: isVerified ? "Yes" : "No",icon: CheckCircle,color: isVerified ? "text-emerald-500" : "text-rose-400", bg: isVerified ? "bg-emerald-50" : "bg-rose-50" },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5">
                      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <p className="text-2xl font-bold text-slate-800 mb-0.5">{String(value)}</p>
                      <p className="text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div>
                  <h2 className="font-bold text-slate-800 mb-3">Quick Actions</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {canCreate && (
                      <ActionCard
                        icon={<Plus className="w-5 h-5 text-green-600" />}
                        bg="bg-green-50"
                        title="Register Product"
                        desc="Add a new crop to the chain"
                        onClick={() => { setTab("products"); setShowForm(true); }}
                      />
                    )}
                    <ActionCard
                      icon={<Package className="w-5 h-5 text-blue-600" />}
                      bg="bg-blue-50"
                      title="View Products"
                      desc="Manage your inventory"
                      onClick={() => setTab("products")}
                    />
                    {isOwner && (
                      <ActionCard
                        icon={<Users className="w-5 h-5 text-rose-600" />}
                        bg="bg-rose-50"
                        title="Admin Tools"
                        desc="Manage roles & verification"
                        onClick={() => setTab("admin")}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Products tab ── */}
            {tab === "products" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-800">
                    {uniqueProducts.length === 0 ? "No Products Yet" : `Your Products (${uniqueProducts.length})`}
                  </h2>
                  {canCreate && (
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />Register
                    </button>
                  )}
                </div>

                {showForm && (
                  <div className="rounded-2xl border border-green-100 bg-green-50/30 p-5">
                    <RegisterProductForm onClose={() => setShowForm(false)} />
                  </div>
                )}

                {uniqueProducts.length === 0 && !showForm ? (
                  <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center">
                    <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="font-semibold text-slate-400">No products yet</p>
                    {canCreate && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />Register First Product
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uniqueProducts.map((id) => (
                      <ProductCard key={id.toString()} productId={id} onClick={() => setSelectedId(id)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Admin tab ── */}
            {tab === "admin" && isOwner && (
              <div className="max-w-xl">
                <div className="rounded-2xl border border-slate-100 bg-white p-6">
                  <AdminPanel />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Features section - always visible */}
      {!isConnected && <FeaturesSection />}

      {/* Footer */}
      <footer className="border-t border-slate-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-500" />
            <span className="font-bold text-slate-700">AgriChain</span>
          </div>
          <p className="text-xs text-slate-400">
            Built on Ethereum · Solidity ^0.8.24 · Hardhat v2.22+ · No MetaMask lock-in
          </p>
        </div>
      </footer>

      {/* Product modal */}
      {selectedId !== null && (
        <ProductModal productId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ActionCard({ icon, bg, title, desc, onClick }: { icon: React.ReactNode; bg: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-md hover:border-slate-200 transition-all group">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </button>
  );
}

function LandingHero() {
  return (
    <div className="text-center py-16 max-w-2xl mx-auto">
      <div className="w-20 h-20 rounded-3xl bg-green-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
        <Leaf className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
        Agricultural Supply Chain<br />
        <span className="text-green-600">on the Blockchain</span>
      </h1>
      <p className="text-lg text-slate-500 mb-8 leading-relaxed">
        Complete traceability from farm to consumer — with escrow-protected payments,
        reputation scores, and IPFS metadata. No MetaMask required.
      </p>
      <p className="text-sm text-slate-400 bg-slate-100 rounded-2xl px-4 py-3 inline-block">
        Connect any browser wallet above to get started.
      </p>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    { icon: <Shield className="w-5 h-5 text-green-600" />, bg: "bg-green-50", title: "Complete Traceability", items: ["13-state lifecycle", "IPFS metadata", "QR-scan friendly"] },
    { icon: <Zap className="w-5 h-5 text-blue-600" />,    bg: "bg-blue-50",  title: "Escrow Payments",    items: ["Secure escrow", "Dispute resolution", "Auto-refunds"] },
    { icon: <Users className="w-5 h-5 text-purple-600" />,bg: "bg-purple-50",title: "Reputation System",  items: ["5-star ratings", "Transaction history", "Verified reviews"] },
    { icon: <Globe className="w-5 h-5 text-teal-600" />,  bg: "bg-teal-50",  title: "Multi-Network",     items: ["Hardhat local", "Polygon Amoy", "Mainnet ready"] },
  ];

  return (
    <section className="border-t border-slate-100 bg-white mt-12">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Why AgriChain?</h2>
        <p className="text-slate-400 text-center mb-10 max-w-xl mx-auto text-sm">Production-ready smart contracts combined with a seamless frontend — no lock-in to any specific wallet.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon, bg, title, items }) => (
            <div key={title} className="rounded-2xl border border-slate-100 p-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>{icon}</div>
              <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
