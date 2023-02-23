// SPDX-License-Identifier:  GPL-3.0-or-later
// Copyright (C) 2023 Toucan Labs

pragma solidity 0.8.14;

interface INCTPool {
    function checkEligible(address erc20Addr) external view returns (bool);
}
