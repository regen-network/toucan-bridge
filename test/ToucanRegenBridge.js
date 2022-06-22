// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers } = require("hardhat");

const { deployBridge } = require("../lib/bridge");
const { prepareToucanEnv } = require("../lib/toucan");

describe("Token contract", function () {
	let bridge;
	let registry;
	let tco2;
	let tco2Factory;
	let admin;
	let bridgeAdmin;
	let broker;
	let recipient = "regen1xrjg7dpdlfds8vhyj22hg5zhg9g7dwmlaxqsys";

	before(async function () {
		[admin, bridgeAdmin, broker] = await ethers.getSigners();

		// Deploy Toucan infra
		[registry, tco2Factory, tco2] = await prepareToucanEnv(admin, broker);
	});

	beforeEach(async function () {
		[admin, bridgeAdmin, broker] = await ethers.getSigners();

		// Deploy ToucanRegenBridge
		bridge = await deployBridge(bridgeAdmin.address, registry.address);

		// TODO: await tco2Factory.addToAllowlist(bridge.address);
	});

	it("Should set the right owner and initial parameters", async function () {
		expect(await bridge.owner()).to.equal(admin.address);
		expect(await bridge.totalTransferred()).to.equal(0);
	});

	it("should pause and unpause", async function () {
		await bridge.connect(admin).pause();
		expect(await bridge.paused()).equal(true);

		await bridge.connect(admin).unpause();
		expect(await bridge.paused()).equal(false);

		await expect(bridge.connect(broker).pause()).to.be.revertedWith("Ownable: caller is not the owner");
		expect(await bridge.paused()).equal(false);
	});

	describe("Bridge", function () {
		it("should fail with non positive amount", async function () {
			await expect(bridge.connect(broker).bridge(recipient, tco2.address, 0)).to.be.revertedWith(
				"amount must be positive"
			);
		});

		it("should fail with non regen recipient address", async function () {
			await expect(
				bridge.connect(broker).bridge("cosmos1xrjg7dpdlfds8vhyj22hg5zhg9g7dwmlaxqsys", tco2.address, 10)
			).to.be.revertedWith("regen address must start with 'regen1'");

			await expect(bridge.connect(broker).bridge("regen1xrj", tco2.address, 10)).to.be.revertedWith(
				"regen address is at least 44 characters long"
			);
		});

		it("should fail when contract is paused", async function () {
			await bridge.connect(admin).pause();

			await expect(bridge.connect(broker).bridge(recipient, tco2.address, 10)).to.be.revertedWith(
				"Pausable: paused"
			);
		});

		it("should fail with non-TCO2 contract", async function () {
			await expect(bridge.connect(broker).bridge(recipient, tco2Factory.address, 10)).to.be.revertedWith(
				"not a TCO2"
			);
		});
	});

	describe("Issue TCO2 tokens", function () {
		const regenSender = recipient;

		it("should not mint before burning occurs", async function () {
			let tx = bridge.connect(bridgeAdmin).issueTCO2Tokens(regenSender, broker.address, tco2.address, 100);
			await expect(tx).to.be.revertedWith(
				"reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)"
			);
		});
	});
});
