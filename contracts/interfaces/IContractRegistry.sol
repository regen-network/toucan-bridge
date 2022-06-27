// SPDX-License-Identifier:  GPL-3.0

pragma solidity ^0.8.4;

interface IContractRegistry {
    function checkERC20(address _address) external view returns (bool);
}
