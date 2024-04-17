const Volunteer = artifacts.require("../contracts/Volunteer.sol");
const VolunteerToken = artifacts.require("../contracts/VolunteerToken.sol");
const _deploy_contracts = require("../migrations/2_deploy_contracts");
var assert = require("assert");
// may need bignumber for testing
// may need truffleassertions for testing
// may need moment.js for datetime or use Date(): Math.floor(new Date().getTime() / 1000)

/* INSERT UNIT TESTS BELOW */

contract("Volunteer", (accounts) => {
  before(async () => {
    volunteerInstance = await Volunteer.new(
      "https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/"
    );
  });
  console.log("Testing Volunteer Contracts");

  // ------------------- Test cases -------------------

  // functions below not tested/working yet

  //   it("should create a new VolunteerToken on deployment", async function () {
  //     const tokenAddress = await volunteerInstance.getVolunteerTokenAddress(); // Method to get the deployed token address
  //     const tokenInstance = await VolunteerToken.at(tokenAddress);

  //     assert(tokenInstance !== undefined, "VolunteerToken instance should exist");
  //   });

  //   it("Should return the correct first projId", async () => {
  //     let firstProjId = await volunteerInstance.getNextProjId();
  //     assert.equal(firstProjId, 0);
  //   });
});
