// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @title Fixed-supply ERC-20 token for Cronos
/// @notice The entire supply is minted once, at deployment, to `recipient`.
///         There is no owner, no further minting, and no admin controls,
///         so holders can verify the supply can never be inflated.
contract Token is ERC20, ERC20Burnable, ERC20Permit {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        address recipient
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        _mint(recipient, initialSupply);
    }
}
