const assert = require("assert");
const fs = require("fs");
const hre = require("hardhat");
const { ethers } = require("ethers");

const { deployBridge } = require("../lib/bridge");
const { deployFixedContracts } = require("../lib/toucan");

const {
	DEPLOY_ENVIRONMENT, // "live" or "local"
	MNEMONIC, // only used in "live" environment and not required if mnemonic.txt file exists
	BRIDGE_CONTROLLER_ADDRESS, // only used in "live" environment
	NCT_ADDRESS, // only used in "live" environment
} = process.env;

async function deploy() {
	assert.ok(DEPLOY_ENVIRONMENT, "DEPLOY_ENVIRONMENT environment variable must be set");

	switch (DEPLOY_ENVIRONMENT) {
		case "live":
			await deployLive();
			break;
		case "local":
			await deployLocal();
			break;
		default:
			assert.fail(`unrecognized DEPLOY_ENVIRONMENT: ${DEPLOY_ENVIRONMENT}`);
	}
}

async function deployLive() {
	assert.ok(NCT_ADDRESS, "NCT_ADDRESS environment variable must be set");
	// Set minter to empty if not provided
	let tokenIssuer = BRIDGE_CONTROLLER_ADDRESS;
	if (!tokenIssuer) {
		tokenIssuer = ethers.constants.AddressZero;
	}

	const contractOwner = await getOwner();

	console.log(`Deploying bridge contract with the following addresses:`);
	console.log(`Owner: ${contractOwner}`);
	console.log(`Token Issuer: ${tokenIssuer}`);
	console.log(`NCT Pool: ${NCT_ADDRESS}`);

	const bridge = await deployBridge(tokenIssuer, NCT_ADDRESS);

	console.log(`Deployed bridge with address ${bridge.address}`);
	console.log("Remember to add bridge address to the allow list");
}

async function deployLocal() {
	const [adminAccount, bridgeAccount] = await hre.ethers.getSigners();

	console.log(`Deploying fixed toucan contracts...`);

	// registry, projects, vintages, batches, tco2Factory, nctPool
	const env = await deployFixedContracts(adminAccount);
	const contracts = {};
	for (const key in env) {
		contracts[key] = env[key].address;
	}

	console.log(`Deploying bridge contract with the following addresses:`);
	console.log(`Owner: ${adminAccount.address}`);
	console.log(`Token Issuer: ${bridgeAccount.address}`);
	console.log(`NCT Pool: ${env.nctPool.address}`);

	const bridge = await deployBridge(bridgeAccount.address, env.nctPool.address);

	contracts["bridge"] = bridge.address;

	console.log(`Adding bridge contract address ${bridge.address} to allow list...`);

	await env.tco2Factory.addToAllowlist(bridge.address);

	console.log("==== config data ====");
	console.log(
		JSON.stringify(
			{
				ETH_ADMIN_ACCOUNT: adminAccount.address,
				ETH_BRIDGE_ACCOUNT: bridgeAccount.address,
				ETH_CONTRACT_ADDRESS: bridge.address,
				ETH_CONTRACTS: contracts,
			},
			null,
			2
		)
	);
}

async function getOwner() {
	if (MNEMONIC) {
		return ethers.Wallet.fromMnemonic(MNEMONIC);
	}

	console.log("MNEMONIC environment variable not found. Looking for mnemonic.txt...");
	const mnemonic = fs.readFileSync("./mnemonic.txt").toString().trim();

	return ethers.Wallet.fromMnemonic(mnemonic);
}

deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
