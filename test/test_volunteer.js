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

  it("Should mint a token after checkout", async () => {
    const projId = 0; // Assuming a project with ID 0 exists
    await volunteerTokenInstance.mintAfterCheckout(projId, accounts[1], {
      from: accounts[0],
    });
    const balance = await volunteerTokenInstance.balanceOf(accounts[1], projId);
    assert.equal(balance, 1, "Balance should be 1 after minting");
  });
  
  it("Should not allow non-owner to mint a token", async () => {
    const projId = 0; // Assuming a project with ID 0 exists
    await expectRevertCustomError(
      VolunteerToken,
      volunteerTokenInstance.mintAfterCheckout(projId, accounts[1], {
        from: accounts[2],
      }),
      "OwnableUnauthorizedAccount"
    );
  });
  
  it("Should return correct URI for a project", async () => {
    const projId = 0; // Assuming a project with ID 0 exists
    const uri = await volunteerTokenInstance.uri(projId);
    assert.equal(
      uri,
      "https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/0.json",
      "URI should be correct"
    );
  });
  
  it("Should return correct contract URI", async () => {
    const contractUri = await volunteerTokenInstance.contractURI();
    assert.equal(
      contractUri,
      "https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/collection.json",
      "Contract URI should be correct"
    );
  });
  
  it("Should not allow token transfer", async () => {
    const projId = 0; // Assuming a project with ID 0 exists
    await expectRevertCustomError(
      VolunteerToken,
      volunteerTokenInstance.safeTransferFrom(
        accounts[1],
        accounts[2],
        projId,
        1,
        "0x0",
        { from: accounts[1] }
      ),
      "Only mint/burn allowed."
    );
  });
  
  it("Should not allow batch token transfer", async () => {
    const projIds = [0, 1]; // Assuming projects with IDs 0 and 1 exist
    const amounts = [1, 1];
    await expectRevertCustomError(
      VolunteerToken,
      volunteerTokenInstance.safeBatchTransferFrom(
        accounts[1],
        accounts[2],
        projIds,
        amounts,
        "0x0",
        { from: accounts[1] }
      ),
      "Only batch mint/burn allowed."
    );
  });
});
