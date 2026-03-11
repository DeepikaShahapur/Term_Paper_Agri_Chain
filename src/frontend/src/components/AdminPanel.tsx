"use client";
import { useState } from "react";
import { useAgriChain } from "@/hooks/useAgriChain";
import { Users, CheckCircle, XCircle, Loader2 } from "lucide-react";

export function AdminPanel() {
  const { address, addFarmer, addDistributor, addRetailer, addConsumer, verifyUser, unverifyUser, isPending } = useAgriChain();
  const [target, setTarget] = useState("");
  const [msg,    setMsg]    = useState("");

  const act = (fn: (a: `0x${string}`) => void, label: string) => {
    if (!target.startsWith("0x") || target.length !== 42) return setMsg("Enter a valid 0x address.");
    fn(target as `0x${string}`);
    setMsg(`${label} transaction sent!`);
    setTimeout(() => setMsg(""), 4000);
  };

  const BtnGroup = ({ label, actions }: { label: string; actions: { text: string; fn: () => void; variant?: "danger" }[] }) => (
    <div className="rounded-2xl border border-slate-100 p-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ text, fn, variant }) => (
          <button
            key={text}
            onClick={fn}
            disabled={isPending}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
              variant === "danger"
                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : text}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-rose-500" />
        <h3 className="font-bold text-slate-800">Admin Panel</h3>
        <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium">Owner Only</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Target Address</label>
        <div className="flex gap-2">
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="0x…"
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm mono focus:outline-none focus:border-green-400"
          />
          <button
            onClick={() => setTarget(address ?? "")}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Use Mine
          </button>
        </div>
      </div>

      {msg && <p className="text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2">{msg}</p>}

      <BtnGroup label="Assign Role" actions={[
        { text: "Add Farmer",      fn: () => act(addFarmer,      "Add Farmer") },
        { text: "Add Distributor", fn: () => act(addDistributor, "Add Distributor") },
        { text: "Add Retailer",    fn: () => act(addRetailer,    "Add Retailer") },
        { text: "Add Consumer",    fn: () => act(addConsumer,    "Add Consumer") },
      ]} />

      <BtnGroup label="Verification" actions={[
        { text: "✓ Verify User",   fn: () => act(verifyUser,   "Verify") },
        { text: "✗ Unverify User", fn: () => act(unverifyUser, "Unverify"), variant: "danger" },
      ]} />
    </div>
  );
}
