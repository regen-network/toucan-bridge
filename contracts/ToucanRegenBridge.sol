// SPDX-License-Identifier:  GPL-3.0-or-later
// Copyright (C) 2023 Toucan Labs

pragma solidity 0.8.14;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces/ITCO2.sol";
import "./interfaces/INCTPool.sol";

/**
 * @dev Implementation of the smart contract for Regen Ledger self custody bridge.
 *
 * See README file for more information about the functionality
 */
contract ToucanRegenBridge is Pausable, AccessControl {
    // ----------------------------------------
    //      Roles
    // ----------------------------------------

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant TOKEN_ISSUER_ROLE = keccak256("TOKEN_ISSUER_ROLE");

    modifier onlyPauser() {
        require(hasRole(PAUSER_ROLE, msg.sender), "caller does not have pauser role");
        _;
    }

    // ----------------------------------------
    //      State
    // ----------------------------------------

    /// @notice total amount of tokens burned and signalled for transfer
    uint256 public totalTransferred;

    /// @notice mapping TCO2s to burnt tokens; acts as a limiting
    /// mechanism during the minting process
    mapping(address => uint256) public tco2Limits;

    /// @notice address of the NCT pool to be able to check TCO2 eligibility
    INCTPool public immutable nctPool;

    /// @dev map of requests to ensure uniqueness
    mapping(string => bool) public origins;

    // ----------------------------------------
    //      Events
    // ----------------------------------------

    /// @notice emited when we bridge tokens from TCO2 to Regen Ledger
    event Bridge(address sender, string recipient, address tco2, uint256 amount);
    /// @notice emited when we bridge tokens back from Regen Ledger and issue on TCO2 contract
    event Issue(string sender, address recipient, address tco2, uint256 amount, string origin);

    // ----------------------------------------
    //      Modifiers
    // ----------------------------------------

    modifier isRegenAddress(bytes calldata account) {
        // verification: address length is 44 (standard) or 64 (derived)
        uint256 accountLen = account.length;
        require(accountLen == 44 || accountLen == 64, "regen address must be 44 or 64 chars");

        unchecked {
            // verification: check address starts with "regen1" prefix
            bytes memory prefix = "regen1";
            for (uint8 i = 0; i < 6; ++i)
                require(prefix[i] == account[i], "regen address must start with 'regen1'");

            // verification: check address contains only alphanumeric characters
            for (uint8 i = 6; i < accountLen; ++i) {
                bytes1 char = account[i];
                require(
                    (char >= 0x30 && char <= 0x39) || //9-0
                        (char >= 0x41 && char <= 0x5A) || //A-Z
                        (char >= 0x61 && char <= 0x7A), //a-z
                    "regen address must contain only alphanumeric characters"
                );
            }
        }
        _;
    }

    // ----------------------------------------
    //      Constructor
    // ----------------------------------------

    constructor(
        INCTPool nctPool_,
        bytes32[] memory roles,
        address[] memory accounts
    ) {
        require(address(nctPool_) != address(0), "should set nctPool to a non zero address");
        require(accounts.length == roles.length, "accounts and roles must have same length");
        nctPool = nctPool_;
        bool hasAdmin = false;
        for (uint256 i = 0; i < accounts.length; ++i) {
            _grantRole(roles[i], accounts[i]);
            if (roles[i] == DEFAULT_ADMIN_ROLE) hasAdmin = true;
        }
        require(hasAdmin, "should have at least one admin role");
    }

    // ----------------------------------------
    //      Functions
    // ----------------------------------------

    function pause() external onlyPauser {
        _pause();
    }

    function unpause() external onlyPauser {
        _unpause();
    }

    /**
     * @dev bridge tokens to Regen Network.
     * Burns Toucan TCO2 compatible tokens and signals a bridge event.
     * @param recipient Regen address to receive the TCO2
     * @param tco2 TCO2 address to burn
     * @param amount TCO2 amount to burn
     */
    function bridge(
        string calldata recipient,
        address tco2,
        uint256 amount
    ) external whenNotPaused isRegenAddress(bytes(recipient)) {
        require(amount > 0, "amount must be positive");
        require(nctPool.checkEligible(tco2), "TCO2 not eligible for NCT pool");

        //slither-disable-next-line divide-before-multiply
        uint256 precisionTest = (amount / 1e12) * 1e12;
        require(amount == precisionTest, "Only precision up to 6 decimals allowed");

        totalTransferred += amount;
        unchecked {
            // not possible to overflow if totalTransferred above
            // does not overflow
            tco2Limits[tco2] += amount;
        }

        emit Bridge(msg.sender, recipient, tco2, amount);
        ITCO2(tco2).bridgeBurn(msg.sender, amount);
    }

    /**
     * @notice issues TCO2 tokens back from Regen Network.
     * This functions must be called by a bridge account.
     * @param sender Regen address to send the TCO2
     * @param recipient Polygon address to receive the TCO2
     * @param tco2 TCO2 address to mint
     * @param amount TCO2 amount to mint
     * @param origin Random string provided to ensure uniqueness for this request
     */
    function issueTCO2Tokens(
        string calldata sender,
        address recipient,
        address tco2,
        uint256 amount,
        string calldata origin
    ) external whenNotPaused isRegenAddress(bytes(sender)) {
        require(
            hasRole(TOKEN_ISSUER_ROLE, msg.sender),
            "AccessControl: caller is missing TOKEN_ISSUER_ROLE"
        );
        require(amount > 0, "amount must be positive");
        require(!origins[origin], "duplicate origin");
        origins[origin] = true;

        // Limit how many tokens can be minted per TCO2; this is going to underflow
        // in case we try to mint more for a TCO2 than what has been burnt so it will
        // result in reverting the transaction.
        tco2Limits[tco2] -= amount;
        unchecked {
            // not possible to underflow if tco2Limits[tco2] above
            // does not underflow
            totalTransferred -= amount;
        }

        emit Issue(sender, recipient, tco2, amount, origin);
        ITCO2(tco2).bridgeMint(recipient, amount);
    }
}
