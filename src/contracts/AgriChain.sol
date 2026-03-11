// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../access/FarmerRole.sol";
import "../access/DistributorRole.sol";
import "../access/RetailerRole.sol";
import "../access/ConsumerRole.sol";
import "../utils/Escrow.sol";
import "../utils/Reputation.sol";

/**
 * @title AgriChain
 * @dev Combined AgriSupply + SupplyChain:
 *      - 13-state full lifecycle
 *      - Role-based access (Farmer, Distributor, Retailer, Consumer)
 *      - Human-readable fields (farmerName, cropType, originLocation) for QR display
 *      - Escrow-protected payments
 *      - Reputation tracking
 *      - IPFS metadata storage
 *      - Expiry management & batch operations
 */
contract AgriChain is
    ReentrancyGuard,
    Pausable,
    Ownable,
    FarmerRole,
    DistributorRole,
    RetailerRole,
    ConsumerRole
{
    // ─── State Machine ────────────────────────────────────────────────────────
    enum State {
        ProduceByFarmer,        // 0
        ForSaleByFarmer,        // 1
        PurchasedByDistributor, // 2
        ShippedByFarmer,        // 3
        ReceivedByDistributor,  // 4
        ProcessedByDistributor, // 5
        PackageByDistributor,   // 6
        ForSaleByDistributor,   // 7
        PurchasedByRetailer,    // 8
        ShippedByDistributor,   // 9
        ReceivedByRetailer,     // 10
        ForSaleByRetailer,      // 11
        PurchasedByConsumer     // 12
    }

    // ─── Data Structures ──────────────────────────────────────────────────────
    struct Item {
        uint256 stockUnit;
        uint256 productCode;
        address ownerID;
        address farmerID;
        // Human-readable fields (from original AgriSupply project)
        string  farmerName;
        string  cropType;
        string  originLocation;
        uint256 productDate;
        uint256 productPrice;
        uint256 productSliced;
        State   itemState;
        address distributorID;
        address retailerID;
        address consumerID;
        uint256 shippingDeadline;
        uint256 receivingDeadline;
        bool    isExpired;
        string  ipfsHash;
    }

    struct Txblocks {
        uint256 FTD; // Farmer -> Distributor block
        uint256 DTR; // Distributor -> Retailer block
        uint256 RTC; // Retailer -> Consumer block
    }

    struct BatchOperation {
        uint256[] productCodes;
        address   operator;
        uint256   timestamp;
        bool      isCompleted;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────
    uint256 private _productCounter;
    uint256 private _batchCounter;

    mapping(uint256 => Item)           public items;
    mapping(uint256 => Txblocks)       public itemsHistory;
    mapping(uint256 => BatchOperation) public batchOperations;
    mapping(address => uint256[])      public userProducts;
    mapping(address => bool)           public verifiedUsers;

    Escrow     public escrowContract;
    Reputation public reputationContract;

    uint256 public constant MAX_PRODUCT_PRICE = 1000 ether;
    uint256 public constant MIN_PRODUCT_PRICE = 0.001 ether;
    uint256 public constant DEFAULT_TIMEOUT   = 7 days;
    uint256 public constant BATCH_LIMIT       = 50;

    // ─── Events ───────────────────────────────────────────────────────────────
    event ProduceByFarmerEvent(uint256 indexed productCode, address indexed farmer, string cropType, string originLocation);
    event ForSaleByFarmerEvent(uint256 indexed productCode, uint256 price);
    event PurchasedByDistributorEvent(uint256 indexed productCode, address indexed distributor);
    event ShippedByFarmerEvent(uint256 indexed productCode);
    event ReceivedByDistributorEvent(uint256 indexed productCode);
    event ProcessedByDistributorEvent(uint256 indexed productCode, uint256 slices);
    event PackagedByDistributorEvent(uint256 indexed productCode);
    event ForSaleByDistributorEvent(uint256 indexed productCode, uint256 price);
    event PurchasedByRetailerEvent(uint256 indexed productCode, address indexed retailer);
    event ShippedByDistributorEvent(uint256 indexed productCode);
    event ReceivedByRetailerEvent(uint256 indexed productCode);
    event ForSaleByRetailerEvent(uint256 indexed productCode, uint256 price);
    event PurchasedByConsumerEvent(uint256 indexed productCode, address indexed consumer);
    event BatchOperationCreated(uint256 indexed batchId, address indexed operator, uint256 productCount);
    event ProductExpired(uint256 indexed productCode);
    event UserVerified(address indexed user, bool status);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier validProduct(uint256 _pc) {
        require(_pc > 0 && _pc <= _productCounter, "AgriChain: product does not exist");
        _;
    }

    modifier validPrice(uint256 _price) {
        require(_price >= MIN_PRODUCT_PRICE && _price <= MAX_PRODUCT_PRICE, "AgriChain: price out of range");
        _;
    }

    modifier notExpired(uint256 _pc) {
        require(!items[_pc].isExpired, "AgriChain: product expired");
        _;
    }

    modifier onlyVerifiedUser() {
        require(verifiedUsers[msg.sender], "AgriChain: user not verified");
        _;
    }

    modifier inState(uint256 _pc, State _expected) {
        require(items[_pc].itemState == _expected, "AgriChain: wrong product state");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address _escrow, address _reputation) Ownable(msg.sender) {
        escrowContract     = Escrow(_escrow);
        reputationContract = Reputation(_reputation);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────
    function setEscrowContract(address _e) external onlyOwner {
        require(_e != address(0), "AgriChain: zero address");
        escrowContract = Escrow(_e);
    }

    function setReputationContract(address _r) external onlyOwner {
        require(_r != address(0), "AgriChain: zero address");
        reputationContract = Reputation(_r);
    }

    function verifyUser(address user) external onlyOwner {
        verifiedUsers[user] = true;
        emit UserVerified(user, true);
    }

    function unverifyUser(address user) external onlyOwner {
        verifiedUsers[user] = false;
        emit UserVerified(user, false);
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── Farmer Actions ───────────────────────────────────────────────────────

    /**
     * @notice Register a new agricultural product.
     * @param _farmerName     Readable farmer/producer name (shown on QR scan)
     * @param _cropType       Crop or product type (e.g. "Wheat", "Tomatoes")
     * @param _originLocation Farm origin location string
     * @param _price          Initial listing price in wei
     * @param _ipfsHash       IPFS CID for rich product metadata (can be empty)
     * @param _shippingDeadline  Unix timestamp — must be in the future
     * @return productCode    The newly assigned product ID
     */
    function produceItemByFarmer(
        string  memory _farmerName,
        string  memory _cropType,
        string  memory _originLocation,
        uint256 _price,
        string  memory _ipfsHash,
        uint256 _shippingDeadline
    )
        external
        onlyFarmer
        onlyVerifiedUser
        validPrice(_price)
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        require(_shippingDeadline > block.timestamp, "AgriChain: deadline in past");
        require(bytes(_cropType).length > 0, "AgriChain: crop type required");

        _productCounter++;
        uint256 pc = _productCounter;

        items[pc] = Item({
            stockUnit:        pc,
            productCode:      pc,
            ownerID:          msg.sender,
            farmerID:         msg.sender,
            farmerName:       _farmerName,
            cropType:         _cropType,
            originLocation:   _originLocation,
            productDate:      block.timestamp,
            productPrice:     _price,
            productSliced:    0,
            itemState:        State.ProduceByFarmer,
            distributorID:    address(0),
            retailerID:       address(0),
            consumerID:       address(0),
            shippingDeadline: _shippingDeadline,
            receivingDeadline: _shippingDeadline + DEFAULT_TIMEOUT,
            isExpired:        false,
            ipfsHash:         _ipfsHash
        });

        itemsHistory[pc] = Txblocks(0, 0, 0);
        userProducts[msg.sender].push(pc);

        emit ProduceByFarmerEvent(pc, msg.sender, _cropType, _originLocation);
        return pc;
    }

    function sellItemByFarmer(uint256 _pc, uint256 _price)
        external
        onlyFarmer
        validProduct(_pc)
        inState(_pc, State.ProduceByFarmer)
        notExpired(_pc)
        validPrice(_price)
        whenNotPaused
    {
        require(items[_pc].farmerID == msg.sender, "AgriChain: not the farmer");
        items[_pc].itemState    = State.ForSaleByFarmer;
        items[_pc].productPrice = _price;
        emit ForSaleByFarmerEvent(_pc, _price);
    }

    function shippedItemByFarmer(uint256 _pc)
        external
        onlyFarmer
        validProduct(_pc)
        inState(_pc, State.PurchasedByDistributor)
        notExpired(_pc)
        whenNotPaused
    {
        require(items[_pc].farmerID == msg.sender, "AgriChain: not the farmer");
        items[_pc].itemState = State.ShippedByFarmer;
        emit ShippedByFarmerEvent(_pc);
    }

    // ─── Distributor Actions ──────────────────────────────────────────────────
    function purchaseItemByDistributor(uint256 _pc)
        external
        payable
        onlyDistributor
        validProduct(_pc)
        inState(_pc, State.ForSaleByFarmer)
        notExpired(_pc)
        whenNotPaused
        nonReentrant
    {
        Item storage item = items[_pc];
        require(msg.value >= item.productPrice, "AgriChain: insufficient payment");

        escrowContract.createEscrow{value: msg.value}(
            _pc, msg.sender, item.farmerID, item.receivingDeadline
        );

        item.ownerID          = msg.sender;
        item.distributorID    = msg.sender;
        item.itemState        = State.PurchasedByDistributor;
        itemsHistory[_pc].FTD = block.number;
        userProducts[msg.sender].push(_pc);

        emit PurchasedByDistributorEvent(_pc, msg.sender);
    }

    function receivedItemByDistributor(uint256 _pc)
        external
        onlyDistributor
        validProduct(_pc)
        inState(_pc, State.ShippedByFarmer)
        notExpired(_pc)
        whenNotPaused
    {
        require(items[_pc].ownerID == msg.sender, "AgriChain: not the owner");
        items[_pc].itemState = State.ReceivedByDistributor;
        emit ReceivedByDistributorEvent(_pc);
    }

    function processedItemByDistributor(uint256 _pc, uint256 slices)
        external
        onlyDistributor
        validProduct(_pc)
        inState(_pc, State.ReceivedByDistributor)
        notExpired(_pc)
        whenNotPaused
    {
        require(items[_pc].ownerID == msg.sender, "AgriChain: not the owner");
        items[_pc].itemState    = State.ProcessedByDistributor;
        items[_pc].productSliced = slices;
        emit ProcessedByDistributorEvent(_pc, slices);
    }

    function packageItemByDistributor(uint256 _pc)
        external
        onlyDistributor
        validProduct(_pc)
        inState(_pc, State.ProcessedByDistributor)
        notExpired(_pc)
        whenNotPaused
    {
        require(items[_pc].ownerID == msg.sender, "AgriChain: not the owner");
        items[_pc].itemState = State.PackageByDistributor;
        emit PackagedByDistributorEvent(_pc);
    }

    function sellItemByDistributor(uint256 _pc, uint256 _price)
        external
        onlyDistributor
        validProduct(_pc)
        inState(_pc, State.PackageByDistributor)
        notExpired(_pc)
        validPrice(_price)
        whenNotPaused
    {
        require(items[_pc].ownerID == msg.sender, "AgriChain: not the owner");
        items[_pc].itemState    = State.ForSaleByDistributor;
        items[_pc].productPrice = _price;
        emit ForSaleByDistributorEvent(_pc, _price);
    }

    function shippedItemByDistributor(uint256 _pc)
        external
        onlyDistributor
        validProduct(_pc)
        inState(_pc, State.PurchasedByRetailer)
        notExpired(_pc)
        whenNotPaused
    {
        require(items[_pc].distributorID == msg.sender, "AgriChain: not the distributor");
        items[_pc].itemState = State.ShippedByDistributor;
        emit ShippedByDistributorEvent(_pc);
    }

    // ─── Retailer Actions ─────────────────────────────────────────────────────
    function purchaseItemByRetailer(uint256 _pc)
        external
        payable
        onlyRetailer
        validProduct(_pc)
        inState(_pc, State.ForSaleByDistributor)
        notExpired(_pc)
        whenNotPaused
        nonReentrant
    {
        Item storage item = items[_pc];
        require(msg.value >= item.productPrice, "AgriChain: insufficient payment");

        escrowContract.createEscrow{value: msg.value}(
            _pc, msg.sender, item.distributorID, item.receivingDeadline
        );

        item.ownerID          = msg.sender;
        item.retailerID       = msg.sender;
        item.itemState        = State.PurchasedByRetailer;
        itemsHistory[_pc].DTR = block.number;
        userProducts[msg.sender].push(_pc);

        emit PurchasedByRetailerEvent(_pc, msg.sender);
    }

    function receivedItemByRetailer(uint256 _pc)
        external
        onlyRetailer
        validProduct(_pc)
        inState(_pc, State.ShippedByDistributor)
        notExpired(_pc)
        whenNotPaused
    {
        require(items[_pc].ownerID == msg.sender, "AgriChain: not the owner");
        items[_pc].itemState = State.ReceivedByRetailer;
        emit ReceivedByRetailerEvent(_pc);
    }

    function sellItemByRetailer(uint256 _pc, uint256 _price)
        external
        onlyRetailer
        validProduct(_pc)
        inState(_pc, State.ReceivedByRetailer)
        notExpired(_pc)
        validPrice(_price)
        whenNotPaused
    {
        require(items[_pc].ownerID == msg.sender, "AgriChain: not the owner");
        items[_pc].itemState    = State.ForSaleByRetailer;
        items[_pc].productPrice = _price;
        emit ForSaleByRetailerEvent(_pc, _price);
    }

    // ─── Consumer Actions ─────────────────────────────────────────────────────
    function purchaseItemByConsumer(uint256 _pc)
        external
        payable
        onlyConsumer
        validProduct(_pc)
        inState(_pc, State.ForSaleByRetailer)
        notExpired(_pc)
        whenNotPaused
        nonReentrant
    {
        Item storage item = items[_pc];
        require(msg.value >= item.productPrice, "AgriChain: insufficient payment");

        escrowContract.createEscrow{value: msg.value}(
            _pc, msg.sender, item.retailerID, item.receivingDeadline
        );

        item.ownerID          = msg.sender;
        item.consumerID       = msg.sender;
        item.itemState        = State.PurchasedByConsumer;
        itemsHistory[_pc].RTC = block.number;
        userProducts[msg.sender].push(_pc);

        emit PurchasedByConsumerEvent(_pc, msg.sender);
    }

    // ─── Utility ──────────────────────────────────────────────────────────────
    function createBatchOperation(uint256[] memory _pcs)
        external onlyOwner whenNotPaused returns (uint256)
    {
        require(_pcs.length <= BATCH_LIMIT, "AgriChain: batch too large");
        _batchCounter++;
        batchOperations[_batchCounter] = BatchOperation({
            productCodes: _pcs,
            operator:     msg.sender,
            timestamp:    block.timestamp,
            isCompleted:  false
        });
        emit BatchOperationCreated(_batchCounter, msg.sender, _pcs.length);
        return _batchCounter;
    }

    function checkExpiredProducts(uint256[] memory _pcs) external {
        for (uint256 i = 0; i < _pcs.length; i++) {
            uint256 pc = _pcs[i];
            if (pc > 0 && pc <= _productCounter &&
                block.timestamp > items[pc].receivingDeadline &&
                !items[pc].isExpired)
            {
                items[pc].isExpired = true;
                emit ProductExpired(pc);
            }
        }
    }

    // ─── Views ────────────────────────────────────────────────────────────────
    function fetchItem(uint256 _pc) external view validProduct(_pc) returns (Item memory) {
        return items[_pc];
    }

    function fetchItemHistory(uint256 _pc) external view validProduct(_pc) returns (Txblocks memory) {
        return itemsHistory[_pc];
    }

    /**
     * @notice Returns the human-readable summary fields — perfect for QR scan pages
     *         that don't require a wallet connection.
     */
    function getProductBasic(uint256 _pc)
        external
        view
        validProduct(_pc)
        returns (
            string memory farmerName,
            string memory cropType,
            string memory originLocation,
            uint256 price,
            string memory stateLabel
        )
    {
        Item storage it = items[_pc];
        return (it.farmerName, it.cropType, it.originLocation, it.productPrice, _stateToString(it.itemState));
    }

    function getUserProducts(address user) external view returns (uint256[] memory) {
        return userProducts[user];
    }

    function getTotalProductCount() external view returns (uint256) {
        return _productCounter;
    }

    function getStateLabel(uint256 _pc) external view validProduct(_pc) returns (string memory) {
        return _stateToString(items[_pc].itemState);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────
    function _stateToString(State s) internal pure returns (string memory) {
        if (s == State.ProduceByFarmer)        return "Produced by Farmer";
        if (s == State.ForSaleByFarmer)        return "For Sale by Farmer";
        if (s == State.PurchasedByDistributor) return "Purchased by Distributor";
        if (s == State.ShippedByFarmer)        return "Shipped by Farmer";
        if (s == State.ReceivedByDistributor)  return "Received by Distributor";
        if (s == State.ProcessedByDistributor) return "Processed by Distributor";
        if (s == State.PackageByDistributor)   return "Packaged by Distributor";
        if (s == State.ForSaleByDistributor)   return "For Sale by Distributor";
        if (s == State.PurchasedByRetailer)    return "Purchased by Retailer";
        if (s == State.ShippedByDistributor)   return "Shipped by Distributor";
        if (s == State.ReceivedByRetailer)     return "Received by Retailer";
        if (s == State.ForSaleByRetailer)      return "For Sale by Retailer";
        if (s == State.PurchasedByConsumer)    return "Purchased by Consumer";
        return "Unknown";
    }
}
