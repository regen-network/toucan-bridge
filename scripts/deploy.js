const hre = require("hardhat");

const { deployBridge } = require("../lib/bridge");
const { prepareToucanEnv } = require("../lib/toucan");

async function deploy() {
	const [owner] = await hre.ethers.getSigners();
	const regenBridgeAccount = "0x11241e35B3f79099123aA0C1C4c97b1FcdCd21f6";
	const [registry, tco2Factory, tco2] = await prepareToucanEnv(owner, owner);
	const bridge = await deployBridge(tco2Factory, regenBridgeAccount, registry.address);
	console.log("==== config data ====");
	console.log(JSON.stringify({
		"ETH_RPC_URL": "http://127.0.0.1:8545/",
		"CONFIRMED_BLOCK_DEPTH": 0,
		"CHAIN_ID": 31337,
		"OWNER": owner.address,
		"BRIDGE_CONTRACT_ADDRESS": bridge.address,
		"TCO2_FACTORY_ADDRESS": tco2Factory.address,
		"TCO2_CONTRACT_ADDRESS": tco2.address,
		"REGISTRY_ADDRESS": registry.address,
	}, null, 2));
}

deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
