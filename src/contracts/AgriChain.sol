// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────────────────────────
// AgriChain.sol — Core 13-State Supply Chain Smart Contract
// Author: Deepika Shanapur
// ─────────────────────────────────────────────────────────────────
// Place your full AgriChain.sol contract code here.
// See docs/smart_contract_design.md for the complete function list.
//
// Quick reference — State enum:
//   0  ProducedByFarmer
//   1  ForSaleByFarmer
//   2  PurchasedByDistributor
//   3  ShippedByFarmer
//   4  ReceivedByDistributor
//   5  ProcessedByDistributor
//   6  PackagedByDistributor
//   7  ForSaleByDistributor
//   8  PurchasedByRetailer
//   9  ShippedByDistributor
//   10 ReceivedByRetailer
//   11 ForSaleByRetailer
//   12 PurchasedByConsumer
// ─────────────────────────────────────────────────────────────────
