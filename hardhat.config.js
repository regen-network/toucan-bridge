require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("dotenv").config();

const { PRIVATE_KEY, MNEMONIC } = process.env;

const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const GAS_MULTIPLIER = Number(process.env.GAS_MULTIPLIER || 1.1);
const GAS_PRICE = process.env.GAS_PRICE ? Number(process.env.GAS_PRICE) : "auto";
const GAS_LIMIT = process.env.GAS_LIMIT ? Number(process.env.GAS_LIMIT) : "auto";

const sharedNetworkConfig = {
	gas: GAS_LIMIT,
	gasMultiplier: GAS_MULTIPLIER,
	gasPrice: GAS_PRICE,
};

// Order of priority for account/signer generation:
// 1) .env/PRIVATE_KEY
// 2) .env/MNEMONIC
// 3) ./mnemonic.txt
if (PRIVATE_KEY) {
	console.log("using PRIVATE_KEY env var...");
	sharedNetworkConfig.accounts = [PRIVATE_KEY];
} else if (MNEMONIC) {
	console.log("using MNEMONIC env var...");
	sharedNetworkConfig.accounts = {
		mnemonic: MNEMONIC,
	};
} else {
	console.log("reading mnemonic from mnemonic.txt...");
	sharedNetworkConfig.accounts = {
		mnemonic: mnemonic(),
	};
}

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
			// See: https://github.com/regen-network/toucan-bridge/issues/37
			allowUnlimitedContractSize: true,
		},
		matic: {
			...sharedNetworkConfig,
			url: "https://matic-mainnet.chainstacklabs.com",
		},
		mumbai: {
			...sharedNetworkConfig,
			gas: GAS_LIMIT || 5000000,
			gasPrice: GAS_PRICE || 50000000000,
			url: "https://matic-mumbai.chainstacklabs.com",
		},
	},
	etherscan: {
		apiKey: {
			polygon: POLYGONSCAN_API_KEY,
			polygonMumbai: POLYGONSCAN_API_KEY,
		},
	},
};

// mnemonic.txt used for live deployments
function mnemonic() {
	try {
		return fs.readFileSync("./mnemonic.txt").toString().trim();
	} catch (e) {
		return "";
	}
}
