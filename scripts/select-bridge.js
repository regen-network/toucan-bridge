const hre = require("hardhat");
require("hardhat-deploy");

async function deploy() {
	const { deployer } = await hre.getNamedAccounts();
	const contract = await hre.ethers.getContract("ToucanRegenBridge", deployer);
	const { abi } = await hre.artifacts.readArtifact("contracts/ToucanRegenBridge.sol:ToucanRegenBridge");
	const cobInterface = new hre.ethers.utils.Interface(abi);
	const filter = contract.filters['BatchUpdated']();
	const logs = await hre.ethers.provider.getLogs({...filter, fromBlock: 0, toBlock: 1000})

	console.log("length: ", logs.length);

	for (const event of logs) {
		const parsed = cobInterface.parseLog(log);
		console.log(parsed);
	}
}

deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
