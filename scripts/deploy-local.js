const hre = require("hardhat");

const { deployBridge } = require("../lib/bridge");
const { deployFixedContracts } = require("../lib/toucan");

async function deployLocal() {
	const [adminAccount, bridgeAccount] = await hre.ethers.getSigners();

	console.log(`Deploying fixed toucan contracts...`);

	// registry, projects, vintages, batches, tco2Factory, nctPool
	const env = await deployFixedContracts(adminAccount);
	const contracts = {};
	for (const key in env) {
		contracts[key] = env[key].address;
	}

	const DEFAULT_ADMIN_ROLE = hre.ethers.constants.HashZero;
	const PAUSER_ROLE = hre.ethers.utils.id("PAUSER_ROLE");
	const TOKEN_ISSUER_ROLE = hre.ethers.utils.id("TOKEN_ISSUER_ROLE");

	console.log(`Deploying bridge contract with the following addresses:`);
	console.log(`Owner: ${adminAccount.address}`);
	console.log(`Token Issuer: ${bridgeAccount.address}`);
	console.log(`NCT Pool: ${env.nctPool.address}`);

	const bridge = await deployBridge(
		adminAccount,
		env.nctPool.address,
		[DEFAULT_ADMIN_ROLE, PAUSER_ROLE, TOKEN_ISSUER_ROLE],
		[adminAccount.address, adminAccount.address, bridgeAccount.address]
	);

	contracts["bridge"] = bridge.address;

	console.log(`Adding bridge contract address ${bridge.address} to allow list...`);

	await env.tco2Factory.addToAllowedBridges(bridge.address);

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

deployLocal()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
