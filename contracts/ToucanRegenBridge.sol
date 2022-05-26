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

    /** @dev total amount of tokens burned and signalled for transfer */
    uint256 public totalTransferred;

    // @dev address of the brideg wallet authorized to issue TCO2 tokens.
    address public regenBridge;

    // ----------------------------------------
    //      Events
    // ----------------------------------------

    // event emited when we bridge tokens from TCO2 to Regen Ledger
    event Bridge(address sender, string recipient, address tco2, uint256 amount);
    // event emited when we bridge tokens back from Regen Ledger and issue on TCO2 contract
    event Issue(string sender, address recipient, address tco2, uint256 amount);

    /**
     * @dev Sets the values for {regenBridge} and {toucanContractRegistry}.
     */
    constructor(address regenBridge_, IToucanContractRegistry toucanContractRegistry_)
        Ownable()
    {
        regenBridge = regenBridge_;
        toucanContractRegistry = toucanContractRegistry_;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev bridge tokens to Regen Network.
     * Burns Toucan TCO2 compatible tokens (whitelisted in ncto) and signals a
     * bridge event.
     */
    function bridge(
        string calldata recipient,
        IToucanCarbonOffsets tco2,
        uint256 amount,
        string calldata note
    ) external whenNotPaused {
        require(amount > 0, "amount must be positive");
        require(
            isRegenAddress(bytes(recipient)),
            "recipient must a Regen Ledger account address"
        );
        require(toucanContractRegistry.checkERC20(address(tco2)), "not a Toucan contract");

        totalTransferred += amount;

        emit Bridge(msg.sender, recipient, address(tco2), amount);
        tco2.retireFrom(msg.sender, amount);

        // TODO
        // + burn (needs that functionality from the Toucan side)
    }

    /**
     * @dev issues TCO2 tokens back from Regen Network.
     * This functions must be called by a bridge account.
     */
    function issueTCO2Tokens(
        string memory sender,
        address recipient,
        IToucanCarbonOffsets tco2,
        uint256 amount,
        string calldata note
    ) public {
        require(isRegenAddress(bytes(sender)), "recipient must a Regen Ledger account address");
        require(msg.sender == regenBridge, "only bridge can issue tokens");

        emit Issue(sender, recipient, address(tco2), amount);
        // TODO: finish the implementation
        // + mint tco2 tokens
        // + define and implement checks
    }

    function isRegenAddress(bytes memory recipient) internal pure returns (bool) {
        // verification: checking if recipient starts with "regen1"
        require(recipient.length >= 44, "regen address is at least 44 characters long");
        bytes memory prefix = "regen1";
        for (uint8 i = 0; i < 6; ++i)
            require(prefix[i] == recipient[i], "regen address must start with 'regen1'");
        return true;
    }
}
