const assert = require("assert");
const fs = require("fs");
const hre = require("hardhat");

const { deployBridge } = require("../lib/bridge");

const { MNEMONIC, BRIDGE_CONTROLLER_ADDRESS, NCT_ADDRESS } = process.env;

async function deploy() {
	assert.ok(NCT_ADDRESS, "NCT_ADDRESS environment variable must be set");
	// Set minter to empty if not provided
	let tokenIssuer = BRIDGE_CONTROLLER_ADDRESS;
	if (!tokenIssuer) {
		tokenIssuer = hre.ethers.constants.AddressZero;
	}

	const [deployer] = await hre.ethers.getSigners();

	console.log(`Deploying bridge contract with the following addresses:`);
	console.log(`Owner: ${deployer.address}`);
	console.log(`Token Issuer: ${tokenIssuer}`);
	console.log(`NCT Pool: ${NCT_ADDRESS}`);

	const bridge = await deployBridge(tokenIssuer, NCT_ADDRESS);

	console.log(`Deployed bridge with address ${bridge.address}`);
	console.log("Remember to add bridge address to the allow list");
}

deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
