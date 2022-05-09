const hre = require("hardhat");

async function deploy() {
	const [owner] = await ethers.getSigners(); //get the account to deploy the contract
	console.log("OWNER address", owner.address);

	const Bridge = await hre.ethers.getContractFactory("ToucanBridgeMock");
	const bridge = await Bridge.deploy(owner.address);

	let receipt = await bridge.deployed();

	console.log("Bridge deployed to %s", bridge.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

// yarn hardhat run scripts/toucan-bridge-mock.js  --network rinkeby
