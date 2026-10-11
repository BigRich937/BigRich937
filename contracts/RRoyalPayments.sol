// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IRRoyalStaking {
    function notifyReward(address token, uint256 amount) external;
}

/// @title Order payments for the RRoyal delivery app
/// @notice Customers pay for an order in RRx or an accepted stablecoin. A fee
///         (feeBps / 10000) goes to RRx stakers; the rest goes to the treasury.
/// @dev The app backend creates an order id, asks the customer to call `pay`,
///      then confirms the matching `OrderPaid` event (id, token, amount) before
///      dispatching the order. This contract never holds funds between calls.
contract RRoyalPayments is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint16 public constant MAX_FEE_BPS = 2000; // 20%

    address public treasury;
    IRRoyalStaking public staking;
    uint16 public feeBps;

    mapping(address => bool) public acceptedToken;
    mapping(bytes32 => bool) public orderPaid;

    event OrderPaid(bytes32 indexed orderId, address indexed payer, address indexed token, uint256 amount, uint256 fee);
    event TokenAccepted(address indexed token, bool accepted);
    event FeeUpdated(uint16 feeBps);
    event TreasuryUpdated(address treasury);
    event StakingUpdated(address staking);

    error TokenNotAccepted(address token);
    error OrderAlreadyPaid(bytes32 orderId);
    error ZeroAmount();
    error ZeroAddress();
    error FeeTooHigh();

    constructor(address owner_, address treasury_, IRRoyalStaking staking_, uint16 feeBps_) Ownable(owner_) {
        _setTreasury(treasury_);
        _setStaking(staking_);
        _setFee(feeBps_);
    }

    function pay(bytes32 orderId, address token, uint256 amount) external nonReentrant {
        if (!acceptedToken[token]) revert TokenNotAccepted(token);
        if (amount == 0) revert ZeroAmount();
        if (orderPaid[orderId]) revert OrderAlreadyPaid(orderId);
        orderPaid[orderId] = true;

        uint256 fee = (amount * feeBps) / 10_000;
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        if (fee > 0) {
            IERC20(token).forceApprove(address(staking), fee);
            staking.notifyReward(token, fee);
        }
        IERC20(token).safeTransfer(treasury, amount - fee);

        emit OrderPaid(orderId, msg.sender, token, amount, fee);
    }

    /// @notice Every accepted token must also be a reward token on the staking contract.
    function setAcceptedToken(address token, bool accepted) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        acceptedToken[token] = accepted;
        emit TokenAccepted(token, accepted);
    }

    function setFee(uint16 feeBps_) external onlyOwner {
        _setFee(feeBps_);
    }

    function setTreasury(address treasury_) external onlyOwner {
        _setTreasury(treasury_);
    }

    function setStaking(IRRoyalStaking staking_) external onlyOwner {
        _setStaking(staking_);
    }

    function _setFee(uint16 feeBps_) private {
        if (feeBps_ > MAX_FEE_BPS) revert FeeTooHigh();
        feeBps = feeBps_;
        emit FeeUpdated(feeBps_);
    }

    function _setTreasury(address treasury_) private {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    function _setStaking(IRRoyalStaking staking_) private {
        if (address(staking_) == address(0)) revert ZeroAddress();
        staking = staking_;
        emit StakingUpdated(address(staking_));
    }
}
