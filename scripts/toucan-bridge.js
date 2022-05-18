const hre = require("hardhat");

async function deploy() {
	// Hardhat always runs the compile task when running scripts with its command
	// line interface.

	// TODO: set a right regenBridge and nctRegistry addresses

	const [owner] = await ethers.getSigners();
	const regenBridge = "0x11241e35B3f79099123aA0C1C4c97b1FcdCd21f6";
	const nctRegistry = "0xD838290e877E0188a4A44700463419ED96c16107";
	console.log("OWNER address", owner.address);
	console.log("Regen BridgeService address", regenBridge.address, nctRegistry);

	const Bridge = await hre.ethers.getContractFactory("ToucanBridge");
	const bridge = await Bridge.deploy(owner.address);

	let receipt = await bridge.deployed();

	console.log("Bridge deployed to %s", bridge.address);
	// console.log("receipt", receipt)
}

deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

// yarn hardhat run scripts/toucan-bridge-mock.js  --network mumbai
