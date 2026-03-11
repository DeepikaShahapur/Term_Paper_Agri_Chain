"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useAgriChain } from "@/hooks/useAgriChain";
import { USER_ROLES } from "@/lib/contracts";
import { Wallet, ChevronDown, Copy, LogOut, Shield, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const ROLE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  [USER_ROLES.FARMER]:      { bg: "bg-emerald-50",  text: "text-emerald-700",  dot: "bg-emerald-500"  },
  [USER_ROLES.DISTRIBUTOR]: { bg: "bg-blue-50",     text: "text-blue-700",     dot: "bg-blue-500"     },
  [USER_ROLES.RETAILER]:    { bg: "bg-purple-50",   text: "text-purple-700",   dot: "bg-purple-500"   },
  [USER_ROLES.CONSUMER]:    { bg: "bg-amber-50",    text: "text-amber-700",    dot: "bg-amber-500"    },
  [USER_ROLES.OWNER]:       { bg: "bg-rose-50",     text: "text-rose-700",     dot: "bg-rose-500"     },
  [USER_ROLES.NONE]:        { bg: "bg-slate-50",    text: "text-slate-600",    dot: "bg-slate-400"    },
};

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { role, isVerified } = useAgriChain();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fmt = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
  const copy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const rs = ROLE_STYLES[role] ?? ROLE_STYLES[USER_ROLES.NONE];

  if (!isConnected) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-green-400 hover:text-green-700 transition-all shadow-sm"
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 p-3 z-50">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-2">Select Wallet</p>
            {connectors.length === 0 ? (
              <div className="flex items-center gap-2 px-2 py-3 text-sm text-slate-500">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                No wallet detected. Install a browser wallet to continue.
              </div>
            ) : (
              connectors.map((c) => (
                <button
                  key={c.uid}
                  onClick={() => { connect({ connector: c }); setOpen(false); }}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
                >
                  <Wallet className="w-4 h-4 text-slate-400" />
                  {c.name}
                </button>
              ))
            )}
            {connectError && (
              <p className="mt-2 px-2 text-xs text-red-500">{connectError.message}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm shadow-sm hover:border-green-300 transition-all"
      >
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${rs.dot}`} />
          <span className="font-mono text-xs text-slate-700">{fmt(address!)}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rs.bg} ${rs.text}`}>{role}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <p className="text-xs text-slate-400 mono mb-0.5">Connected</p>
            <p className="font-mono text-xs text-slate-600 break-all">{address}</p>
          </div>

          {/* Role + Verification */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rs.bg} ${rs.text}`}>{role}</span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${isVerified ? "text-emerald-600" : "text-rose-500"}`}>
              {isVerified
                ? <><CheckCircle className="w-3.5 h-3.5" /> Verified</>
                : <><AlertCircle className="w-3.5 h-3.5" /> Not Verified</>
              }
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button onClick={copy} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-sm text-slate-600 transition-colors">
              <Copy className="w-4 h-4" />{copied ? "Copied!" : "Copy Address"}
            </button>
            <button
              onClick={() => window.open(`https://amoy.polygonscan.com/address/${address}`, "_blank")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-sm text-slate-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />View on Explorer
            </button>
            <div className="my-1 h-px bg-slate-100" />
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 text-sm text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
