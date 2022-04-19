// SPDX-License-Identifier:  GPL-3.0

pragma solidity ^0.8.4;

import "./Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @dev Implementation of the smart contract for Regen Ledger self custody bridge.
 *
 * See README file for more information about the functionality
 */
contract ToucanBridge is Ownable, Pausable {
    address public nctoRegistry;

    /** @dev total amount of tokens burned and signalled for transfer */
    uint256 public totalTransferred;

    /**
     * @dev Sets the values for {owner} and {nctoRegistry}.
     */
    constructor(address owner, address nctoRegistry_) Ownable(owner) {
        nctoRegistry = nctoRegistry_;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }


    /**
     * @dev burns Toucan TCO2 compatible tokens (whitelisted in ncto) and signals a
     * bridge event.
     */
    function bridge(string memory recipient, address tco2, uint256 amount, string memory note)
        external whenNotPaused() {
        // TODO
        // + verify recipient is valid regen address
        // + check tco2 contract
        // + transferFrom tco2
        // + burn
    }
}
