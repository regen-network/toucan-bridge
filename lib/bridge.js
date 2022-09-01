const { ethers } = require("hardhat");

async function deployBridge(tokenIssuer, nctPool) {
	const Bridge = await ethers.getContractFactory("ToucanRegenBridge");
	const bridge = await Bridge.deploy(tokenIssuer, nctPool);

	await bridge.deployed();
	return bridge;
}

module.exports = { deployBridge };
