// SPDX-License-Identifier:  GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Implementation of the smart contract for testing the Regen Ledger self custody bridge.
 *
 * See README file for more information about the functionality
 */
contract ToucanRegenBridgeMock is Ownable, Pausable {
    /** @dev total amount of tokens burned and signalled for transfer */
    uint256 public totalTransferred;

    // ----------------------------------------
    //      Events
    // ----------------------------------------

    // event emited when we bridge tokens from TCO2 to Regen Ledger
    event Bridge(address sender, string recipient, address tco2, uint256 amount);
    // event emited when we bridge tokens back from Regen Ledger and issue on TCO2 contract
    event Issue(string sender, address recipient, address tco2, uint256 amount);

    /**
     * @dev Sets the values for {owner} and {nctoRegistry}.
     */
    constructor() Ownable() {}

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev a mock method to test the bridge service.
     * It will accept a transfer only if tco2 token address is odd (las bit is 1)
     */
    function bridge(
        string calldata recipient,
        address tco2,
        uint256 amount,
        string calldata note
    ) external whenNotPaused {
        require(amount > 0, "amount must be positive");
        require(
            isRegenAddress(bytes(recipient)),
            "recipient must a Regen Ledger account address"
        );
        require(uint160(tco2) & 1 == 1, "contract not part of the Toucan NCT registry");

        totalTransferred += amount;
        emit Bridge(msg.sender, recipient, address(tco2), amount);
    }

    /**
     * @dev issues TCO2 tokens back from Regen Network.
     * This functions must be called by a bridge account.
     */
    function issueTCO2Tokens(
        string memory sender,
        address recipient,
        address tco2,
        uint256 amount,
        string calldata note
    ) public {
        require(isRegenAddress(bytes(sender)), "recipient must a Regen Ledger account address");

        emit Issue(sender, recipient, tco2, amount);
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
