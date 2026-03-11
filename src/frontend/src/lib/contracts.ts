import { parseAbi } from "viem";

// ── AgriChain ABI ─────────────────────────────────────────────────────────────
export const agriChainAbi = parseAbi([
  // reads
  "function owner() external view returns (address)",
  "function isFarmer(address) external view returns (bool)",
  "function isDistributor(address) external view returns (bool)",
  "function isRetailer(address) external view returns (bool)",
  "function isConsumer(address) external view returns (bool)",
  "function verifiedUsers(address) external view returns (bool)",
  "function getUserProducts(address) external view returns (uint256[])",
  "function getTotalProductCount() external view returns (uint256)",
  "function fetchItem(uint256) external view returns (uint256,uint256,address,address,string,string,string,uint256,uint256,uint256,uint8,address,address,address,uint256,uint256,bool,string)",
  "function getProductBasic(uint256) external view returns (string,string,string,uint256,string)",
  "function getStateLabel(uint256) external view returns (string)",
  // farmer writes
  "function produceItemByFarmer(string,string,string,uint256,string,uint256) external returns (uint256)",
  "function sellItemByFarmer(uint256,uint256) external",
  "function shippedItemByFarmer(uint256) external",
  // distributor writes
  "function purchaseItemByDistributor(uint256) external payable",
  "function receivedItemByDistributor(uint256) external",
  "function processedItemByDistributor(uint256,uint256) external",
  "function packageItemByDistributor(uint256) external",
  "function sellItemByDistributor(uint256,uint256) external",
  "function shippedItemByDistributor(uint256) external",
  // retailer writes
  "function purchaseItemByRetailer(uint256) external payable",
  "function receivedItemByRetailer(uint256) external",
  "function sellItemByRetailer(uint256,uint256) external",
  // consumer writes
  "function purchaseItemByConsumer(uint256) external payable",
  // admin writes
  "function addFarmer(address) external",
  "function addDistributor(address) external",
  "function addRetailer(address) external",
  "function addConsumer(address) external",
  "function verifyUser(address) external",
  "function unverifyUser(address) external",
  "function pause() external",
  "function unpause() external",
  // events
  "event ProduceByFarmerEvent(uint256 indexed productCode, address indexed farmer, string cropType, string originLocation)",
  "event ForSaleByFarmerEvent(uint256 indexed productCode, uint256 price)",
  "event PurchasedByDistributorEvent(uint256 indexed productCode, address indexed distributor)",
  "event PurchasedByRetailerEvent(uint256 indexed productCode, address indexed retailer)",
  "event PurchasedByConsumerEvent(uint256 indexed productCode, address indexed consumer)",
  "event UserVerified(address indexed user, bool status)",
]);

// ── Escrow ABI ────────────────────────────────────────────────────────────────
export const escrowAbi = parseAbi([
  "function createEscrow(uint256,address,address,uint256) external payable returns (uint256)",
  "function releasePayment(uint256) external",
  "function refundPayment(uint256) external",
  "function openDispute(uint256,string) external payable",
  "function resolveDispute(uint256,uint8) external",
  "function addArbitrator(address) external",
  "function arbitrators(address) external view returns (bool)",
  "function getEscrowData(uint256) external view returns (uint256,address,address,uint256,uint256,uint8,address,bool,bool)",
  "function getDisputeData(uint256) external view returns (uint256,address,string,uint256,uint8,bool)",
]);

// ── Reputation ABI ────────────────────────────────────────────────────────────
export const reputationAbi = parseAbi([
  "function registerUser(address) external",
  "function addReview(address,uint256,string) external returns (uint256)",
  "function verifyReview(uint256) external",
  "function recordTransactionSuccess(address) external",
  "function recordTransactionFailure(address) external",
  "function getUserReputation(address) external view returns (uint256,uint256,uint256,uint256,uint256,bool)",
  "function calculateReputationLevel(address) external view returns (string)",
]);

// ── Constants ─────────────────────────────────────────────────────────────────
export const USER_ROLES = {
  FARMER:      "Farmer",
  DISTRIBUTOR: "Distributor",
  RETAILER:    "Retailer",
  CONSUMER:    "Consumer",
  OWNER:       "Owner",
  NONE:        "No Role",
} as const;
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const PRODUCT_STATES = [
  "Produced by Farmer",
  "For Sale by Farmer",
  "Purchased by Distributor",
  "Shipped by Farmer",
  "Received by Distributor",
  "Processed by Distributor",
  "Packaged by Distributor",
  "For Sale by Distributor",
  "Purchased by Retailer",
  "Shipped by Distributor",
  "Received by Retailer",
  "For Sale by Retailer",
  "Purchased by Consumer",
] as const;

export const STATE_COLORS: Record<number, string> = {
  0:  "bg-slate-100 text-slate-700",
  1:  "bg-green-100 text-green-700",
  2:  "bg-blue-100 text-blue-700",
  3:  "bg-yellow-100 text-yellow-700",
  4:  "bg-indigo-100 text-indigo-700",
  5:  "bg-pink-100 text-pink-700",
  6:  "bg-teal-100 text-teal-700",
  7:  "bg-orange-100 text-orange-700",
  8:  "bg-red-100 text-red-700",
  9:  "bg-gray-100 text-gray-700",
  10: "bg-cyan-100 text-cyan-700",
  11: "bg-lime-100 text-lime-700",
  12: "bg-emerald-100 text-emerald-700",
};
