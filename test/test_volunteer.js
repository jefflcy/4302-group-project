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

  it("Should create a new project", async () => {
    const startDateTime = Math.floor(new Date().getTime() / 1000);
    const endDateTime = startDateTime + 3600; // 1 hour later
    await volunteerInstance.createProject(startDateTime, endDateTime, {
      from: accounts[0],
    });
    const projId = await volunteerInstance.getNextProjId();
    assert.equal(projId, 1, "Project ID should be incremented");
  });
  
  it("Should not allow non-owner to create a project", async () => {
    const startDateTime = Math.floor(new Date().getTime() / 1000);
    const endDateTime = startDateTime + 3600; // 1 hour later
    await expectRevertCustomError(
      Volunteer,
      volunteerInstance.createProject(startDateTime, endDateTime, {
        from: accounts[1],
      }),
      "OwnableUnauthorizedAccount"
    );
  });
  
  it("Should allow a volunteer to check in to a project", async () => {
    const projId = 0; // Assuming a project with ID 0 exists
    await volunteerInstance.checkIn(projId, { from: accounts[1] });
    const hours = await volunteerInstance.getProjectHours(projId, accounts[1]);
    assert.equal(hours, 0, "Hours should be 0 before checkout");
  });
  
  it("Should not allow a volunteer to check in to a non-existent project", async () => {
    const projId = 999; // Assuming a project with ID 999 does not exist
    await expectRevertCustomError(
      Volunteer,
      volunteerInstance.checkIn(projId, { from: accounts[1] }),
      "Invalid Project ID."
    );
  });
  
  it("Should allow a volunteer to check out from a project", async () => {
    const projId = 0; // Assuming a project with ID 0 exists
    await volunteerInstance.checkOut(projId, { from: accounts[1] });
    const hours = await volunteerInstance.getProjectHours(projId, accounts[1]);
    assert(hours > 0, "Hours should be greater than 0 after checkout");
  });
  
  it("Should not allow a volunteer to check out from a non-existent project", async () => {
    const projId = 999; // Assuming a project with ID 999 does not exist
    await expectRevertCustomError(
      Volunteer,
      volunteerInstance.checkOut(projId, { from: accounts[1] }),
      "Invalid Project ID."
    );
  });
  
  it("Should allow the owner to end a project", async () => {
    const projId = 0; // Assuming a project with ID 0 exists
    await volunteerInstance.endProject(projId, { from: accounts[0] });
    const hours = await volunteerInstance.getProjectHours(projId, accounts[1]);
    assert(hours > 0, "Hours should be greater than 0 after project end");
  });
  
  it("Should not allow non-owner to end a project", async () => {
    const projId = 0; // Assuming a project with ID 0 exists
    await expectRevertCustomError(
      Volunteer,
      volunteerInstance.endProject(projId, { from: accounts[1] }),
      "OwnableUnauthorizedAccount"
    );
  });
});
