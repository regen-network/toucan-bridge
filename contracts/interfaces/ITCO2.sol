// SPDX-License-Identifier:  GPL-3.0-or-later
// Copyright (C) 2023 Toucan Labs

pragma solidity 0.8.14;

interface ITCO2 {
    function bridgeBurn(address account, uint256 amount) external;

    function bridgeMint(address account, uint256 amount) external;
}
