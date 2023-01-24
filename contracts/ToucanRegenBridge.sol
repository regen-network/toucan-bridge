// SPDX-License-Identifier:  GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces/IContractRegistry.sol";
import "./interfaces/ITCO2.sol";
import "./interfaces/INCTPool.sol";

/**
 * @dev Implementation of the smart contract for Regen Ledger self custody bridge.
 *
 * See README file for more information about the functionality
 */
contract ToucanRegenBridge is Ownable, Pausable, AccessControl {
    // ----------------------------------------
    //      Roles
    // ----------------------------------------

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

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

    /// @notice address of the bridge wallet authorized to issue TCO2 tokens.
    address public tokenIssuer;

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
    /// @notice emited when the token issuer is updated
    event TokenIssuerUpdated(address oldIssuer, address newIssuer);

    // ----------------------------------------
    //      Modifiers
    // ----------------------------------------

    modifier isRegenAddress(bytes calldata account) {
        // verification: address length is 44 (standard) or 64 (derived)
        uint256 accountLen = account.length;
        require(accountLen == 44 || accountLen == 64, "regen address must be 44 or 64 chars");

        // verification: check address starts with "regen1" prefix
        bytes memory prefix = "regen1";
        for (uint8 i = 0; i < 6; ++i)
            require(prefix[i] == account[i], "regen address must start with 'regen1'");

        // verification: check address contains only alphanumeric characters
        for (uint64 i = 0; i < account.length; i++) {
            bytes1 char = account[i];
            require(
                (char >= 0x30 && char <= 0x39) || //9-0
                    (char >= 0x41 && char <= 0x5A) || //A-Z
                    (char >= 0x61 && char <= 0x7A), //a-z
                "regen address must contain only alphanumeric characters"
            );
        }
        _;
    }

    // ----------------------------------------
    //      Constructor
    // ----------------------------------------

    constructor(address tokenIssuer_, INCTPool nctPool_) Ownable() {
        tokenIssuer = tokenIssuer_;
        nctPool = nctPool_;
        _grantRole(PAUSER_ROLE, msg.sender);
        if (tokenIssuer_ != address(0)) {
            _grantRole(PAUSER_ROLE, tokenIssuer_);
            emit TokenIssuerUpdated(address(0), tokenIssuer_);
        }
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
     * @notice Enable the contract owner to rotate the
     * token issuer.
     * @param newIssuer Token issuer to be set
     */
    function setTokenIssuer(address newIssuer) external onlyOwner {
        address oldIssuer = tokenIssuer;
        require(oldIssuer != newIssuer, "already set");

        tokenIssuer = newIssuer;
        emit TokenIssuerUpdated(oldIssuer, newIssuer);
    }

    function grantPauserRole(address newPauser) external onlyOwner {
        _grantRole(PAUSER_ROLE, newPauser);
    }

    function revokePauserRole(address pauser) external onlyOwner {
        _revokeRole(PAUSER_ROLE, pauser);
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
        tco2Limits[tco2] += amount;

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
        require(amount > 0, "amount must be positive");
        require(msg.sender == tokenIssuer, "invalid caller");
        require(!origins[origin], "duplicate origin");
        origins[origin] = true;

        // Limit how many tokens can be minted per TCO2; this is going to underflow
        // in case we try to mint more for a TCO2 than what has been burnt so it will
        // result in reverting the transaction.
        tco2Limits[tco2] -= amount;

        emit Issue(sender, recipient, tco2, amount, origin);
        ITCO2(tco2).bridgeMint(recipient, amount);
    }
}
