// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Escrow for delivery app fees
/// @notice Holds the fees collected by RRoyalPayments (in RRx and stablecoins).
///         Funds stay here until the owner releases them. Token holders have no
///         claim on these funds.
contract RRoyalFeeVault is Ownable {
    using SafeERC20 for IERC20;

    event Released(address indexed token, address indexed to, uint256 amount);

    error ZeroAddress();

    constructor(address owner_) Ownable(owner_) {}

    /// @notice How much of `token` the vault currently holds.
    function balanceOf(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function release(address token, address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
        emit Released(token, to, amount);
    }
}
