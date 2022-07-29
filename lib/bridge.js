const { ethers } = require("hardhat");

async function deployBridge(regenBridge, toucanRegistry, nctPool) {
	const Bridge = await ethers.getContractFactory("ToucanRegenBridge");
	const bridge = await Bridge.deploy(regenBridge, toucanRegistry, nctPool);

	await bridge.deployed();
	return bridge;
}

module.exports = { deployBridge };
