// SPDX-License-Identifier:  Apache-2.0

pragma solidity ^0.8.4;

contract Ownable {

    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address owner_) {
        owner = owner_;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "not an owner");
        _;
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        address oldOwner = newOwner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

}
