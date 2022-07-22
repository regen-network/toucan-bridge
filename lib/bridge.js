const { ethers } = require("hardhat");

async function deployBridge(regenBridge, toucanRegistry, nctPool) {
	const Bridge = await ethers.getContractFactory("ToucanRegenBridge");
	const bridge = await Bridge.deploy(regenBridge, toucanRegistry, nctPool);

	await bridge.deployed();
	console.log("Bridge deployed to %s", bridge.address);

	return bridge;
}

module.exports = { deployBridge };
