const Volunteer = artifacts.require("Volunteer");
const VolunteerToken = artifacts.require("VolunteerToken");
const _deploy_contracts = require("../migrations/deploy_contracts");
var assert = require("assert");
// may need bignumber for testing
// may need truffleassertions for testing
// may need moment.js for datetime or use Date(): Math.floor(new Date().getTime() / 1000)

/* INSERT UNIT TESTS BELOW */

contract("Volunteer", async (accounts) => {
  it("Should return the correct first projId", async function () {
    let volunteerInstance = await Volunteer.deployed();
    let firstProjId = await volunteerInstance.getNextProjId();
    assert.equal(firstProjId, 0);
  });
});
