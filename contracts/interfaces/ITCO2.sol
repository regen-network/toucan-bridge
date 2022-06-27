// SPDX-License-Identifier:  GPL-3.0

pragma solidity ^0.8.4;

interface ITCO2 {
    function bridgeBurn(address account, uint256 amount) external;

    function bridgeMint(address account, uint256 amount) external;
}
