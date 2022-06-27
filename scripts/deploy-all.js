const hre = require("hardhat");

const { deployBridge } = require("../lib/bridge");
const { prepareToucanEnv } = require("../lib/toucan");

async function deploy() {
	const [owner] = await hre.ethers.getSigners();
	const regenBridgeAccount = "0x11241e35B3f79099123aA0C1C4c97b1FcdCd21f6";
	const [registry, tco2Factory, tco2] = await prepareToucanEnv(owner, owner);
	const bridge = await deployBridge(regenBridgeAccount, registry.address);
	console.log("ToucanRegenBridge deployed to", bridge.address);
}

deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
