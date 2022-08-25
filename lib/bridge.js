const { ethers } = require("hardhat");

async function deployBridge(regenBridge, nctPool) {
	const Bridge = await ethers.getContractFactory("ToucanRegenBridge");
	const bridge = await Bridge.deploy(regenBridge, nctPool);

	await bridge.deployed();
	return bridge;
}

module.exports = { deployBridge };
