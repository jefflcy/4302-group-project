const Volunteer = artifacts.require("../contracts/Volunteer.sol");
const VolunteerToken = artifacts.require("../contracts/VolunteerToken.sol");
const _deploy_contracts = require("../migrations/2_deploy_contracts");
const { expectRevertCustomError } = require("custom-error-test-helper"); // package to test for custom error messages

var assert = require("assert");
const truffleAssert = require('truffle-assertions');
// may need bignumber for testing
// may need truffleassertions for testing
// may need moment.js for datetime or use Date(): Math.floor(new Date().getTime() / 1000)
const {time, expectRevert} = require('@openzeppelin/test-helpers'); // npm install @openzeppelin/test-helpers
const { startTimeAfter, startTimePrior, endTimeAfter } = require('./helper');

/* INSERT UNIT TESTS BELOW */

contract("Volunteer", (accounts) => {
  before(async () => {
    volunteerInstance = await Volunteer.deployed();
  });
  console.log("Testing Volunteer and VolunteerToken contracts");

  // ------------------- Test cases -------------------
  // Start and End Timings of projects need to be updated before testing

  it("Should create a new VolunteerToken on deployment", async () => {
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
    let startTime = startTimePrior(2);
    let endTime = endTimeAfter(4);
    await expectRevertCustomError(
      Volunteer,
      volunteerInstance.createProject(startTime, endTime, { 
        from: accounts[1],
      }),
      "OwnableUnauthorizedAccount"
    );
  });

  it("Should not allow project start timing to be later than end timing", async () => {
    let startTime = startTimeAfter(4);
    let endTime = endTimeAfter(3);
    await expectRevert(volunteerInstance.createProject(startTime, endTime, {
      from: accounts[0],
      }),
      "Invalid Start and End Timings.",  
    );
  });

  it("Should not allow project end timing to be earlier than the current time", async () => {
    let startTime = startTimePrior(6);
    let endTime = startTimePrior(2);
    await expectRevert(volunteerInstance.createProject(startTime, endTime, {
      from: accounts[0],
      }),
      "End Time must be in the future.",  
    );
  });

  // Project 0 is created 
  it("Should create a new VolunteerProject when createProject is called with valid inputs", async () => {
    let startTime = startTimePrior(2);
    let endTime = endTimeAfter(6);
    let proj = await volunteerInstance.createProject(startTime, endTime, {
      from: accounts[0],
    });
    let nextProjId = await volunteerInstance.getNextProjId();

    truffleAssert.eventEmitted(proj, 'ProjectCreated');
    assert.equal(nextProjId, 1);
  });

  it("Should not allow project owner to check in", async () => {
    await expectRevert(volunteerInstance.checkIn(0, {
      from: accounts[0],
      }),
      "Cannot check in to your own project.",  
    );
  });

  // Project 1 is created
  it("Should not allow volunteer to check in before project start time", async () => {
    let startTIme = startTimeAfter(2);
    let endTime = endTimeAfter(10);
    await volunteerInstance.createProject(startTIme, endTime, { 
      from: accounts[0],
    });
    await expectRevert(volunteerInstance.checkIn(1, {
      from: accounts[1],
      }),
      "Project has not started.",  
    );
  });

  // Project 2 is created 
  it("Should not allow volunteer to check in after project has ended", async () => {
    let startTime = startTimePrior(6);
    let endTime = endTimeAfter(2);
    await volunteerInstance.createProject(startTime, endTime, { 
      from: accounts[0],
    });

    await time.increase(time.duration.hours(4));

    await expectRevert(volunteerInstance.checkIn(2, {
      from: accounts[1],
      }),
      "Project has ended.",  
    );
  });

  // Project 3 is created and accounts[1] is checked in
  it("Should allow volunteer to successfully check in", async () => {
    let startTime = startTimePrior(2);
    let endTime = endTimeAfter(6)
    await volunteerInstance.createProject(startTime, endTime, { 
      from: accounts[0],
    });
    let volunteer = await volunteerInstance.checkIn(3, {
      from: accounts[1],
    });
    let checkedIn = volunteerInstance.isVolunteerInProject(3, accounts[1]);

    truffleAssert.eventEmitted(volunteer, 'VolunteerCheckedIn');
    assert.equal(checkedIn, true);

  });
});
