const hre = require("hardhat");
const fs = require("fs");
const assert = require("assert");

const { deployBridge } = require("../lib/bridge");

const { MNEMONIC, BRIDGE_CONTROLLER_ADDRESS, NCT_ADDRESS } = process.env;
assert(BRIDGE_CONTROLLER_ADDRESS, "`BRIDGE_CONTROLLER_ADDRESS` environment variable not set");
assert(NCT_ADDRESS, "`NCT_ADDRESS` environment variable not set");

async function deploy() {
	const owner = await getOwner();
	const tokenIssuer = BRIDGE_CONTROLLER_ADDRESS;
	const nct = NCT_ADDRESS;

	console.log("\nOwner", owner.address);
	console.log("Token issuer", tokenIssuer);
	console.log("NCT", nct);

	await deployBridge(tokenIssuer, nct);
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
