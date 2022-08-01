const { ethers, upgrades } = require("hardhat");
const genesis = require("./toucan-genesis-data.json");

async function deployProxy(contractName, registry, args = []) {
	const factory = await ethers.getContractFactory(contractName);
	const contract = await upgrades.deployProxy(factory, args, {
		kind: "uups",
	});
	await contract.deployed();
	if (registry) await contract.setToucanContractRegistry(registry.address);
	return contract;
}

async function _getNewTokenId(tx, eventName) {
	const receipt = await tx.wait();
	const mintedEvent = receipt.events.find((e) => e.event === eventName);
	return mintedEvent.args.tokenId.toNumber();
}

async function getBatchId(tx) {
	return _getNewTokenId(tx, "BatchMinted");
}

async function getProjectTokenId(tx) {
	return _getNewTokenId(tx, "ProjectMinted");
}

async function getProjectVintageTokenId(tx) {
	return _getNewTokenId(tx, "ProjectVintageMinted");
}

async function prepareToucanEnv(admin, broker) {
	const contracts = await deployFixedContracts(admin);

	let data = {};
	for (const project of genesis) {
		const projectId = await deployProject(contracts.projects, project, admin.address);

		for (const vintage of project.Vintages) {
			const vintageId = await deployVintage(contracts.vintages, projectId, vintage, admin.address);
			const tco2 = await deployTco2(contracts, vintageId);

			data[vintage.UniqueId] = tco2;

			for (const batch of vintage.Batches) {
				await mintBatch(contracts.batches, batch, vintageId, admin, broker);
			}
		}
	}

	await setEligibleMethodologies(contracts, admin);

	return { ...contracts, data };
}

function setEligibleMethodologies(contracts, admin) {
	let eligibleNCTMethodologies = [];

	for (const project of genesis) {
		if (project.IsNCTEligible ?? true) {
			eligibleNCTMethodologies.push(project.Methodology);
		}
	}
	return contracts.nctPool.connect(admin).addAttributes(true, [], [], eligibleNCTMethodologies);
}

async function deployVintage(cVintages, projectId, vintage, adminAddress) {
	console.log(`Creating a new vintage for carbon project ${projectId}...`);
	let vTx = await cVintages.addNewVintage(adminAddress, {
		projectTokenId: projectId,
		name: vintage.Name,
		startTime: Date.parse(vintage.StartTime) / 1000,
		endTime: Date.parse(vintage.EndTime) / 1000,
		totalVintageQuantity: vintage.TotalVintageQuantity, // tonnes
		isCorsiaCompliant: vintage.IsCorsiaCompliant,
		isCCPcompliant: vintage.IsCCPcompliant,
		coBenefits: vintage.CoBenefits,
		correspAdjustment: vintage.CorrespAdjustment,
		additionalCertification: vintage.AdditionalCertification,
		uri: vintage.Uri,
	});
	const vintageId = await getProjectVintageTokenId(vTx);
	console.log(`Created vintage ${vintage.StartTime} w/ id ${vintageId}`);
	return vintageId;
}

