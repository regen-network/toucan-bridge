const { ethers } = require("hardhat");

async function deployBridge(tco2Factory, regenBridge, toucanRegistry) {
	const Bridge = await ethers.getContractFactory("ToucanRegenBridge");
	const bridge = await Bridge.deploy(regenBridge, toucanRegistry);

	await bridge.deployed();
	console.log("Bridge deployed to %s", bridge.address);

	console.log(`Adding bridge contract address ${bridge.address} to allow list...`);
	await tco2Factory.addToAllowlist(bridge.address);

	return bridge;
}

module.exports = { deployBridge };
