const Volunteer = artifacts.require("../contracts/Volunteer.sol");
const VolunteerToken = artifacts.require("../contracts/VolunteerToken.sol");
const _deploy_contracts = require("../migrations/2_deploy_contracts");
const { expectRevertCustomError } = require("custom-error-test-helper"); // package to test for custom error messages

var assert = require("assert");
const truffleAssert = require('truffle-assertions');
// may need bignumber for testing
// may need truffleassertions for testing
// may need moment.js for datetime or use Date(): Math.floor(new Date().getTime() / 1000)
const { time, expectRevert } = require('@openzeppelin/test-helpers'); // npm install @openzeppelin/test-helpers
const { startTimeAfter, startTimePrior, endTimeAfter } = require('./helper');

/* INSERT UNIT TESTS BELOW */

contract("Volunteer", (accounts) => {
  let volunteerInstance;
  const tokenUri = "https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/";
  before(async () => {
<<<<<<< HEAD
    volunteerInstance = await Volunteer.new(tokenUri, { from: accounts[0] });
  });
  console.log("Testing Volunteer and VolunteerToken contracts");

  // ------------------- Test cases -------------------
  // Start and End Timings of projects need to be updated before testing
  
=======
    volunteerInstance = await Volunteer.deployed();

  });
  console.log("Testing Volunteer and VolunteerToken contracts");

  //------------------ Test cases -------------------
  ///Start and End Timings of projects need to be updated before testing

>>>>>>> 470e215e6b983b480a3c44b5516126513156b992
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

  it("Should create a new VolunteerProject when createProject is called with valid inputs", async () => {
    let startTime = startTimePrior(2);
    let endTime = endTimeAfter(6);
    let currProjId = await volunteerInstance.getNextProjId();
    let proj = await volunteerInstance.createProject(startTime, endTime, {
      from: accounts[0],
    });
    let nextProjId = await volunteerInstance.getNextProjId();

    assert.equal(currProjId, 0);
    truffleAssert.eventEmitted(proj, 'ProjectCreated');
    assert.equal(nextProjId, 1);
  });

  it("Should not allow project owner to check in", async () => {
    let startTime = startTimePrior(2);
    let endTime = endTimeAfter(6);
    let currProjId = await volunteerInstance.getNextProjId();
    await volunteerInstance.createProject(startTime, endTime, {
      from: accounts[0],
    });
    await expectRevert(volunteerInstance.checkIn(currProjId, {
      from: accounts[0],
    }),
      "Cannot check in to your own project.",
    );
  });

  
  it("Should not allow volunteer to check in before project start time", async () => {
    let startTime = startTimeAfter(4);
    let endTime = endTimeAfter(10);
<<<<<<< HEAD
    let currProjId = await volunteerInstance.getNextProjId();
    await volunteerInstance.createProject(startTime, endTime, { 
=======
    await volunteerInstance.createProject(startTime, endTime, {
>>>>>>> 470e215e6b983b480a3c44b5516126513156b992
      from: accounts[0],
    });
    await expectRevert(volunteerInstance.checkIn(currProjId, {
      from: accounts[1],
    }),
      "Project has not started.",
    );
  });

  /*
  it("Should not allow volunteer to check in after project has ended", async () => {
    let startTime = startTimePrior(6);
<<<<<<< HEAD
    let endTime = endTimeAfter(4);
    let currProjId = await volunteerInstance.getNextProjId();
    await volunteerInstance.createProject(startTime, endTime, { 
=======
    let endTime = endTimeAfter(2);
    await volunteerInstance.createProject(startTime, endTime, {
>>>>>>> 470e215e6b983b480a3c44b5516126513156b992
      from: accounts[0],
    });

    // await time.increase(time.duration.hours(6));
    async function advanceTime(time) {
      await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [time],
        id: new Date().getTime()
      }, () => { });
      await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: new Date().getTime()
      }, () => { });
    }

    await advanceTime(21600);
    
    await expectRevert(volunteerInstance.checkIn(currProjId, {
      from: accounts[1],
    }),
      "Project has ended.",
    );
  });
  */
  
  it("Should not allow a volunteer to check in to a non-existent project", async () => {
    const projId = 999; // Assuming a project with ID 999 does not exist
    await expectRevert(
      volunteerInstance.checkIn(projId, { from: accounts[1] }),
      "Invalid Project ID."
    );
  });

  it("Should allow volunteer to successfully check in", async () => {
    let startTime = startTimePrior(2);
    let endTime = endTimeAfter(6)
<<<<<<< HEAD
    let currProjId = await volunteerInstance.getNextProjId();
    await volunteerInstance.createProject(startTime, endTime, { 
=======
    await volunteerInstance.createProject(startTime, endTime, {
>>>>>>> 470e215e6b983b480a3c44b5516126513156b992
      from: accounts[0],
    });
    let volunteer = await volunteerInstance.checkIn(currProjId, {
      from: accounts[1],
    });
    let checkedIn = await volunteerInstance.isVolunteerInProject(currProjId, accounts[1]);
    let hours = await volunteerInstance.getProjectHours(currProjId, accounts[1]);

    truffleAssert.eventEmitted(volunteer, 'VolunteerCheckedIn');
    assert.equal(checkedIn, true);
    assert.equal(hours, 0, "Hours should be 0 before checkout");
  });

  
  //CHECKOUT
  it("should revert if trying to check out after the project has ended", async () => {
    const currentTime = (await web3.eth.getBlock('latest')).timestamp;
    const startTime = currentTime - 7200; // project started 2 hours ago
    const endTime = currentTime + 7200; // project ended 1 hour ago

    await volunteerInstance.createProject(startTime, endTime, { from: accounts[0] });
    const projId = await volunteerInstance.getNextProjId() - 1;

    async function advanceTime(time) {
      await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [time],
        id: new Date().getTime()
      }, () => { });
      await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: new Date().getTime()
      }, () => { });
    }


    //Volunteer first check in
    await volunteerInstance.checkIn(projId, { from: accounts[1] });

    // Advancing time to after the project ends
    await advanceTime(8000);  // Advance time by 8000 seconds, so project is over

    await truffleAssert.reverts(
      volunteerInstance.checkOut(projId, { from: accounts[1] }),
      "Project has already ended."
    );
  });
  
  it("should revert if trying to check out without having checked in", async () => {
    const currentTime = (await web3.eth.getBlock('latest')).timestamp;
    const startTime = currentTime - 3600; // project started 1 hour ago
    const endTime = currentTime + 3600; // project ends in 1 hour

    await volunteerInstance.createProject(startTime, endTime, { from: accounts[0] });
    const projId = await volunteerInstance.getNextProjId() - 1;

    await truffleAssert.reverts(
      volunteerInstance.checkOut(projId, { from: accounts[2] }),
      "Volunteer did not check in to this project."
    );
  });
  /*
  it("should revert if the volunteer tries to check out again after already completing the project", async () => {
    const currentTime = (await web3.eth.getBlock('latest')).timestamp;
    const startTime = currentTime - 3600; // project started 1 hour ago
    const endTime = currentTime + 7200; // project ends in 2 hours

    await volunteerInstance.createProject(startTime, endTime, { from: accounts[0] });
    const projId = await volunteerInstance.getNextProjId() - 1;

    await volunteerInstance.checkIn(projId, { from: accounts[3] });

    async function advanceTime(time) {
      await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [time],
        id: new Date().getTime()
      }, () => { });
      await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: new Date().getTime()
      }, () => { });
    }
    await advanceTime(3600);

    await volunteerInstance.checkOut(projId, { from: accounts[3] });

    // Check the state to confirm participation is recorded
    const hoursClocked = await volunteerInstance.getProjectHours(projId, accounts[3]);
    assert(hoursClocked > 0, "Volunteer hours should be recorded");

    // Try to check out again
    await truffleAssert.reverts(
      volunteerInstance.checkOut(projId, { from: accounts[3] }),
      "You have already participated in the Project."
    );
  });*/
  
  it("Should not allow non-owner to end a project", async () => {
    const projId = 0; // Assuming a project with ID 0 exists
    await expectRevertCustomError(
      Volunteer,
      volunteerInstance.endProject(projId, { from: accounts[1] }),
      "OwnableUnauthorizedAccount"
    );
  });
