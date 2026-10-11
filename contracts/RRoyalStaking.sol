// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title RRx staking with fee-funded rewards
/// @notice Holders stake RRx and earn a pro-rata share of every reward deposited
///         (app fees paid in RRx or a stablecoin). Rewards are split among stakers
///         at the moment they arrive; staked RRx can be withdrawn at any time.
/// @dev The owner can only add reward tokens. It can never move staked RRx or
///      rewards owed to stakers.
contract RRoyalStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_REWARD_TOKENS = 5;
    // 1e36 keeps 6-decimal stablecoin rewards exact even with very large RRx stakes.
    uint256 private constant PRECISION = 1e36;

    IERC20 public immutable stakingToken;

    uint256 public totalStaked;
    mapping(address => uint256) public stakedOf;

    address[] public rewardTokens;
    mapping(address => bool) public isRewardToken;
    /// @notice Accumulated reward per staked token, scaled by PRECISION.
    mapping(address => uint256) public rewardPerToken;
    /// @notice Rewards that arrived while nothing was staked; paid out with the next deposit.
    mapping(address => uint256) public queuedRewards;
    mapping(address => mapping(address => uint256)) public userRewardPerTokenPaid;
    mapping(address => mapping(address => uint256)) public pendingRewards;

    event RewardTokenAdded(address indexed token);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardAdded(address indexed token, uint256 amount);
    event RewardPaid(address indexed user, address indexed token, uint256 amount);

    error ZeroAmount();
    error NotRewardToken(address token);
    error TooManyRewardTokens();
    error AlreadyRewardToken(address token);
    error InsufficientStake();

    constructor(IERC20 stakingToken_, address owner_) Ownable(owner_) {
        stakingToken = stakingToken_;
    }

    function addRewardToken(address token) external onlyOwner {
        if (isRewardToken[token]) revert AlreadyRewardToken(token);
        if (rewardTokens.length >= MAX_REWARD_TOKENS) revert TooManyRewardTokens();
        isRewardToken[token] = true;
        rewardTokens.push(token);
        emit RewardTokenAdded(token);
    }

    function rewardTokenCount() external view returns (uint256) {
        return rewardTokens.length;
    }

    /// @notice Rewards `user` can claim right now for `token`.
    function earned(address user, address token) public view returns (uint256) {
        return pendingRewards[user][token]
            + (stakedOf[user] * (rewardPerToken[token] - userRewardPerTokenPaid[user][token])) / PRECISION;
    }

    /// @notice Deposit `amount` of a reward token, split among current stakers.
    ///         The caller must approve this contract first. Anyone may call it.
    function notifyReward(address token, uint256 amount) external nonReentrant {
        if (!isRewardToken[token]) revert NotRewardToken(token);
        if (amount == 0) revert ZeroAmount();
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit RewardAdded(token, amount);

        if (totalStaked == 0) {
            queuedRewards[token] += amount;
            return;
        }
        _distribute(token, amount + queuedRewards[token]);
        queuedRewards[token] = 0;
    }

    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _updateRewards(msg.sender);
        bool wasEmpty = totalStaked == 0;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        stakedOf[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
        if (wasEmpty) _flushQueued();
    }

    function withdraw(uint256 amount) public nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (stakedOf[msg.sender] < amount) revert InsufficientStake();
        _updateRewards(msg.sender);
        stakedOf[msg.sender] -= amount;
        totalStaked -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claim() public nonReentrant {
        _updateRewards(msg.sender);
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            address token = rewardTokens[i];
            uint256 amount = pendingRewards[msg.sender][token];
            if (amount > 0) {
                pendingRewards[msg.sender][token] = 0;
                IERC20(token).safeTransfer(msg.sender, amount);
                emit RewardPaid(msg.sender, token, amount);
            }
        }
    }

    /// @notice Withdraw the whole stake and claim all rewards.
    function exit() external {
        withdraw(stakedOf[msg.sender]);
        claim();
    }

    function _distribute(address token, uint256 amount) private {
        rewardPerToken[token] += (amount * PRECISION) / totalStaked;
    }

    function _flushQueued() private {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            address token = rewardTokens[i];
            uint256 queued = queuedRewards[token];
            if (queued > 0) {
                queuedRewards[token] = 0;
                _distribute(token, queued);
            }
        }
    }

    function _updateRewards(address user) private {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            address token = rewardTokens[i];
            pendingRewards[user][token] = earned(user, token);
            userRewardPerTokenPaid[user][token] = rewardPerToken[token];
        }
    }
}
