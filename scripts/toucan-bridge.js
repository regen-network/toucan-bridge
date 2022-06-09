const hre = require("hardhat");

const { deployBridge } = require("../lib/bridge");

async function deploy() {
	// TODO: update to use other signers besides Hardhat
	const [owner] = await hre.ethers.getSigners();
	// TODO: set a right regenBridge and toucanRegistry addresses
	const regenBridge = "0x11241e35B3f79099123aA0C1C4c97b1FcdCd21f6";
	const toucanRegistry = "0xD838290e877E0188a4A44700463419ED96c16107";

	console.log("Owner address", owner.address);
	console.log("Regen bridge address", regenBridge);
	console.log("Toucan contract registry", toucanRegistry);

	await deployBridge(regenBridge, toucanRegistry);
}

deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