<<<<<<< HEAD
  
  it("Should allow the owner to end a project", async () => {

    let startTime = startTimePrior(2);
    let endTime = endTimeAfter(6)
    let currProjId = await volunteerInstance.getNextProjId();
    await volunteerInstance.createProject(startTime, endTime, { 
      from: accounts[0],
    });
    await volunteerInstance.checkIn(currProjId, {
      from: accounts[1],
    });

    let project = await volunteerInstance.endProject(currProjId, { from: accounts[0] });

    // const hours = await volunteerInstance.getProjectHours(currProjId, accounts[1]);
    // console.log(hours);
    truffleAssert.eventEmitted(project, 'ProjectEnded');
    truffleAssert.eventEmitted(project, 'VolunteerCheckedOut');
    // assert.notEqual(hours, 0, "Hours should be greater than 0 after project end");
  });

  /*
  it("Should mint a token after checkout", async () => {
    let startTime = startTimePrior(2);
    let endTime = endTimeAfter(6)
    let currProjId = await volunteerInstance.getNextProjId();
    await volunteerInstance.createProject(startTime, endTime, { 
      from: accounts[0],
    });
    await volunteerInstance.checkIn(currProjId, {
      from: accounts[1],
    });
    await volunteerInstance.checkOut(currProjId, {
      from: accounts[1],
    });    

    await volunteerTokenInstance.mintAfterCheckout(currProjId, accounts[1], {
      from: accounts[0],
    });
    const balance = await volunteerTokenInstance.balanceOf(accounts[1], projId);
    assert.equal(balance, 1, "Balance should be 1 after minting");
  });*/
  
=======


  //Javian Test Case
  it("Should not allow non-owner to mint a token", async () => {
    const tokenAddress = await volunteerInstance.getVolunteerTokenAddress(); // Method to get the deployed token address
    const tokenInstance = await VolunteerToken.at(tokenAddress);
    const projId = 0; // Assuming a project with ID 0 exists
    await expectRevertCustomError(
      VolunteerToken,
      tokenInstance.mintAfterCheckout(projId, accounts[1], {
        from: accounts[2],
      }),
      "OwnableUnauthorizedAccount"
    );
  });
  it("Should return correct contract URI", async () => {
    const tokenAddress = await volunteerInstance.getVolunteerTokenAddress(); // Method to get the deployed token address
    const tokenInstance = await VolunteerToken.at(tokenAddress);
    const contractUri = await tokenInstance.contractURI();
    assert.equal(
      contractUri,
      "https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/collection.json",
      "Contract URI should be correct"
    );
  });

  it("Should return correct URI for a project", async () => {
    const tokenAddress = await volunteerInstance.getVolunteerTokenAddress(); // Method to get the deployed token address
    const tokenInstance = await VolunteerToken.at(tokenAddress);
    const projId = 0; // Assuming a project with ID 0 exists
    const uri = await tokenInstance.uri(projId);
    assert.equal(
      uri,
      "https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/0.json",
      "URI should be correct"
    );
  });



>>>>>>> 470e215e6b983b480a3c44b5516126513156b992

})
