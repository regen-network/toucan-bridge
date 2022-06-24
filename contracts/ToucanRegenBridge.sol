// SPDX-License-Identifier:  GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IToucanContractRegistry.sol";
import "./interfaces/IToucanCarbonOffsets.sol";

/**
 * @dev Implementation of the smart contract for Regen Ledger self custody bridge.
 *
 * See README file for more information about the functionality
 */
contract ToucanRegenBridge is Ownable, Pausable {
    IToucanContractRegistry public toucanContractRegistry;

    // @dev total amount of tokens burned and signalled for transfer
    uint256 public totalTransferred;

    // @dev mapping TCO2s to burnt tokens; acts as a limiting
    // mechanism during the minting process
    mapping(address => uint256) public tco2Limits;

    // @dev address of the bridge wallet authorized to issue TCO2 tokens.
    address public regenBridge;

    // ----------------------------------------
    //      Events
    // ----------------------------------------

    // event emited when we bridge tokens from TCO2 to Regen Ledger
    event Bridge(address sender, string recipient, address tco2, uint256 amount);
    // event emited when we bridge tokens back from Regen Ledger and issue on TCO2 contract
    event Issue(string sender, address recipient, address tco2, uint256 amount);

    // ----------------------------------------
    //      Modifiers
    // ----------------------------------------

    modifier isRegenAddress(bytes calldata account) {
        // verification: checking if account starts with "regen1"
        require(account.length >= 44, "regen address is at least 44 characters long");
        bytes memory prefix = "regen1";
        for (uint8 i = 0; i < 6; ++i)
            require(prefix[i] == account[i], "regen address must start with 'regen1'");
        _;
    }

    // ----------------------------------------
    //      Constructor
    // ----------------------------------------

    /**
     * @dev Sets the values for {regenBridge} and {toucanContractRegistry}.
     */
    constructor(address regenBridge_, IToucanContractRegistry toucanContractRegistry_)
        Ownable()
    {
        regenBridge = regenBridge_;
        toucanContractRegistry = toucanContractRegistry_;
    }

    // ----------------------------------------
    //      Functions
    // ----------------------------------------

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
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
        require(toucanContractRegistry.checkERC20(tco2), "not a TCO2");

        totalTransferred += amount;
        tco2Limits[tco2] += amount;

        emit Bridge(msg.sender, recipient, tco2, amount);
        IToucanCarbonOffsets(tco2).bridgeBurn(msg.sender, amount);
    }

    /**
     * @dev issues TCO2 tokens back from Regen Network.
     * This functions must be called by a bridge account.
     */
    function issueTCO2Tokens(
        string calldata sender,
        address recipient,
        address tco2,
        uint256 amount
    ) external whenNotPaused isRegenAddress(bytes(sender)) {
        require(amount > 0, "amount must be positive");
        require(msg.sender == regenBridge, "only bridge can issue tokens");

        // Limit how many tokens can be minted per TCO2; this is going to underflow
        // in case we try to mint more for a TCO2 than what has been burnt so it will
        // result in reverting the transaction.
        tco2Limits[tco2] -= amount;

        emit Issue(sender, recipient, tco2, amount);
        IToucanCarbonOffsets(tco2).bridgeMint(recipient, amount);
    }
}
