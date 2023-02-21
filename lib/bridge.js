const { ethers } = require("hardhat");

async function deployBridge(deployer, nctPool) {
	const Bridge = await ethers.getContractFactory("ToucanRegenBridge");
	const bridge = await Bridge.connect(deployer).deploy(nctPool);

	await bridge.deployed();
	return bridge;
}

module.exports = { deployBridge };
