const { ethers } = require("hardhat");

async function deployBridge(deployer, nctPool, accounts, roles) {
	const Bridge = await ethers.getContractFactory("ToucanRegenBridge");
	const bridge = await Bridge.connect(deployer).deploy(nctPool, accounts, roles);

	await bridge.deployed();
	return bridge;
}

module.exports = { deployBridge };
