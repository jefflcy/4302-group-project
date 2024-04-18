const Volunteer = artifacts.require("../contracts/Volunteer.sol");
const VolunteerToken = artifacts.require("../contracts/VolunteerToken.sol");
const _deploy_contracts = require("../migrations/2_deploy_contracts");
const { expectRevertCustomError } = require("custom-error-test-helper"); // package to test for custom error messages

var assert = require("assert");
// may need bignumber for testing
// may need truffleassertions for testing
// may need moment.js for datetime or use Date(): Math.floor(new Date().getTime() / 1000)

/* INSERT UNIT TESTS BELOW */

contract("Volunteer", (accounts) => {
  before(async () => {
    volunteerInstance = await Volunteer.deployed();
  });
  console.log("Testing Volunteer and VolunteerToken contracts");

  // ------------------- Test cases -------------------

  it("should create a new VolunteerToken on deployment", async function () {
    const tokenAddress = await volunteerInstance.getVolunteerTokenAddress(); // Method to get the deployed token address
    const tokenInstance = await VolunteerToken.at(tokenAddress);
    // console.log("Token Address: ", tokenAddress); // for testing
    assert(tokenInstance !== undefined, "VolunteerToken instance should exist");
  });

  it("Should return the correct first projId", async () => {
    let firstProjId = await volunteerInstance.getNextProjId();
    assert.equal(firstProjId, 0);
  });

  it("Should restrict createProject to only the owner", async () => {
    await expectRevertCustomError(
      Volunteer,
      volunteerInstance.createProject(1713400581, 1713486981, {
        from: accounts[1],
      }),
      "OwnableUnauthorizedAccount"
    );
  });
});
