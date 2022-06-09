// SPDX-License-Identifier:  GPL-3.0

pragma solidity ^0.8.4;

interface IToucanCarbonOffsets {
    function bridgeBurn(address account, uint256 amount) external;
}
