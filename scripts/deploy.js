const hre = require("hardhat");

const argumentsMatic = require("./arguments-matic");
const argumentsMumbai = require("./arguments-mumbai");
const { deployBridge } = require("../lib/bridge");

async function deploy() {
	const [deployer] = await hre.ethers.getSigners();
	const args = [];
	if (hre.network.name === "matic") {
		args.push(...argumentsMatic);
	} else if (hre.network.name === "mumbai") {
		args.push(...argumentsMumbai);
	} else {
		throw Error(
			`trying to deploy in network ${hre.network.name}. Need to define network arguments in "./arguments-${hre.network.name}" and import the new file in the deploy script`
		);
	}

	console.log(`Deployer: ${deployer.address}`);
	const [nctPool, roles, accounts] = args;
	console.log(`NCT pool: ${nctPool}`);
	console.log(`Roles:    ${roles}`);
	console.log(`Accounts: ${accounts}`);

	const bridge = await deployBridge(deployer, ...args);

	console.log(`Deployed bridge with address ${bridge.address}`);
	console.log("Remember to add bridge address to the allow list");
}

deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
