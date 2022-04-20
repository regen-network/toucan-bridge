// SPDX-License-Identifier:  GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/Pausable.sol";
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./Ownable.sol";
import "./toucan-contracts/contracts/interfaces/IToucanContractRegistry.sol";
import "./toucan-contracts/contracts/ToucanCarbonOffsets.sol";

/**
 * @dev Implementation of the smart contract for Regen Ledger self custody bridge.
 *
 * See README file for more information about the functionality
 */
contract ToucanBridge is Ownable, Pausable {
    IToucanContractRegistry public nctoRegistry;

    /** @dev total amount of tokens burned and signalled for transfer */
    uint256 public totalTransferred;

    /**
     * @dev Sets the values for {owner} and {nctoRegistry}.
     */
    constructor(address owner, IToucanContractRegistry nctoRegistry_) Ownable(owner) {
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
    function bridge(
        string memory recipient,
        ToucanCarbonOffsets tco2,
        uint256 amount,
        string memory note
    ) external whenNotPaused {
        require(isRegenAddress(recipient), "recipient must a Regen Ledger account address");
        totalTransferred += amount;

        require(
            nctoRegistry.checkERC20(address(tco2)),
            "contract not part of the Toucan NCT registry"
        );
        tco2.retireFrom(msg.sender, amount);

        // TODO
        // + burn
        // + emit
    }

    function isRegenAddress(string memory recipient) internal pure returns (bool) {
        // TODO
        // + verify recipient is valid regen address
        return true;
    }
}