async function deployFixedContracts(admin) {
	// Deploy Toucan contract registry
	console.log("Deploying ToucanContractRegistry...");
	const registry = await deployProxy("ToucanContractRegistry");

	// Deploy CarbonProjects
	console.log("Deploying CarbonProjects...");
	const projects = await deployProxy("CarbonProjects", registry);
	await registry.setCarbonProjectsAddress(projects.address);

	// Deploy CarbonProjectVintages
	console.log("Deploying CarbonProjectVintages...");
	const vintages = await deployProxy("CarbonProjectVintages", registry);
	await registry.setCarbonProjectVintagesAddress(vintages.address);

	// Deploy CarbonOffsetBatches
	console.log("Deploying CarbonOffsetBatches...");
	const batches = await deployProxy("CarbonOffsetBatches", registry, [registry.address]);
	await registry.setCarbonOffsetBatchesAddress(batches.address);

	// Admin is able to verify
	const role = await batches.VERIFIER_ROLE();
	await batches.grantRole(role, admin.address);

	// Deploy TCO2 factory
	console.log("Deploying ToucanCarbonOffsetsFactory...");
	const tco2Factory = await deployProxy("ToucanCarbonOffsetsFactory", registry, [registry.address]);
	await registry.setToucanCarbonOffsetsFactoryAddress(tco2Factory.address);

	// Deploy TCO2 beacon
	console.log("Deploying ToucanCarbonOffsets beacon...");
	const tco2Impl = await ethers.getContractFactory("ToucanCarbonOffsets");
	const beacon = await upgrades.deployBeacon(tco2Impl);
	await tco2Factory.setBeacon(beacon.address);

	// Deploy NCT Pool
	console.log("Deploying NCT pool...");
	const nctPool = await deployProxy("NatureCarbonTonne");
	await nctPool.connect(admin).setToucanContractRegistry(registry.address);
	await nctPool.switchMapping("methodologies", true);
	return { registry, projects, vintages, batches, tco2Factory, nctPool };
}

async function deployProject(cProjects, project, adminAddress) {
	console.log("Creating a new carbon project...");
	const pTx = await cProjects.addNewProject(
		adminAddress,
		project.ProjectId,
		project.Standard,
		project.Methodology,
		project.Region,
		project.StorageMethod,
		project.Method,
		project.EmissionType,
		project.Category,
		project.Uri
	);
	const projectId = await getProjectTokenId(pTx);
	console.log(`Created carbon project ${projectId}`);
	return projectId;
}

async function deployTco2(contracts, vintageId) {
	// Deploy TCO2
	const index = vintageId - 1; // vintageId starts at 1 and the array indices are 0-based
	console.log(`Deploying a TCO2 for vintage ${vintageId}...`);
	await contracts.tco2Factory.deployFromVintage(vintageId);
	const tco2Array = await contracts.tco2Factory.getContracts();
	const tco2 = await ethers.getContractAt("ToucanCarbonOffsets", tco2Array[index]);
	console.log(`Deployed TCO2 ${tco2.address}`);

	return tco2;
}

async function mintBatch(cBatches, batch, vintageId, admin, broker) {
	if (batch.Owner != null) {
		// if Owner is specified in the genesis data, override the default broker.
		broker = await ethers.getSignerOrNull(batch.Owner);
	}

	// Mint an empty batch to start the bridging process for the broker
	console.log("Starting the tokenization process for a broker...");
	console.log("1. Minting an empty batch...");
	const batchTx = await cBatches.connect(broker).mintEmptyBatch(broker.address);
	const batchId = await getBatchId(batchTx);
	console.log(`   - Minted batch ${batchId}`);

	// Confirm credit tokenization
	console.log("2. Updating the batch with data...");
	await cBatches.connect(broker).updateBatchWithData(batchId, batch.SerialNumber, batch.Quantity, batch.Uri);
	console.log("3. Linking the batch to the vintage...");
	await cBatches.connect(admin).linkWithVintage(batchId, vintageId);
	console.log("4. Confirming the batch...");
	await cBatches.connect(admin).confirmRetirement(batchId);

	// Broker can now fractionalize to TCO2
	console.log("5. Fractionalizing the batch to TCO2...");
	await cBatches.connect(broker).fractionalize(batchId);
	if (batch.Transfers != null) {
		console.log("6. Transferring tokens...");
		for (const transfer of batch.Transfers) {
			console.log(`   - ${transfer.Quantity} tokens transferred to ${transfer.Recipient}`);
			await tco2.connect(broker).transfer(transfer.Recipient, wei(transfer.Quantity));
		}
	}
}

function wei(quantity) {
	return ethers.utils.parseEther(quantity.toString(10));
}

module.exports = { prepareToucanEnv };
