# AgriChain v2.0 — Smart Contract Design Documentation

## Overview

Three contracts deploy in strict order:
```
Escrow.sol → Reputation.sol → AgriChain.sol
```
`AgriChain.sol` receives Escrow and Reputation addresses in its constructor.

---

## Contract 1: AgriChain.sol

**Purpose:** Core 13-state product lifecycle FSM with RBAC.

### Roles (OpenZeppelin AccessControl)
| Role Constant | Holder | Permissions |
|--------------|--------|-------------|
| `OWNER_ROLE` | Deployer | All actions, role assignment, verification |
| `FARMER_ROLE` | Registered farmer | States 0, 1, 3 |
| `DISTRIBUTOR_ROLE` | Registered distributor | States 2, 4, 5, 6, 7, 9 |
| `RETAILER_ROLE` | Registered retailer | States 8, 10, 11 |
| `CONSUMER_ROLE` | Registered consumer | State 12 |

### Key Modifiers
```solidity
modifier onlyFarmer() {
    require(hasRole(FARMER_ROLE, msg.sender) || hasRole(OWNER_ROLE, msg.sender));
    _;
}
modifier onlyVerified() {
    require(verifiedUsers[msg.sender], "User not verified");
    _;
}
```

### Product Struct
```solidity
struct Item {
    uint256 id;
    string  farmerName;
    string  cropType;
    string  originLocation;
    uint256 price;
    string  ipfsHash;
    uint256 shippingDeadline;
    address currentOwner;
    State   state;
}
```

### State Enum
```solidity
enum State {
    ProducedByFarmer,         // 0
    ForSaleByFarmer,          // 1
    PurchasedByDistributor,   // 2
    ShippedByFarmer,          // 3
    ReceivedByDistributor,    // 4
    ProcessedByDistributor,   // 5
    PackagedByDistributor,    // 6
    ForSaleByDistributor,     // 7
    PurchasedByRetailer,      // 8
    ShippedByDistributor,     // 9
    ReceivedByRetailer,       // 10
    ForSaleByRetailer,        // 11
    PurchasedByConsumer       // 12
}
```

### Public Functions
| Function | Guard | Description |
|----------|-------|-------------|
| `produceItemByFarmer(...)` | onlyFarmer, onlyVerified | Register new product (State 0) |
| `sellItemByFarmer(id)` | onlyFarmer, onlyVerified | List for sale (State 1) |
| `purchaseItemByDistributor(id)` | onlyDistributor, onlyVerified, payable | Buy + escrow deposit (State 2) |
| `shippedItemByFarmer(id)` | onlyFarmer, onlyVerified | Mark shipped (State 3) |
| `receivedItemByDistributor(id)` | onlyDistributor, onlyVerified | Confirm receipt + escrow release (State 4) |
| `processedByDistributor(id)` | onlyDistributor, onlyVerified | Processing (State 5) |
| `packageItemByDistributor(id)` | onlyDistributor, onlyVerified | Packaging (State 6) |
| `sellItemByDistributor(id)` | onlyDistributor, onlyVerified | List for sale (State 7) |
| `purchaseItemByRetailer(id)` | onlyRetailer, onlyVerified, payable | Buy + escrow deposit (State 8) |
| `shippedItemByDistributor(id)` | onlyDistributor, onlyVerified | Mark shipped (State 9) |
| `receivedItemByRetailer(id)` | onlyRetailer, onlyVerified | Confirm + escrow release (State 10) |
| `sellItemByRetailer(id)` | onlyRetailer, onlyVerified | List for sale (State 11) |
| `purchaseItemByConsumer(id)` | onlyConsumer, onlyVerified, payable | Final purchase (State 12) |
| `getProductBasic(id)` | view | Returns (farmerName, cropType, originLocation, price, stateLabel) |

### Admin Functions
| Function | Description |
|----------|-------------|
| `addFarmer(address)` | Grant FARMER_ROLE |
| `addDistributor(address)` | Grant DISTRIBUTOR_ROLE |
| `addRetailer(address)` | Grant RETAILER_ROLE |
| `addConsumer(address)` | Grant CONSUMER_ROLE |
| `verifyUser(address)` | Set verifiedUsers[addr] = true |
| `unverifyUser(address)` | Set verifiedUsers[addr] = false |

---

## Contract 2: Escrow.sol

**Purpose:** Hold ETH in custody between purchase and delivery confirmation.

### Flow
```
purchaseItemByDistributor()  →  Escrow.deposit{value: msg.value}(productId, farmer)
receivedItemByDistributor()  →  Escrow.release(productId)  →  ETH → farmer
```

### Key Functions
```solidity
function deposit(uint256 productId, address payable beneficiary) external payable;
function release(uint256 productId) external;
function refund(uint256 productId) external;  // Owner only, on deadline breach
```

---

## Contract 3: Reputation.sol

**Purpose:** On-chain 1–5 star ratings per participant address.

### Key Functions
```solidity
function rateTransaction(
    uint256 productId,
    uint8   score,        // 1–5
    string  calldata reviewText
) external;

function getReputation(address user)
    external view returns (uint256 averageScore, uint256 totalRatings);
```

---

## Events (emitted by AgriChain.sol)

```solidity
event ItemProduced(uint256 indexed id, address indexed farmer);
event ItemForSale(uint256 indexed id, uint256 price);
event ItemPurchased(uint256 indexed id, address indexed buyer);
event ItemShipped(uint256 indexed id);
event ItemReceived(uint256 indexed id, address indexed receiver);
event ItemProcessed(uint256 indexed id);
event ItemPackaged(uint256 indexed id);
event JourneyComplete(uint256 indexed id, address indexed consumer);
```

---

## Gas Consumption Reference

| Function | Estimated Gas |
|----------|--------------|
| `produceItemByFarmer()` | ~180,000 |
| `sellItemByFarmer()` | ~45,000 |
| `purchaseItemByDistributor()` | ~62,000 |
| `shippedItemByFarmer()` | ~35,000 |
| `receivedItemByDistributor()` | ~38,000 |
| `processedByDistributor()` | ~42,000 |
| `packageItemByDistributor()` | ~35,000 |
| `sellItemByDistributor()` | ~45,000 |
| `purchaseItemByRetailer()` | ~62,000 |
| `shippedItemByDistributor()` | ~35,000 |
| `receivedItemByRetailer()` | ~38,000 |
| `sellItemByRetailer()` | ~45,000 |
| `purchaseItemByConsumer()` | ~62,000 |
| **TOTAL (full lifecycle)** | **~724,000** |
