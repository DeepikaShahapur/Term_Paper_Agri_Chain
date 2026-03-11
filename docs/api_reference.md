# AgriChain v2.0 — API Reference

All public functions available in AgriChain.sol, Escrow.sol, and Reputation.sol.

---

## getProductBasic(uint256 id)

**Type:** `view` (free — no gas)  
**Returns:** `(string farmerName, string cropType, string originLocation, uint256 price, string stateLabel)`

Use this for QR-code consumer traceability. No wallet required.

```javascript
// Wagmi v2 example
const data = await readContract({
  address: CONTRACT_ADDRESS,
  abi: AGRICHAIN_ABI,
  functionName: 'getProductBasic',
  args: [productId]
});
const [farmerName, cropType, origin, price, state] = data;
```

---

## produceItemByFarmer(...)

**Type:** `write` (costs gas)  
**Guard:** `onlyFarmer`, `onlyVerified`

```solidity
function produceItemByFarmer(
    string memory farmerName,
    string memory cropType,
    string memory originLocation,
    uint256 price,            // in Wei (1 ETH = 1e18 Wei)
    string memory ipfsHash,   // IPFS CID or empty string
    uint256 shippingDeadline  // Unix timestamp
) public
```

---

## purchaseItemByDistributor(uint256 id)

**Type:** `payable write`  
**Guard:** `onlyDistributor`, `onlyVerified`  
**Value:** Must send exactly `item.price` ETH

```javascript
await writeContract({
  functionName: 'purchaseItemByDistributor',
  args: [productId],
  value: parseEther('0.05')
});
```

---

## getReputation(address user)

**Type:** `view` (free)  
**Returns:** `(uint256 averageScore, uint256 totalRatings)`

```javascript
const [avg, total] = await readContract({
  address: REPUTATION_ADDRESS,
  abi: REPUTATION_ABI,
  functionName: 'getReputation',
  args: [userAddress]
});
```

---

## Admin Functions (Owner only)

```javascript
// Add roles
writeContract({ functionName: 'addFarmer',      args: [address] })
writeContract({ functionName: 'addDistributor',  args: [address] })
writeContract({ functionName: 'addRetailer',     args: [address] })
writeContract({ functionName: 'addConsumer',     args: [address] })

// Verification
writeContract({ functionName: 'verifyUser',   args: [address] })
writeContract({ functionName: 'unverifyUser', args: [address] })
```
