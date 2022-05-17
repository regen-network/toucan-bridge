const hre = require("hardhat");

async function deploy() {
	// Hardhat always runs the compile task when running scripts with its command
	// line interface.
	//
	// If this script is run directly using `node` you may want to call compile
	// manually to make sure everything is compiled
	// await hre.run('compile');

	const [owner] = await ethers.getSigners(); //get the account to deploy the contract
	console.log("OWNER address", owner.address);

	const RegenBasket = await hre.ethers.getContractFactory("RegenBasket");
	const t_carbon1 = await RegenBasket.deploy(
		"0x37a9270Ed9215C8453e93EddbcfB2Bf8eE819c07",
		"carbon2",
		"RN_C2",
		9
	);

	let receipt = await t_carbon1.deployed();
	// console.log("receipt", receipt);

	console.log("Carbon1 deployed to:", t_carbon1.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
deploy()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

// yarn hardhat run scripts / regen - basket.js--network rinkeby

// single account:
// owner: 0xA2f702E4756663BD2DA80117A856d7482e51872B
// carbon1: 0x413e867DA34d38874d4db00d9F0B3587Ce35700A

// gnossis owned token: 0xfB60d39F7614BdaFe7EBF5475858bdc591f804Cf
