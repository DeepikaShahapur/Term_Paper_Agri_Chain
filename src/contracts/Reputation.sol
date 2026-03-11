// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Reputation is Ownable {
    struct ReputationData {
        uint256 score;
        uint256 totalTransactions;
        uint256 successfulTransactions;
        uint256 failedTransactions;
        uint256 lastUpdate;
        bool    isActive;
    }

    struct Review {
        uint256 reviewId;
        address reviewer;
        address reviewee;
        uint256 rating;
        string  comment;
        uint256 timestamp;
        bool    isVerified;
    }

    mapping(address  => ReputationData) public reputations;
    mapping(uint256  => Review)         public reviews;
    mapping(address  => uint256[])      public userReviews;

    uint256 private _reviewCounter;

    uint256 public constant MAX_SCORE  = 1000;
    uint256 public constant MIN_RATING = 1;
    uint256 public constant MAX_RATING = 5;

    event ReputationUpdated(address indexed user, uint256 newScore, uint256 totalTransactions);
    event ReviewAdded(uint256 indexed reviewId, address reviewer, address reviewee, uint256 rating);
    event ReviewVerified(uint256 indexed reviewId, bool verified);

    constructor() Ownable(msg.sender) {}

    modifier validRating(uint256 rating) {
        require(rating >= MIN_RATING && rating <= MAX_RATING, "Reputation: invalid rating");
        _;
    }

    function registerUser(address user) external onlyOwner {
        require(!reputations[user].isActive, "Reputation: already registered");
        reputations[user] = ReputationData({
            score:                  500,
            totalTransactions:      0,
            successfulTransactions: 0,
            failedTransactions:     0,
            lastUpdate:             block.timestamp,
            isActive:               true
        });
    }

    function addReview(address reviewee, uint256 rating, string memory comment)
        external validRating(rating) returns (uint256)
    {
        require(msg.sender != reviewee, "Reputation: cannot self-review");
        require(reputations[reviewee].isActive, "Reputation: reviewee not active");
        require(reputations[msg.sender].isActive, "Reputation: reviewer not active");

        _reviewCounter++;
        uint256 id = _reviewCounter;

        reviews[id] = Review({
            reviewId:   id,
            reviewer:   msg.sender,
            reviewee:   reviewee,
            rating:     rating,
            comment:    comment,
            timestamp:  block.timestamp,
            isVerified: false
        });

        userReviews[reviewee].push(id);
        emit ReviewAdded(id, msg.sender, reviewee, rating);
        return id;
    }

    function verifyReview(uint256 reviewId) external onlyOwner {
        require(reviewId <= _reviewCounter, "Reputation: invalid review");
        require(!reviews[reviewId].isVerified, "Reputation: already verified");

        reviews[reviewId].isVerified = true;
        _updateScore(reviews[reviewId].reviewee, reviews[reviewId].rating);
        emit ReviewVerified(reviewId, true);
    }

    function recordTransactionSuccess(address user) external onlyOwner {
        require(reputations[user].isActive, "Reputation: not active");
        ReputationData storage r = reputations[user];
        r.totalTransactions++;
        r.successfulTransactions++;
        r.lastUpdate = block.timestamp;
        if (r.score < MAX_SCORE) r.score = r.score + 10 > MAX_SCORE ? MAX_SCORE : r.score + 10;
        emit ReputationUpdated(user, r.score, r.totalTransactions);
    }

    function recordTransactionFailure(address user) external onlyOwner {
        require(reputations[user].isActive, "Reputation: not active");
        ReputationData storage r = reputations[user];
        r.totalTransactions++;
        r.failedTransactions++;
        r.lastUpdate = block.timestamp;
        r.score = r.score >= 20 ? r.score - 20 : 0;
        emit ReputationUpdated(user, r.score, r.totalTransactions);
    }

    function _updateScore(address user, uint256 rating) internal {
        ReputationData storage r = reputations[user];
        if      (rating == 5) r.score = r.score + 20 > MAX_SCORE ? MAX_SCORE : r.score + 20;
        else if (rating == 4) r.score = r.score + 10 > MAX_SCORE ? MAX_SCORE : r.score + 10;
        else if (rating == 2) r.score = r.score >= 10 ? r.score - 10 : 0;
        else if (rating == 1) r.score = r.score >= 20 ? r.score - 20 : 0;
        r.lastUpdate = block.timestamp;
        emit ReputationUpdated(user, r.score, r.totalTransactions);
    }

    function getUserReputation(address user) external view returns (ReputationData memory) {
        return reputations[user];
    }

    function getUserReviews(address user) external view returns (uint256[] memory) {
        return userReviews[user];
    }

    function getReview(uint256 reviewId) external view returns (Review memory) {
        return reviews[reviewId];
    }

    function calculateReputationLevel(address user) external view returns (string memory) {
        uint256 score = reputations[user].score;
        if      (score >= 800) return "Excellent";
        else if (score >= 600) return "Good";
        else if (score >= 400) return "Average";
        else if (score >= 200) return "Poor";
        else                   return "Very Poor";
    }

    function deactivateUser(address user) external onlyOwner {
        reputations[user].isActive = false;
    }
}
