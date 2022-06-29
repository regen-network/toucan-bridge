const hre = require("hardhat");
const fs = require("fs");
const assert = require("assert");

const { deployBridge } = require("../lib/bridge");

const { MNEMONIC, BRIDGE_CONTROLLER_ADDRESS, TOUCAN_CONTRACT_REGISTRY_ADDRESS } = process.env;
assert(BRIDGE_CONTROLLER_ADDRESS, "`BRIDGE_CONTROLLER_ADDRESS` environment variable not set");
assert(TOUCAN_CONTRACT_REGISTRY_ADDRESS, "`TOUCAN_CONTRACT_REGISTRY_ADDRESS` environment variable not set");

async function deploy() {
	const owner = await getOwner();
	const regenBridge = BRIDGE_CONTROLLER_ADDRESS;
	const toucanRegistry = TOUCAN_CONTRACT_REGISTRY_ADDRESS;

	console.log("\nOwner address", owner.address);
	console.log("Regen bridge address", regenBridge);
	console.log("Toucan contract registry", toucanRegistry);

	await deployBridge(regenBridge, toucanRegistry);
}

async function getOwner() {
	const mnemonic = getMnemonic();

	if (mnemonic) {
		console.log("Using mnemonic as signer");
		return ethers.Wallet.fromMnemonic(mnemonic);
	}

	console.log("Defaulting to first account from Hardhat");
	const [owner] = await hre.ethers.getSigners();
	return owner;
}

// Either get the mnemonic from the env var `MNEMONIC` if it is present
// or a text file called `mnemonic.txt`.
function getMnemonic() {
	if (MNEMONIC) return MNEMONIC;

	console.log("`MNEMONIC` environment var not found. Looking for mnemonic.txt");
	try {
		return fs.readFileSync("./mnemonic.txt").toString().trim();
	} catch (e) {
		console.log("'./mnemonic.txt' file not found.");
		return undefined;
	}
}

deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
