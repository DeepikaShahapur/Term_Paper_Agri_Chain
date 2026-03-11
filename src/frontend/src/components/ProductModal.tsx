"use client";
import { useReadContract } from "wagmi";
import { contractAddresses } from "@/lib/wagmi";
import { agriChainAbi, STATE_COLORS, USER_ROLES } from "@/lib/contracts";
import { useAgriChain } from "@/hooks/useAgriChain";
import { formatEther } from "viem";
import { X, Package, User, MapPin, DollarSign, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props { productId: bigint; onClose: () => void; }

const STATE_LABELS = [
  "Produced by Farmer","For Sale by Farmer","Purchased by Distributor",
  "Shipped by Farmer","Received by Distributor","Processed by Distributor",
  "Packaged by Distributor","For Sale by Distributor","Purchased by Retailer",
  "Shipped by Distributor","Received by Retailer","For Sale by Retailer",
  "Purchased by Consumer"
];

export function ProductModal({ productId, onClose }: Props) {
  const { role, isPending,
    sellItemByFarmer, shippedItemByFarmer,
    purchaseItemByDistributor, receivedItemByDistributor,
    processedItemByDistributor, packageItemByDistributor,
    sellItemByDistributor, shippedItemByDistributor,
    purchaseItemByRetailer, receivedItemByRetailer, sellItemByRetailer,
    purchaseItemByConsumer,
  } = useAgriChain();

  const [price, setPrice] = useState("0.05");
  const [slices, setSlices] = useState("10");

  const { data: basicData, isLoading } = useReadContract({
    address: contractAddresses.agriChain,
    abi: agriChainAbi,
    functionName: "getProductBasic",
    args: [productId],
  });

  const { data: fullData } = useReadContract({
    address: contractAddresses.agriChain,
    abi: agriChainAbi,
    functionName: "fetchItem",
    args: [productId],
  });

  if (isLoading) return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    </Overlay>
  );

  if (!basicData) return (
    <Overlay onClose={onClose}>
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <p className="text-slate-500 text-sm">Could not load product data.</p>
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-sm">Close</button>
      </div>
    </Overlay>
  );

  const [farmerName, cropType, originLocation, productPrice, stateLabel] =
    basicData as [string, string, string, bigint, string];

  const stateNum = STATE_LABELS.indexOf(stateLabel);
  const stateColor = STATE_COLORS[stateNum] ?? "bg-slate-100 text-slate-600";

  let farmerID = "", distributorID = "", retailerID = "", consumerID = "";
  let shippingDeadline = 0n;
  if (fullData) {
    const d = fullData as any[];
    farmerID = d[3] ?? ""; distributorID = d[11] ?? "";
    retailerID = d[12] ?? ""; consumerID = d[13] ?? "";
    shippingDeadline = d[14] ?? 0n;
  }

  const fmt = (a: string) =>
    a && a !== "0x0000000000000000000000000000000000000000" ? `${a.slice(0,8)}…${a.slice(-6)}` : "—";

  const fmtDate = (ts: bigint) =>
    ts && ts > 0n ? new Date(Number(ts) * 1000).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";

  // Owner acts as any role depending on current state
  const getOwnerRole = (state: number) => {
    if ([0, 2].includes(state))              return USER_ROLES.FARMER;
    if ([1, 3, 4, 5, 6, 8].includes(state)) return USER_ROLES.DISTRIBUTOR;
    if ([7, 9, 10].includes(state))          return USER_ROLES.RETAILER;
    if (state === 11)                        return USER_ROLES.CONSUMER;
    return USER_ROLES.FARMER;
  };
  const effectiveRole = role === USER_ROLES.OWNER ? getOwnerRole(stateNum) : role;

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stateColor}`}>{stateLabel}</span>
          <h2 className="text-xl font-bold text-slate-800 mt-2">{cropType || "—"}</h2>
          <p className="text-sm text-slate-400 font-mono">Product #{productId.toString()}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { icon: User,       label: "Farmer",   value: farmerName || fmt(farmerID) },
          { icon: MapPin,     label: "Origin",   value: originLocation || "—" },
          { icon: DollarSign, label: "Price",    value: `${formatEther(productPrice ?? 0n)} ETH` },
          { icon: Package,    label: "Deadline", value: fmtDate(shippingDeadline) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Icon className="w-3 h-3" />{label}
            </div>
            <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 rounded-xl border border-slate-100 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Supply Chain Participants</p>
        {[
          { label: "Farmer", addr: farmerID }, { label: "Distributor", addr: distributorID },
          { label: "Retailer", addr: retailerID }, { label: "Consumer", addr: consumerID },
        ].map(({ label, addr }) => (
          <div key={label} className="flex items-center justify-between py-1 text-sm">
            <span className="text-slate-400">{label}</span>
            <span className="font-mono text-xs text-slate-600">{fmt(addr)}</span>
          </div>
        ))}
      </div>

      <ActionPanel
        stateNum={stateNum} role={effectiveRole} price={price} slices={slices}
        isPending={isPending} setPrice={setPrice} setSlices={setSlices}
        onSellFarmer={()         => sellItemByFarmer(productId, price)}
        onShipFarmer={()         => shippedItemByFarmer(productId)}
        onBuyDistributor={()     => purchaseItemByDistributor(productId, formatEther(productPrice ?? 0n))}
        onReceiveDistributor={() => receivedItemByDistributor(productId)}
        onProcessDistributor={() => processedItemByDistributor(productId, BigInt(slices))}
        onPackageDistributor={() => packageItemByDistributor(productId)}
        onSellDistributor={()    => sellItemByDistributor(productId, price)}
        onShipDistributor={()    => shippedItemByDistributor(productId)}
        onBuyRetailer={()        => purchaseItemByRetailer(productId, formatEther(productPrice ?? 0n))}
        onReceiveRetailer={()    => receivedItemByRetailer(productId)}
        onSellRetailer={()       => sellItemByRetailer(productId, price)}
        onBuyConsumer={()        => purchaseItemByConsumer(productId, formatEther(productPrice ?? 0n))}
      />
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ActionPanel({ stateNum, role, price, slices, isPending, setPrice, setSlices, ...fns }: any) {
  const Btn = ({ onClick, label }: any) => (
    <button onClick={onClick} disabled={isPending}
      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
      {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : label}
    </button>
  );
  const PriceInput = () => (
    <input type="number" step="0.001" min="0.001" value={price}
      onChange={(e) => setPrice(e.target.value)} placeholder="Price (ETH)"
      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 mb-2" />
  );
  const SlicesInput = () => (
    <input type="number" min="1" value={slices}
      onChange={(e) => setSlices(e.target.value)} placeholder="Number of slices"
      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-400 mb-2" />
  );

  const actionMap: Record<string, JSX.Element> = {
    [`0-${USER_ROLES.FARMER}`]:      <><PriceInput /><div className="flex gap-2"><Btn onClick={fns.onSellFarmer} label="List for Sale" /></div></>,
    [`2-${USER_ROLES.FARMER}`]:      <div className="flex gap-2"><Btn onClick={fns.onShipFarmer} label="Mark as Shipped" /></div>,
    [`1-${USER_ROLES.DISTRIBUTOR}`]: <><PriceInput /><div className="flex gap-2"><Btn onClick={fns.onBuyDistributor} label="Purchase" /></div></>,
    [`3-${USER_ROLES.DISTRIBUTOR}`]: <div className="flex gap-2"><Btn onClick={fns.onReceiveDistributor} label="Confirm Receipt" /></div>,
    [`4-${USER_ROLES.DISTRIBUTOR}`]: <><SlicesInput /><div className="flex gap-2"><Btn onClick={fns.onProcessDistributor} label="Process Product" /></div></>,
    [`5-${USER_ROLES.DISTRIBUTOR}`]: <div className="flex gap-2"><Btn onClick={fns.onPackageDistributor} label="Package Product" /></div>,
    [`6-${USER_ROLES.DISTRIBUTOR}`]: <><PriceInput /><div className="flex gap-2"><Btn onClick={fns.onSellDistributor} label="List for Retailers" /></div></>,
    [`8-${USER_ROLES.DISTRIBUTOR}`]: <div className="flex gap-2"><Btn onClick={fns.onShipDistributor} label="Ship to Retailer" /></div>,
    [`7-${USER_ROLES.RETAILER}`]:    <><PriceInput /><div className="flex gap-2"><Btn onClick={fns.onBuyRetailer} label="Purchase" /></div></>,
    [`9-${USER_ROLES.RETAILER}`]:    <div className="flex gap-2"><Btn onClick={fns.onReceiveRetailer} label="Confirm Receipt" /></div>,
    [`10-${USER_ROLES.RETAILER}`]:   <><PriceInput /><div className="flex gap-2"><Btn onClick={fns.onSellRetailer} label="List for Consumers" /></div></>,
    [`11-${USER_ROLES.CONSUMER}`]:   <><PriceInput /><div className="flex gap-2"><Btn onClick={fns.onBuyConsumer} label="Purchase" /></div></>,
  };

  if (stateNum === 12) return (
    <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 text-center font-medium">
      ✅ Journey complete — purchased by consumer!
    </div>
  );

  const panel = actionMap[`${stateNum}-${role}`];
  if (!panel) return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-400 text-center">
      No actions available for your role at this stage.<br/>
      <span className="text-xs opacity-60">Role: {role} · State: {stateNum}</span>
    </div>
  );

  return (
    <div className="rounded-2xl border border-green-100 bg-green-50/50 p-4">
      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">Available Actions</p>
      {panel}
    </div>
  );
}
