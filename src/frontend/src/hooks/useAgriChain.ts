"use client";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { contractAddresses } from "@/lib/wagmi";
import { agriChainAbi, USER_ROLES, type UserRole } from "@/lib/contracts";
import { useEffect } from "react";

export function useAgriChain() {
  const { address } = useAccount();
  const qc = useQueryClient();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) qc.invalidateQueries({ queryKey: ["readContract"] });
  }, [isConfirmed, qc]);

  const addr = contractAddresses.agriChain;

  const { data: ownerData }        = useReadContract({ address: addr, abi: agriChainAbi, functionName: "owner" });
  const { data: farmerData }       = useReadContract({ address: addr, abi: agriChainAbi, functionName: "isFarmer", args: address ? [address] : undefined });
  const { data: distributorData }  = useReadContract({ address: addr, abi: agriChainAbi, functionName: "isDistributor", args: address ? [address] : undefined });
  const { data: retailerData }     = useReadContract({ address: addr, abi: agriChainAbi, functionName: "isRetailer", args: address ? [address] : undefined });
  const { data: consumerData }     = useReadContract({ address: addr, abi: agriChainAbi, functionName: "isConsumer", args: address ? [address] : undefined });
  const { data: verifiedData }     = useReadContract({ address: addr, abi: agriChainAbi, functionName: "verifiedUsers", args: address ? [address] : undefined });
  const { data: userProductsData } = useReadContract({ address: addr, abi: agriChainAbi, functionName: "getUserProducts", args: address ? [address] : undefined });
  const { data: totalData }        = useReadContract({ address: addr, abi: agriChainAbi, functionName: "getTotalProductCount" });

  const role: UserRole = (() => {
    if (!address) return USER_ROLES.NONE;
    if (address === ownerData) return USER_ROLES.OWNER;
    if (farmerData)      return USER_ROLES.FARMER;
    if (distributorData) return USER_ROLES.DISTRIBUTOR;
    if (retailerData)    return USER_ROLES.RETAILER;
    if (consumerData)    return USER_ROLES.CONSUMER;
    return USER_ROLES.NONE;
  })();

  const w = (args: Parameters<typeof writeContract>[0]) => writeContract(args);

  return {
    address,
    role,
    owner:        ownerData as `0x${string}` | undefined,
    isFarmer:     !!farmerData,
    isDistributor:!!distributorData,
    isRetailer:   !!retailerData,
    isConsumer:   !!consumerData,
    isVerified:   !!verifiedData,
    userProducts: (userProductsData as bigint[]) ?? [],
    totalProducts:(totalData as bigint) ?? 0n,
    hash, error, isPending, isConfirming, isConfirmed,

    // Farmer
    produceItemByFarmer: (farmerName: string, cropType: string, origin: string, price: string, ipfs: string, dl: bigint) =>
      w({ address: addr, abi: agriChainAbi, functionName: "produceItemByFarmer", args: [farmerName, cropType, origin, parseEther(price), ipfs, dl] }),
    sellItemByFarmer: (pc: bigint, price: string) =>
      w({ address: addr, abi: agriChainAbi, functionName: "sellItemByFarmer", args: [pc, parseEther(price)] }),
    shippedItemByFarmer: (pc: bigint) =>
      w({ address: addr, abi: agriChainAbi, functionName: "shippedItemByFarmer", args: [pc] }),

    // Distributor
    purchaseItemByDistributor: (pc: bigint, value: string) =>
      w({ address: addr, abi: agriChainAbi, functionName: "purchaseItemByDistributor", args: [pc], value: parseEther(value) }),
    receivedItemByDistributor: (pc: bigint) =>
      w({ address: addr, abi: agriChainAbi, functionName: "receivedItemByDistributor", args: [pc] }),
    processedItemByDistributor: (pc: bigint, slices: bigint) =>
      w({ address: addr, abi: agriChainAbi, functionName: "processedItemByDistributor", args: [pc, slices] }),
    packageItemByDistributor: (pc: bigint) =>
      w({ address: addr, abi: agriChainAbi, functionName: "packageItemByDistributor", args: [pc] }),
    sellItemByDistributor: (pc: bigint, price: string) =>
      w({ address: addr, abi: agriChainAbi, functionName: "sellItemByDistributor", args: [pc, parseEther(price)] }),
    shippedItemByDistributor: (pc: bigint) =>
      w({ address: addr, abi: agriChainAbi, functionName: "shippedItemByDistributor", args: [pc] }),

    // Retailer
    purchaseItemByRetailer: (pc: bigint, value: string) =>
      w({ address: addr, abi: agriChainAbi, functionName: "purchaseItemByRetailer", args: [pc], value: parseEther(value) }),
    receivedItemByRetailer: (pc: bigint) =>
      w({ address: addr, abi: agriChainAbi, functionName: "receivedItemByRetailer", args: [pc] }),
    sellItemByRetailer: (pc: bigint, price: string) =>
      w({ address: addr, abi: agriChainAbi, functionName: "sellItemByRetailer", args: [pc, parseEther(price)] }),

    // Consumer
    purchaseItemByConsumer: (pc: bigint, value: string) =>
      w({ address: addr, abi: agriChainAbi, functionName: "purchaseItemByConsumer", args: [pc], value: parseEther(value) }),

    // Admin
    addFarmer:      (a: `0x${string}`) => w({ address: addr, abi: agriChainAbi, functionName: "addFarmer",      args: [a] }),
    addDistributor: (a: `0x${string}`) => w({ address: addr, abi: agriChainAbi, functionName: "addDistributor", args: [a] }),
    addRetailer:    (a: `0x${string}`) => w({ address: addr, abi: agriChainAbi, functionName: "addRetailer",    args: [a] }),
    addConsumer:    (a: `0x${string}`) => w({ address: addr, abi: agriChainAbi, functionName: "addConsumer",    args: [a] }),
    verifyUser:     (a: `0x${string}`) => w({ address: addr, abi: agriChainAbi, functionName: "verifyUser",     args: [a] }),
    unverifyUser:   (a: `0x${string}`) => w({ address: addr, abi: agriChainAbi, functionName: "unverifyUser",   args: [a] }),
  };
}
