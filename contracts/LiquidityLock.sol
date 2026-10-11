// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Time lock for VVS Finance LP tokens
/// @notice Holds LP tokens (the receipt for the RRx / CRO pool) until `unlockTime`.
///         Nobody, including the beneficiary, can withdraw them before then, so
///         buyers can verify the liquidity cannot be pulled early.
/// @dev Send LP tokens to this contract with a normal transfer after it is deployed.
///      There is no owner and no way to shorten the lock. The beneficiary can
///      only extend it.
contract LiquidityLock {
    using SafeERC20 for IERC20;

    IERC20 public immutable lpToken;
    address public immutable beneficiary;
    uint256 public unlockTime;

    event LockExtended(uint256 newUnlockTime);
    event Released(address indexed to, uint256 amount);

    error StillLocked(uint256 unlockTime);
    error NotBeneficiary();
    error UnlockTimeInPast();
    error CanOnlyExtend();
    error NothingToRelease();

    constructor(IERC20 lpToken_, address beneficiary_, uint256 unlockTime_) {
        if (unlockTime_ <= block.timestamp) revert UnlockTimeInPast();
        lpToken = lpToken_;
        beneficiary = beneficiary_;
        unlockTime = unlockTime_;
    }

    /// @notice LP tokens currently locked.
    function lockedAmount() external view returns (uint256) {
        return lpToken.balanceOf(address(this));
    }

    function extendLock(uint256 newUnlockTime) external {
        if (msg.sender != beneficiary) revert NotBeneficiary();
        if (newUnlockTime <= unlockTime) revert CanOnlyExtend();
        unlockTime = newUnlockTime;
        emit LockExtended(newUnlockTime);
    }

    /// @notice After the unlock time, sends all LP tokens to the beneficiary.
    function release() external {
        if (block.timestamp < unlockTime) revert StillLocked(unlockTime);
        uint256 amount = lpToken.balanceOf(address(this));
        if (amount == 0) revert NothingToRelease();
        lpToken.safeTransfer(beneficiary, amount);
        emit Released(beneficiary, amount);
    }
}
