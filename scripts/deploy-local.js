const hre = require("hardhat");

const { deployBridge } = require("../lib/bridge");
const { prepareToucanEnv } = require("../lib/toucan");

async function deploy() {
	const [adminAccount, bridgeAccount] = await hre.ethers.getSigners();
	const { registry, tco2Factory, nctPool, data } = await prepareToucanEnv(adminAccount, null);
	let dataAddresses = {};
	for (const key in data) {
		dataAddresses[key] = data[key].address;
	}
	const bridge = await deployBridge(bridgeAccount.address, registry.address, nctPool.address);
	console.log(`Adding bridge contract address ${bridge.address} to allow list...`);
	await tco2Factory.addToAllowlist(bridge.address);
	console.log("==== config data ====");
	console.log(
		JSON.stringify(
			{
				ADMIN_ACCOUNT: adminAccount.address,
				BRIDGE_ACCOUNT: bridgeAccount.address,
				BRIDGE_CONTRACT_ADDRESS: bridge.address,
				TCO2_FACTORY_ADDRESS: tco2Factory.address,
				REGISTRY_ADDRESS: registry.address,
				GENESIS_DATA: dataAddresses,
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
