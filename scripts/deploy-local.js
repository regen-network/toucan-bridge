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
				ETH_ADMIN_ACCOUNT: adminAccount.address,
				ETH_BRIDGE_ACCOUNT: bridgeAccount.address,
				ETH_CONTRACT_ADDRESS: bridge.address,
				ETH_GENESIS_DATA: dataAddresses,
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
