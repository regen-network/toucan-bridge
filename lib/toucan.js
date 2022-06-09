const { ethers, upgrades } = require("hardhat");

async function deployProxy(contractName, registry, args = []) {
	const factory = await ethers.getContractFactory(contractName);
	const contract = await upgrades.deployProxy(factory, args, {
	  kind: 'uups',
	});
	await contract.deployed();
	if (registry) await contract.setToucanContractRegistry(registry.address);
	return contract;
}

async function prepareToucanEnv() {
    // Deploy Toucan contract registry
	const registry = await deployProxy('ToucanContractRegistry');

    // Deploy TCO2 factory
	const tco2Factory = await deployProxy(
		'ToucanCarbonOffsetsFactory',
		registry,
		[registry.address]
	);
    await registry.setToucanCarbonOffsetsFactoryAddress(
        tco2Factory.address
    );

    // Deploy TCO2 beacon
	const tco2Impl = await ethers.getContractFactory('ToucanCarbonOffsets');
	const beacon = await upgrades.deployBeacon(tco2Impl);
	await tco2Factory.setBeacon(beacon.address);
    
    return registry;
}

module.exports = { deployProxy, prepareToucanEnv };
