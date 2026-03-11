"use client";
import { useState } from "react";
import { useAgriChain } from "@/hooks/useAgriChain";
import { Loader2, Plus, X } from "lucide-react";

interface Props { onClose: () => void; }

export function RegisterProductForm({ onClose }: Props) {
  const { produceItemByFarmer, isPending } = useAgriChain();
  const [form, setForm] = useState({
    farmerName: "", cropType: "", origin: "",
    price: "0.05", ipfs: "", deadline: "",
  });
  const [err, setErr] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.cropType.trim()) return setErr("Crop type is required.");
    if (!form.deadline)        return setErr("Shipping deadline is required.");
    const dl = BigInt(Math.floor(new Date(form.deadline).getTime() / 1000));
    if (dl <= BigInt(Math.floor(Date.now() / 1000))) return setErr("Deadline must be in the future.");
    setErr("");
    produceItemByFarmer(form.farmerName, form.cropType, form.origin, form.price, form.ipfs, dl);
  };

  const Field = ({ label, id, ...props }: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      <input
        {...props}
        id={id}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-green-400 transition-colors"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Register Product</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Farmer / Producer Name" id="farmerName" value={form.farmerName} onChange={set("farmerName")} placeholder="e.g. Rajesh Kumar" />
        <Field label="Crop / Product Type *"  id="cropType"   value={form.cropType}   onChange={set("cropType")}   placeholder="e.g. Wheat, Tomatoes" />
        <Field label="Origin Location"        id="origin"     value={form.origin}     onChange={set("origin")}     placeholder="e.g. Punjab, India" />
        <Field label="Price (ETH) *"          id="price"      value={form.price}      onChange={set("price")}      type="number" step="0.001" min="0.001" />
        <Field label="Shipping Deadline *"    id="deadline"   value={form.deadline}   onChange={set("deadline")}   type="datetime-local" />
        <Field label="IPFS Hash (optional)"   id="ipfs"       value={form.ipfs}       onChange={set("ipfs")}       placeholder="Qm…" />
      </div>

      {err && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{err}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {isPending ? "Registering…" : "Register Product"}
        </button>
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
