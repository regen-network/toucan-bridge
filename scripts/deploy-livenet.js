const assert = require("assert");

const { deployBridge } = require("../lib/bridge");

const { NCT_ADDRESS, BRIDGE_CONTROLLER_ADDRESS } = process.env;
const zeroAddress = "0x0000000000000000000000000000000000000000";

async function deploy() {
	assert(NCT_ADDRESS, "NCT address needs to be set");
	const tokenIssuer = BRIDGE_CONTROLLER_ADDRESS || zeroAddress;
	console.log(
		`Deploying bridge with following addresses:\nNCT: ${NCT_ADDRESS}\nToken Issuer: ${tokenIssuer}`
	);
	const bridge = await deployBridge(tokenIssuer, NCT_ADDRESS);
	console.log(
		`Deployed under ${bridge.address}\nRemember to add to allow list on ToucanCarbonOffsetsFactory`
	);
}

deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
