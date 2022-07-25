// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const { deployBridge } = require("../lib/bridge");
const { prepareToucanEnv } = require("../lib/toucan");

describe("Bridge contract", function () {
	let bridge;
	let registry;
	let tco2;
	let tco2Factory;
	let admin;
	let bridgeAdmin;
	let broker;
	const regenUser = "regen1xrjg7dpdlfds8vhyj22hg5zhg9g7dwmlaxqsys";

	before(async function () {
		[admin, bridgeAdmin, broker] = await ethers.getSigners();

		// Deploy Toucan infra
		const env = await prepareToucanEnv(admin, broker);
		registry = env.registry;
		tco2Factory = env.tco2Factory;
		// data contains the tco2 contracts indexed by the UniqueId from the genesis json file
		tco2 = env.data["vintage1"];
	});

	beforeEach(async function () {
		[admin, bridgeAdmin, broker] = await ethers.getSigners();

		// Deploy ToucanRegenBridge
		bridge = await deployBridge(bridgeAdmin.address, registry.address);
		await tco2Factory.addToAllowlist(bridge.address);
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

	describe("Polygon to Regen", function () {
		it("should fail with non positive amount", async function () {
			await expect(bridge.connect(broker).bridge(regenUser, tco2.address, 0)).to.be.revertedWith(
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

			await expect(bridge.connect(broker).bridge(regenUser, tco2.address, 10)).to.be.revertedWith(
				"Pausable: paused"
			);
		});

		it("should fail with non-TCO2 contract", async function () {
			await expect(bridge.connect(broker).bridge(regenUser, tco2Factory.address, 10)).to.be.revertedWith(
				"not a TCO2"
			);
		});

		it("should burn successfully", async function () {
			await bridge.connect(broker).bridge(regenUser, tco2.address, 10);
			expect(await bridge.totalTransferred()).to.equal(10);
			expect(await bridge.tco2Limits(tco2.address)).to.equal(10);
		});
	});

	describe("Regen to Polygon", function () {
		it("should fail with non positive amount", async function () {
			await expect(
				bridge.connect(broker).issueTCO2Tokens(regenUser, broker.address, tco2.address, 0)
			).to.be.revertedWith("amount must be positive");
		});

		it("should fail with non regen sender address", async function () {
			await expect(
				bridge
					.connect(bridgeAdmin)
					.issueTCO2Tokens("cosmos1xrjg7dpdlfds8vhyj22hg5zhg9g7dwmlaxqsys", broker.address, tco2.address, 10)
			).to.be.revertedWith("regen address must start with 'regen1'");

			await expect(
				bridge.connect(bridgeAdmin).issueTCO2Tokens("regen1xrj", broker.address, tco2.address, 10)
			).to.be.revertedWith("regen address is at least 44 characters long");
		});

		it("should fail when contract is paused", async function () {
			await bridge.connect(admin).pause();

			await expect(
				bridge.connect(bridgeAdmin).issueTCO2Tokens(regenUser, broker.address, tco2.address, 10)
			).to.be.revertedWith("Pausable: paused");
		});

		it("should not mint before burning occurs", async function () {
			const tx = bridge.connect(bridgeAdmin).issueTCO2Tokens(regenUser, broker.address, tco2.address, 100);
			await expect(tx).to.be.revertedWith(
				"reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)"
			);
		});

		it("should fail with non-bridge admin account", async function () {
			const tx = bridge.connect(broker).issueTCO2Tokens(regenUser, broker.address, tco2.address, 100);
			await expect(tx).to.be.revertedWith("invalid caller");
		});

		it("should mint successfully", async function () {
			await bridge.connect(broker).bridge(regenUser, tco2.address, 10);
			expect(await tco2.balanceOf(broker.address)).to.equal(BigNumber.from("1999999999999999999980"));
			await bridge.connect(bridgeAdmin).issueTCO2Tokens(regenUser, broker.address, tco2.address, 10);
			expect(await tco2.balanceOf(broker.address)).to.equal(BigNumber.from("1999999999999999999990"));
			expect(await bridge.totalTransferred()).to.equal(10);
			expect(await bridge.tco2Limits(tco2.address)).to.equal(0);
		});
	});
});
