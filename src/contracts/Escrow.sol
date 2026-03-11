// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Escrow is ReentrancyGuard, Pausable, Ownable {
    enum DisputeStatus { None, Open, Resolved, Rejected }
    enum Resolution    { Seller, Buyer, Split }

    struct EscrowData {
        uint256       productCode;
        address       buyer;
        address       seller;
        uint256       amount;
        uint256       deadline;
        DisputeStatus disputeStatus;
        address       arbitrator;
        bool          isReleased;
        bool          isRefunded;
    }

    struct Dispute {
        uint256    escrowId;
        address    complainant;
        string     reason;
        uint256    timestamp;
        Resolution resolution;
        bool       isResolved;
    }

    uint256 private _escrowCounter;
    mapping(uint256 => EscrowData) public escrows;
    mapping(uint256 => Dispute)    public disputes;
    mapping(address => bool)       public arbitrators;

    uint256 public constant ARBITRATION_FEE = 0.01 ether;
    uint256 public constant ESCROW_TIMEOUT  = 7 days;

    event EscrowCreated(uint256 indexed escrowId, uint256 indexed productCode, address buyer, address seller, uint256 amount);
    event PaymentReleased(uint256 indexed escrowId, address seller, uint256 amount);
    event PaymentRefunded(uint256 indexed escrowId, address buyer, uint256 amount);
    event DisputeOpened(uint256 indexed escrowId, address complainant, string reason);
    event DisputeResolved(uint256 indexed escrowId, Resolution resolution);

    modifier onlyArbitrator() {
        require(arbitrators[msg.sender], "Escrow: not an arbitrator");
        _;
    }

    modifier validEscrow(uint256 escrowId) {
        require(escrowId > 0 && escrowId <= _escrowCounter, "Escrow: invalid ID");
        require(!escrows[escrowId].isReleased && !escrows[escrowId].isRefunded, "Escrow: already settled");
        _;
    }

    constructor() Ownable(msg.sender) {
        arbitrators[msg.sender] = true;
    }

    function addArbitrator(address arbitrator) external onlyOwner {
        arbitrators[arbitrator] = true;
    }

    function removeArbitrator(address arbitrator) external onlyOwner {
        arbitrators[arbitrator] = false;
    }

    function createEscrow(
        uint256 productCode,
        address buyer,
        address seller,
        uint256 deadline
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(msg.value > 0, "Escrow: zero value");
        require(buyer != address(0) && seller != address(0), "Escrow: invalid address");
        require(deadline > block.timestamp, "Escrow: deadline in past");

        _escrowCounter++;
        uint256 id = _escrowCounter;

        escrows[id] = EscrowData({
            productCode:   productCode,
            buyer:         buyer,
            seller:        seller,
            amount:        msg.value,
            deadline:      deadline,
            disputeStatus: DisputeStatus.None,
            arbitrator:    address(0),
            isReleased:    false,
            isRefunded:    false
        });

        emit EscrowCreated(id, productCode, buyer, seller, msg.value);
        return id;
    }

    function releasePayment(uint256 escrowId) external nonReentrant validEscrow(escrowId) {
        EscrowData storage e = escrows[escrowId];
        require(msg.sender == e.buyer, "Escrow: only buyer");
        require(e.disputeStatus != DisputeStatus.Open, "Escrow: dispute open");

        e.isReleased = true;
        payable(e.seller).transfer(e.amount);
        emit PaymentReleased(escrowId, e.seller, e.amount);
    }

    function refundPayment(uint256 escrowId) external nonReentrant validEscrow(escrowId) {
        EscrowData storage e = escrows[escrowId];
        require(
            msg.sender == e.buyer || msg.sender == e.seller || block.timestamp > e.deadline,
            "Escrow: unauthorized"
        );

        e.isRefunded = true;
        payable(e.buyer).transfer(e.amount);
        emit PaymentRefunded(escrowId, e.buyer, e.amount);
    }

    function openDispute(uint256 escrowId, string memory reason) external payable nonReentrant validEscrow(escrowId) {
        EscrowData storage e = escrows[escrowId];
        require(msg.sender == e.buyer || msg.sender == e.seller, "Escrow: unauthorized");
        require(msg.value >= ARBITRATION_FEE, "Escrow: insufficient fee");
        require(e.disputeStatus == DisputeStatus.None, "Escrow: dispute exists");

        e.disputeStatus = DisputeStatus.Open;
        disputes[escrowId] = Dispute({
            escrowId:    escrowId,
            complainant: msg.sender,
            reason:      reason,
            timestamp:   block.timestamp,
            resolution:  Resolution.Seller,
            isResolved:  false
        });

        emit DisputeOpened(escrowId, msg.sender, reason);
    }

    function resolveDispute(uint256 escrowId, Resolution resolution) external onlyArbitrator nonReentrant {
        EscrowData storage e = escrows[escrowId];
        Dispute    storage d = disputes[escrowId];

        require(e.disputeStatus == DisputeStatus.Open, "Escrow: no active dispute");
        require(!d.isResolved, "Escrow: already resolved");

        d.resolution = resolution;
        d.isResolved = true;
        e.disputeStatus = DisputeStatus.Resolved;

        if (resolution == Resolution.Seller) {
            e.isReleased = true;
            payable(e.seller).transfer(e.amount);
            emit PaymentReleased(escrowId, e.seller, e.amount);
        } else if (resolution == Resolution.Buyer) {
            e.isRefunded = true;
            payable(e.buyer).transfer(e.amount);
            emit PaymentRefunded(escrowId, e.buyer, e.amount);
        } else {
            uint256 half = e.amount / 2;
            e.isReleased = true;
            e.isRefunded = true;
            payable(e.seller).transfer(half);
            payable(e.buyer).transfer(e.amount - half);
            emit PaymentReleased(escrowId, e.seller, half);
            emit PaymentRefunded(escrowId, e.buyer, e.amount - half);
        }

        emit DisputeResolved(escrowId, resolution);
    }

    function getEscrowData(uint256 escrowId) external view returns (EscrowData memory) {
        return escrows[escrowId];
    }

    function getDisputeData(uint256 escrowId) external view returns (Dispute memory) {
        return disputes[escrowId];
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
