// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers } = require("hardhat");

const { deployBridge } = require("../lib/bridge");
const { prepareToucanEnv } = require("../lib/toucan");
const { utils } = require("ethers");

const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
const PAUSER_ROLE = utils.id("PAUSER_ROLE");

function toWei(quantity) {
	return ethers.utils.parseEther(quantity.toString(10));
}

describe("Bridge contract", function () {
	let bridge;
	let tco2;
	let nonEligibleTco2;
	let tco2Factory;
	let nctPool;
	let admin;
	let tokenIssuer;
	let broker;
	const regenUser = "regen1xrjg7dpdlfds8vhyj22hg5zhg9g7dwmlaxqsys";

	before(async function () {
		[admin, tokenIssuer, broker] = await ethers.getSigners();

		// Deploy Toucan infra
		const env = await prepareToucanEnv(admin, broker);
		tco2Factory = env.tco2Factory;
		nctPool = env.nctPool;
		// data contains the tco2 contracts indexed by the UniqueId from the genesis json file
		tco2 = env.data["vintage1"];
		nonEligibleTco2 = env.data["vintage2"];
	});

	beforeEach(async function () {
		[admin, tokenIssuer, broker] = await ethers.getSigners();

		// Deploy ToucanRegenBridge
		bridge = await deployBridge(tokenIssuer.address, nctPool.address);
		await tco2Factory.addToAllowedBridges(bridge.address);
	});

	it("Should set the right default admin and initial parameters", async function () {
		const isAdmin = await bridge.hasRole(DEFAULT_ADMIN_ROLE, admin.address);
		expect(isAdmin).to.be.true;
		expect(await bridge.totalTransferred()).to.equal(0);
	});

	it("should pause and unpause", async function () {
		await bridge.connect(admin).pause();
		expect(await bridge.paused()).equal(true);

		await bridge.connect(admin).unpause();
		expect(await bridge.paused()).equal(false);

		await expect(bridge.connect(broker).pause()).to.be.revertedWith("caller does not have pauser role");
		expect(await bridge.paused()).equal(false);
	});

	it("should pause only with pauser role", async function () {
		await bridge.connect(admin).grantRole(PAUSER_ROLE, broker.address);

		await bridge.connect(broker).pause();
		expect(await bridge.paused()).equal(true);

		await bridge.connect(broker).unpause();
		expect(await bridge.paused()).equal(false);

		await bridge.connect(admin).revokeRole(PAUSER_ROLE, broker.address);
		await expect(bridge.connect(broker).pause()).to.be.revertedWith("caller does not have pauser role");
	});

	describe("Polygon to Regen", function () {
		it("should fail with non positive amount", async function () {
			await expect(bridge.connect(broker).bridge(regenUser, tco2.address, 0)).to.be.revertedWith(
				"amount must be positive"
			);
		});

		it("should fail with non regen recipient address", async function () {
			await expect(
				bridge.connect(broker).bridge("cosmo1xrjg7dpdlfds8vhyj22hg5zhg9g7dwmlaxqsys", tco2.address, 10)
			).to.be.revertedWith("regen address must start with 'regen1'");

			await expect(
				bridge.connect(broker).bridge("cosmos1xrjg7dpdlfds8vhyj22hg5zhg9g7dwmlaxqsys", tco2.address, 10)
			).to.be.revertedWith("regen address must be 44 or 64 chars");

			await expect(
				bridge.connect(broker).bridge("regen1xrjg7dpdlfds8vhyj22hg5zhg9g7dwmlaxqsy.", tco2.address, 10)
			).to.be.revertedWith("regen address must contain only alphanumeric characters");
		});

		it("should fail when contract is paused", async function () {
			await bridge.connect(admin).pause();

			await expect(bridge.connect(broker).bridge(regenUser, tco2.address, 10)).to.be.revertedWith(
				"Pausable: paused"
			);
		});

		it("should fail with non-TCO2 contract", async function () {
			const CP_NOT_WHITELISTED = "5";
			await expect(bridge.connect(broker).bridge(regenUser, tco2Factory.address, 10)).to.be.revertedWith(
				CP_NOT_WHITELISTED
			);
		});

		it("should fail with NCT non-eligible TCO2 contract", async function () {
			const CP_METHODOLOGY_NOT_ACCEPTED = "9";
			await expect(bridge.connect(broker).bridge(regenUser, nonEligibleTco2.address, 10)).to.be.revertedWith(
				CP_METHODOLOGY_NOT_ACCEPTED
			);
		});

		it("should burn successfully", async function () {
			const amount = toWei("1.0");
			await bridge.connect(broker).bridge(regenUser, tco2.address, amount);
			expect(await bridge.totalTransferred()).to.equal(amount);
			expect(await bridge.tco2Limits(tco2.address)).to.equal(amount);
		});

		it("should bridge with exactly 6 decimals of precision", async function () {
			const amount = toWei("1.000001");
			await bridge.connect(broker).bridge(regenUser, tco2.address, amount);
			expect(await bridge.totalTransferred()).to.equal(amount);
			expect(await bridge.tco2Limits(tco2.address)).to.equal(amount);
		});

		it("should not bridge with more than 6 decimals of precision", async function () {
			const amount = toWei("1.0000001");
			await expect(bridge.connect(broker).bridge(regenUser, tco2.address, amount)).to.be.revertedWith(
				"Only precision up to 6 decimals allowed"
			);
		});
	});

	describe("Regen to Polygon", function () {
		it("should fail with non positive amount", async function () {
			await expect(
				bridge.connect(broker).issueTCO2Tokens(regenUser, broker.address, tco2.address, 0, "test")
			).to.be.revertedWith("amount must be positive");
		});

		it("should fail with address length 43", async function () {
			await expect(
				bridge
					.connect(tokenIssuer)
					.issueTCO2Tokens(
						"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
						broker.address,
						tco2.address,
						10,
						"test"
					)
			).to.be.revertedWith("regen address must be 44 or 64 chars");
		});

		it("should fail with address length 45", async function () {
			await expect(
				bridge
					.connect(tokenIssuer)
					.issueTCO2Tokens(
						"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
						broker.address,
						tco2.address,
						10,
						"test"
					)
			).to.be.revertedWith("regen address must be 44 or 64 chars");
		});

		it("should fail with address length 63", async function () {
			await expect(
				bridge
					.connect(tokenIssuer)
					.issueTCO2Tokens(
						"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
						broker.address,
						tco2.address,
						10,
						"test"
					)
			).to.be.revertedWith("regen address must be 44 or 64 chars");
		});

		it("should fail with address length 65", async function () {
			await expect(
				bridge
					.connect(tokenIssuer)
					.issueTCO2Tokens(
						"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
						broker.address,
						tco2.address,
						10,
						"test"
					)
			).to.be.revertedWith("regen address must be 44 or 64 chars");
		});

		it("should fail with non regen sender address", async function () {
			await expect(
				bridge
					.connect(tokenIssuer)
					.issueTCO2Tokens(
						"cosmo1xrjg7dpdlfds8vhyj22hg5zhg9g7dwmlaxqsys",
						broker.address,
						tco2.address,
						10,
						"test"
					)
			).to.be.revertedWith("regen address must start with 'regen1'");
		});

		it("should fail with non alphanumeric characters", async function () {
			await expect(
				bridge
					.connect(tokenIssuer)
					.issueTCO2Tokens(
						"regen1xrjg7dpdlfds8vhyj22hg5zhg9g7dwmlaxqsy.",
						broker.address,
						tco2.address,
						10,
						"test"
					)
			).to.be.revertedWith("regen address must contain only alphanumeric characters");
		});

		it("should fail when contract is paused", async function () {
			await bridge.connect(admin).pause();

			await expect(
				bridge.connect(tokenIssuer).issueTCO2Tokens(regenUser, broker.address, tco2.address, 10, "test")
			).to.be.revertedWith("Pausable: paused");
		});

		it("should not mint before burning occurs", async function () {
			const tx = bridge
				.connect(tokenIssuer)
				.issueTCO2Tokens(regenUser, broker.address, tco2.address, 100, "test");
			await expect(tx).to.be.revertedWith(
				"reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)"
			);
		});

		it("should fail with non-bridge admin account", async function () {
			const tx = bridge.connect(broker).issueTCO2Tokens(regenUser, broker.address, tco2.address, 100, "test");
			await expect(tx).to.be.revertedWith("invalid caller");
		});

		it("should fail with underflow when issue is larger than bridge", async function () {
			const amountBefore = await tco2.balanceOf(broker.address);
			const amountToTransfer = toWei("1.0");
			const amountToIssue = toWei("1.5");

			await bridge.connect(broker).bridge(regenUser, tco2.address, amountToTransfer);
			const tx = bridge
				.connect(tokenIssuer)
				.issueTCO2Tokens(regenUser, broker.address, tco2.address, amountToIssue, "test");
			await expect(tx).to.be.revertedWith(
				"reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)"
			);
		});

		it("should mint successfully", async function () {
			const amountBefore = await tco2.balanceOf(broker.address);
			const amountToTransfer = toWei("1.0");

			await bridge.connect(broker).bridge(regenUser, tco2.address, amountToTransfer);
			await bridge
				.connect(tokenIssuer)
				.issueTCO2Tokens(regenUser, broker.address, tco2.address, amountToTransfer, "test");

			const newBalance = await tco2.balanceOf(broker.address);
			const newTransferred = await bridge.totalTransferred();
			expect(newBalance).to.equal(amountBefore);
			expect(newTransferred).to.equal(0);
			expect(await bridge.tco2Limits(tco2.address)).to.equal(0);
		});

		it("should mint successfully and keep right totalTransfered balance", async function () {
			let newTransferred = 0;
			const amountBefore = await tco2.balanceOf(broker.address);
			const amountToTransfer = toWei("1.0");

			const amountToIssue1st = toWei("0.5");
			const amountToIssue2nd = toWei("0.4");

			await bridge.connect(broker).bridge(regenUser, tco2.address, amountToTransfer);
			await bridge
				.connect(tokenIssuer)
				.issueTCO2Tokens(regenUser, broker.address, tco2.address, amountToIssue1st, "test1st");

			newTransferred = await bridge.totalTransferred();
			expect(newTransferred).to.equal(toWei("0.5"));

			await bridge
				.connect(tokenIssuer)
				.issueTCO2Tokens(regenUser, broker.address, tco2.address, amountToIssue2nd, "test2nd");

			newTransferred = await bridge.totalTransferred();
			expect(newTransferred).to.equal(toWei("0.1"));

			await bridge
				.connect(tokenIssuer)
				.issueTCO2Tokens(regenUser, broker.address, tco2.address, newTransferred, "test");

			newTransferred = await bridge.totalTransferred();
			expect(newTransferred).to.equal(0);
		});

		it("should enable issuer rotation", async function () {
			const amount = toWei("1.0");
			const halfAmount = toWei("0.5");
			await bridge.connect(broker).bridge(regenUser, tco2.address, amount);

			// Check that admin cannot mint but tokenIssuer can
			let tx = bridge
				.connect(admin)
				.issueTCO2Tokens(regenUser, broker.address, tco2.address, halfAmount, "test");
			await expect(tx).to.be.revertedWith("invalid caller");
			await bridge
				.connect(tokenIssuer)
				.issueTCO2Tokens(regenUser, broker.address, tco2.address, halfAmount, "test");

			// Rotate tokenIssuer to admin
			await bridge.connect(admin).setTokenIssuer(admin.address);

			// Check that tokenIssuer cannot mint but admin can
			tx = bridge
				.connect(tokenIssuer)
				.issueTCO2Tokens(regenUser, broker.address, tco2.address, halfAmount, "test1");
			await expect(tx).to.be.revertedWith("invalid caller");
			await bridge
				.connect(admin)
				.issueTCO2Tokens(regenUser, broker.address, tco2.address, halfAmount, "test1");
		});

		it("should fail if issuer already set", async function () {
			const tx = bridge.connect(admin).setTokenIssuer(tokenIssuer.address);
			await expect(tx).to.be.revertedWith("already set");
		});

		it("should fail on duplicate request", async function () {
			const amountToTransfer = toWei("1.0");

			await bridge.connect(broker).bridge(regenUser, tco2.address, amountToTransfer);
			await bridge
				.connect(tokenIssuer)
				.issueTCO2Tokens(regenUser, broker.address, tco2.address, amountToTransfer, "test");
			await expect(
				bridge
					.connect(tokenIssuer)
					.issueTCO2Tokens(regenUser, broker.address, tco2.address, amountToTransfer, "test")
			).to.be.revertedWith("duplicate origin");
		});
	});
});
