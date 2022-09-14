const hre = require("hardhat");

const { deployBridge } = require("../lib/bridge");
const { deployFixedContracts } = require("../lib/toucan");

async function deploy() {
	const [adminAccount, bridgeAccount] = await hre.ethers.getSigners();

	console.log(`Deploying fixed contracts...`);
	// registry, projects, vintages, batches, tco2Factory, nctPool
	const env = await deployFixedContracts(adminAccount);
	let contracts = {};
	for (const key in env) {
		contracts[key] = env[key].address;
	}

	console.log(`Deploying bridge...`);
	const bridge = await deployBridge(bridgeAccount.address, env.nctPool.address);
	contracts["bridge"] = bridge.address;

	console.log(`Adding bridge contract address ${bridge.address} to allow list...`);
	await env.tco2Factory.addToAllowlist(bridge.address);

	console.log("==== config data ====");
	console.log(
		JSON.stringify(
			{
				ETH_CONTRACT_ADDRESS: bridge.address,
				ETH_CONTRACTS: contracts,
			},
			null,
			2
		)
	);
}

deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
