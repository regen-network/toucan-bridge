// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers } = require("hardhat");

// import { solidity } from "ethereum-waffle";
// chai.use(solidity);

describe("Token contract", function () {
	let bridge;
	let owner;
	let addr1;
	let addr2;
	let tco2Odd = "0x1a6583dE167Cee533B5dbAe194D2e5858aaE7C01";
	let tco2Even = "0x6351faCE3fa7268dF2fB252A371219fDAE571190";
	let recipient = "regen1xrjg7dpdlfds8vhyj22hg5zhg9g7dwmlaxqsys";

	beforeEach(async function () {
		// Get the ContractFactory and Signers here.
		let Bridge = await ethers.getContractFactory("ToucanBridgeMock");
		[owner, addr1, addr2, tco2] = await ethers.getSigners();

		bridge = await Bridge.deploy(owner.address);
		await bridge.deployed();
	});

	it("Should set the right owner and initial parameters", async function () {
		expect(await bridge.owner()).to.equal(owner.address);
		expect(await bridge.totalTransferred()).to.equal(0);
	});

	describe("Bridge", function () {
		it("should emit transfer with odd tco2", async function () {
			await expect(bridge.connect(addr1).bridge(recipient, tco2Odd, 10, "note"))
				.to.emit(bridge, "Bridge")
				.withArgs(addr1.address, recipient, tco2Odd, 10);
			expect(await bridge.totalTransferred()).to.equal(10);

			await expect(bridge.connect(addr2).bridge(recipient, tco2Odd, 20, "note2"))
				.to.emit(bridge, "Bridge")
				.withArgs(addr2.address, recipient, tco2Odd, 20);
			expect(await bridge.totalTransferred()).to.equal(30);
		});

		it("should fail with even tco2", async function () {
			await expect(bridge.connect(addr1).bridge(recipient, tco2Even, 10, "note")).to.be.revertedWith(
				"contract not part of the Toucan NCT registry"
			);
		});

		it("should fail with non positive amount", async function () {
			await expect(bridge.connect(addr1).bridge(recipient, tco2Even, 0, "note")).to.be.revertedWith(
				"amount must be positive"
			);
		});

		it("should fail with non regen recipient address", async function () {
			await expect(
				bridge.connect(addr1).bridge("cosmos1xrjg7dpdlfds8vhyj22hg5zhg9g7dwmlaxqsys", tco2Even, 10, "note")
			).to.be.revertedWith("regen address must start with 'regen1'");

			await expect(bridge.connect(addr1).bridge("regen1xrj", tco2Even, 10, "note")).to.be.revertedWith(
				"regen address is at least 44 characters long"
			);
		});

		it("should fail when contract is paused", async function () {
			await bridge.connect(owner).pause();

			await expect(bridge.connect(addr1).bridge(recipient, tco2Odd, 10, "note")).to.be.revertedWith(
				"Pausable: paused"
			);
		});

		it("should work when unpaused", async function () {
			await bridge.connect(owner).pause();
			expect(await bridge.paused()).equal(true);

			await bridge.connect(owner).unpause();
			expect(await bridge.paused()).equal(false);

			await expect(bridge.connect(addr1).bridge(recipient, tco2Odd, 10, "note")).to.emit(bridge, "Bridge");
		});
	});
});
