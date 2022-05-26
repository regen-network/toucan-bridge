// SPDX-License-Identifier:  GPL-3.0

pragma solidity ^0.8.4;

interface IToucanCarbonOffsets {
    function retireFrom(address sender, uint256 amount) external returns (uint256);
}
