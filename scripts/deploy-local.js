const hre = require("hardhat");

const { deployBridge } = require("../lib/bridge");
const { prepareToucanEnv } = require("../lib/toucan");

async function deploy() {
	const [owner] = await hre.ethers.getSigners();
	const regenBridgeAccount = "0x11241e35B3f79099123aA0C1C4c97b1FcdCd21f6";
	const [registry, tco2Factory, data] = await prepareToucanEnv(owner, owner);
	let dataAddresses = {};
	Object.keys(data).forEach(function (key) {
		dataAddresses[key] = data[key].address;
	});
	const bridge = await deployBridge(regenBridgeAccount, registry.address);
	console.log(`Adding bridge contract address ${bridge.address} to allow list...`);
	await tco2Factory.addToAllowlist(bridge.address);
	console.log("==== config data ====");
	console.log(
		JSON.stringify(
			{
				OWNER: owner.address,
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
