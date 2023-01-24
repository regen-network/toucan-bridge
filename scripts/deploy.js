const assert = require("assert");
const fs = require("fs");
const hre = require("hardhat");
const { ethers } = require("ethers");

const { deployBridge } = require("../lib/bridge");
const { deployFixedContracts } = require("../lib/toucan");

const {
	DEPLOY_ENVIRONMENT, 				// "live" or "local"
	OWNER_MNEMONIC, 						// (optional) owner mnemonic
	BRIDGE_CONTROLLER_ADDRESS,  // bridge controller address (i.e. token issuer)
	NCT_POOL_ADDRESS,						// NCT pool address
} = process.env;

async function deploy() {
	assert.ok(DEPLOY_ENVIRONMENT, "DEPLOY_ENVIRONMENT environment variable must be set");

	switch (DEPLOY_ENVIRONMENT) {
		case "live":
			await deployLive()
		case "local":
			await deployLocal()
		default:
			assert.fail(`unrecognized DEPLOY_ENVIRONMENT: ${DEPLOY_ENVIRONMENT}`);
	}
}

async function deployLive() {
	assert(BRIDGE_CONTROLLER_ADDRESS, "BRIDGE_CONTROLLER_ADDRESS environment variable must be set");
	assert(NCT_POOL_ADDRESS, "NCT_POOL_ADDRESS environment variable must be set");

  const contractOwner = await getOwner();

	console.log(`Deploying bridge contract with the following addresses:`);
	console.log(`Owner: ${contractOwner}`);
	console.log(`Token Issuer: ${BRIDGE_CONTROLLER_ADDRESS}`);
	console.log(`NCT Pool: ${NCT_POOL_ADDRESS}`);

	const bridge = await deployBridge(BRIDGE_CONTROLLER_ADDRESS, NCT_POOL_ADDRESS);

	console.log(`Deployed bridge with address ${bridge.address}`);
	console.log("Remember to add bridge address to the allow list");
}

async function deployLocal() {
	const [adminAccount, bridgeAccount] = await hre.ethers.getSigners();

	console.log(`Deploying fixed toucan contracts...`);

	// registry, projects, vintages, batches, tco2Factory, nctPool
	const env = await deployFixedContracts(adminAccount);
	let contracts = {};
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
	if (OWNER_MNEMONIC) return OWNER_MNEMONIC;

	console.log("OWNER_MNEMONIC environment variable not found. Looking for mnemonic.txt...");

	let mnemonic
	try {
		mnemonic = fs.readFileSync("./mnemonic.txt").toString().trim();
	} catch (e) {
		console.log(e);
	}

	assert.ok(mnemonic, `failed to get owner from OWNER_MNEMONIC or mnemonic.txt`);

	return ethers.Wallet.fromMnemonic(mnemonic);
}

deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
