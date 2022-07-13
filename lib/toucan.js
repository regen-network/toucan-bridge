const { ethers, upgrades } = require("hardhat");
const genesis = require("./toucan-genisis-data.json");

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

function yearStartTime(year) {
	return new Date(year, 0, 0).getTime() / 1000;
}

async function prepareToucanEnv(admin, broker) {
	// Deploy Toucan contract registry
	console.log("Deploying ToucanContractRegistry...");
	const registry = await deployProxy("ToucanContractRegistry");

	// Deploy CarbonProjects
	console.log("Deploying CarbonProjects...");
	const cProjects = await deployProxy("CarbonProjects", registry);
	await registry.setCarbonProjectsAddress(cProjects.address);

	// Deploy CarbonProjectVintages
	console.log("Deploying CarbonProjectVintages...");
	const cVintages = await deployProxy("CarbonProjectVintages", registry);
	await registry.setCarbonProjectVintagesAddress(cVintages.address);

	// Deploy CarbonOffsetBatches
	console.log("Deploying CarbonOffsetBatches...");
	const cBatches = await deployProxy("CarbonOffsetBatches", registry, [registry.address]);
	await registry.setCarbonOffsetBatchesAddress(cBatches.address);

	// Deploy TCO2 factory
	console.log("Deploying ToucanCarbonOffsetsFactory...");
	const tco2Factory = await deployProxy("ToucanCarbonOffsetsFactory", registry, [registry.address]);
	await registry.setToucanCarbonOffsetsFactoryAddress(tco2Factory.address);

	// Deploy TCO2 beacon
	console.log("Deploying ToucanCarbonOffsets beacon...");
	const tco2Impl = await ethers.getContractFactory("ToucanCarbonOffsets");
	const beacon = await upgrades.deployBeacon(tco2Impl);
	await tco2Factory.setBeacon(beacon.address);

	// Admin is able to verify
	const role = await cBatches.VERIFIER_ROLE();
	await cBatches.grantRole(role, admin.address);

	let data = {};
	for (const project of genesis) {
		console.log(`Creating a new carbon project ${project.ProjectId}...`);
		const pTx = await cProjects.addNewProject(
			admin.address,
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

		for (const vintage of project.Vintages) {
			console.log(`Creating a new vintage for carbon project ${projectId}...`);
			const vTx = await cVintages.addNewVintage(admin.address, {
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
			console.log(`Created vintage ${vintageId}`);

			// Deploy TCO2
			console.log(`Deploying a TCO2 for vintage ${vintageId}...`);
			await tco2Factory.deployFromVintage(vintageId);
			const tco2Array = await tco2Factory.getContracts();
			const tco2 = await ethers.getContractAt("ToucanCarbonOffsets", tco2Array[tco2Array.length - 1]);
			console.log(`Deployed TCO2 ${tco2.address}`);

			data[vintage.UniqueId] = tco2;

			for (const batch of vintage.Batches) {
				// Mint an empty batch to start the bridging process for the broker
				console.log("Starting the tokenization process for a broker...");
				console.log("1. Minting an empty batch...");
				const batchTx = await cBatches.connect(broker).mintEmptyBatch(broker.address);
				const batchId = await getBatchId(batchTx);
				console.log(`Minted batch ${batchId}`);

				// Confirm credit tokenization
				console.log("2. Updating the batch with data...");
				await cBatches
					.connect(admin)
					.updateBatchWithData(batchId, batch.SerialNumber, batch.Quantity, batch.Uri);
				console.log("3. Linking the batch to the vintage...");
				await cBatches.connect(admin).linkWithVintage(batchId, vintageId);
				console.log("4. Confirming the batch...");
				await cBatches.connect(admin).confirmRetirement(batchId);

				// Broker can now fractionalize to TCO2
				console.log("5. Fractionalizing the batch to TCO2...");
				await cBatches.connect(broker).fractionalize(batchId);
			}
		}
	}

	return [registry, tco2Factory, data];
}

module.exports = { prepareToucanEnv };
