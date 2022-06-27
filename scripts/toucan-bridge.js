const hre = require("hardhat");
const fs = require("fs");

const { deployBridge } = require("../lib/bridge");

const MNEMONIC = process.env["MNEMONIC"];

async function deploy() {
	const owner = await getOwner();
	// TODO: set a right regenBridge and toucanRegistry addresses
	const regenBridge = "0x11241e35B3f79099123aA0C1C4c97b1FcdCd21f6";
	const toucanRegistry = "0xD838290e877E0188a4A44700463419ED96c16107";

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
