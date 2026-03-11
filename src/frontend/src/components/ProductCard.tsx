"use client";
import { useReadContract } from "wagmi";
import { contractAddresses } from "@/lib/wagmi";
import { agriChainAbi, STATE_COLORS } from "@/lib/contracts";
import { formatEther } from "viem";
import { Package, MapPin, User, ExternalLink } from "lucide-react";

interface Props {
  productId: bigint;
  onClick?: () => void;
}

export function ProductCard({ productId, onClick }: Props) {
  const { data, isLoading, error } = useReadContract({
    address: contractAddresses.agriChain,
    abi: agriChainAbi,
    functionName: "getProductBasic",
    args: [productId],
  });

  const { data: itemData } = useReadContract({
    address: contractAddresses.agriChain,
    abi: agriChainAbi,
    functionName: "fetchItem",
    args: [productId],
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
        <div className="h-3 bg-slate-100 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    );
  }

  if (!data) return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <p className="text-xs text-slate-400">Loading product #{productId.toString()}...</p>
    </div>
  );

  const [farmerName, cropType, originLocation, price, stateLabel] = data as [string, string, string, bigint, string];

  // Find state number from label for color
  const stateNum = ["Produced by Farmer","For Sale by Farmer","Purchased by Distributor","Shipped by Farmer","Received by Distributor","Processed by Distributor","Packaged by Distributor","For Sale by Distributor","Purchased by Retailer","Shipped by Distributor","Received by Retailer","For Sale by Retailer","Purchased by Consumer"].indexOf(stateLabel);
  const stateColor = STATE_COLORS[stateNum] ?? "bg-slate-100 text-slate-600";

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:shadow-md hover:border-green-200 ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
            <Package className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 mono">Product #{productId.toString()}</p>
            <p className="font-semibold text-slate-800">{cropType}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stateColor}`}>{stateLabel}</span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <User className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{farmerName || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{originLocation || "—"}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">
          {formatEther(price ?? 0n)} ETH
        </span>
        {onClick && <ExternalLink className="w-3.5 h-3.5 text-slate-300" />}
      </div>
    </div>
  );
}
