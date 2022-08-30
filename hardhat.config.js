require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
	const accounts = await hre.ethers.getSigners();

	for (const account of accounts) {
		console.log(account.address);
	}
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

module.exports = {
	solidity: {
		version: "0.8.4",
		settings: {
			optimizer: {
				runs: 200,
				enabled: true,
			},
		},
	},
	networks: {
		// Hardhat comes built-in with a special network called hardhat. When using this network, an instance of the Hardhat Network will be automatically created when you run a task, script or test your smart contracts.
		// default networks: hardhat, localhost ("http://127.0.0.1:8545")
		// rinkeby: {
		//   // url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
		//   // url: "https://rinkeby.infura.io/v3/",
		//   // accounts: [``]
		// }
		hardhat: {
			allowUnlimitedContractSize: true,
		},
	},
};
