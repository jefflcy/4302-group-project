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
const { start } = require("repl");
const exampleURI = "QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B";

/* INSERT UNIT TESTS BELOW */

contract("Volunteer", (accounts) => {
  let volunteerInstance;
  const tokenUri = "https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/";
  before(async () => {
    volunteerInstance = await Volunteer.new(tokenUri, { from: accounts[0] });
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

  // ------------------- Create Project -------------------------------- //
  it("Should restrict createProject to only the owner", async () => {
    let startTime = startTimePrior(2);
    let endTime = endTimeAfter(4);
    await expectRevertCustomError(
      Volunteer,
      volunteerInstance.createProject(startTime, endTime, exampleURI, {
        from: accounts[1],
      }),
      "OwnableUnauthorizedAccount"
    );
  });

  it("Should not allow project start timing to be later than end timing", async () => {
    let startTime = startTimeAfter(4);
    let endTime = endTimeAfter(3);
    await expectRevert(volunteerInstance.createProject(startTime, endTime, exampleURI, {
      from: accounts[0],
    }),
      "Invalid Start and End Timings.",
    );
  });

  it("Should not allow project end timing to be earlier than the current time", async () => {
    let startTime = startTimePrior(6);
    let endTime = startTimePrior(2);
    await expectRevert(volunteerInstance.createProject(startTime, endTime, exampleURI, {
      from: accounts[0],
    }),
      "End Time must be in the future.",
    );
  });

  it("Should not allow project to have an invalid or empty URI", async () => {
    let startTime = startTimePrior(2);
    let endTime = endTimeAfter(6);
    let wrongURI = "nopeiamwronghehe";
    await expectRevert(volunteerInstance.createProject(startTime, endTime, wrongURI, {
      from: accounts[0],
    }),
      "Invalid uriHash.",
    );
    await expectRevert(volunteerInstance.createProject(startTime, endTime, {
      from: accounts[0],
    }),
      "Invalid uriHash.",
    );
  });

  it("Should create a new VolunteerProject when createProject is called with valid inputs", async () => {
    let startTime = startTimePrior(2);
    let endTime = endTimeAfter(6);
    let currProjId = await volunteerInstance.getNextProjId();
    let proj = await volunteerInstance.createProject(startTime, endTime, exampleURI, {
      from: accounts[0],
    });
    let nextProjId = await volunteerInstance.getNextProjId();

    assert.equal(currProjId, 0);
    truffleAssert.eventEmitted(proj, 'ProjectCreated');
    assert.equal(nextProjId, 1);
  });

  // --------------------- Check In ------------------------ //
  it("Should not allow project owner to check in", async () => {
    let startTime = startTimePrior(2);
    let endTime = endTimeAfter(6);
    let currProjId = await volunteerInstance.getNextProjId();
    await volunteerInstance.createProject(startTime, endTime, exampleURI, {
      from: accounts[0],
    });
    await expectRevert(volunteerInstance.checkIn(currProjId, {
      from: accounts[0],
    }),
      "Cannot check in to your own project.",
    );
  });

  it("Should not allow volunteer to check in before project start time", async () => {
    const startTime = startTimeAfter(2);
    const endTime = endTimeAfter(4);
    const currProjId = await volunteerInstance.getNextProjId();
    await volunteerInstance.createProject(startTime, endTime, exampleURI, {
      from: accounts[0],
    });
    await truffleAssert.reverts(volunteerInstance.checkIn(currProjId, {
      from: accounts[1],
    }),
      "Project has not started.",
    );
  });

  it("should revert if volunteer is checking in after the project ends", async () => {
    const currentTime = (await web3.eth.getBlock('latest')).timestamp;
    const startTime = currentTime - 3600; // Start the project 1 hour ago
    const endTime = currentTime + 3600; // End the project in 1 hour from now

    await volunteerInstance.createProject(startTime, endTime, exampleURI, { from: accounts[0] });
    const projId = await volunteerInstance.getNextProjId() - 1; // Get the newly created project's ID

    // Function to advance the blockchain time
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

    // Advancing time to 1 hour minus 10 minutes before the project ends
    await advanceTime(7200);  // Advance time by 3000 seconds, so we're within the last hour

    // Attempt to check in, should fail because less than 1 hour is left until the project ends
    await truffleAssert.reverts(
      volunteerInstance.checkIn(projId, { from: accounts[2] }),
      "Project has ended."
    );
  });

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
    let currProjId = await volunteerInstance.getNextProjId();
    await volunteerInstance.createProject(startTime, endTime, exampleURI, {
      from: accounts[0],
    });
    let volunteer = await volunteerInstance.checkIn(currProjId, {
      from: accounts[1],
    });
    let checkedIn = await volunteerInstance.isVolunteerInProject(currProjId, accounts[1]);
    let hours = await volunteerInstance.getProjectHours(currProjId, accounts[1]);


    // it("Should allow volunteer to successfully check in", async () => {
    //   let startTime = startTimePrior(2);
    //   let endTime = endTimeAfter(6)
    //   let currProjId = await volunteerInstance.getNextProjId();
    //   await volunteerInstance.createProject(startTime, endTime, {
    //     from: accounts[0],
    //   });
    //   let volunteer = await volunteerInstance.checkIn(currProjId, {
    //     from: accounts[1],
    //   });
    //   let checkedIn = await volunteerInstance.isVolunteerInProject(currProjId, accounts[1]);
    //   let hours = await volunteerInstance.getProjectHours(currProjId, accounts[1]);

    //   truffleAssert.eventEmitted(volunteer, 'VolunteerCheckedIn');
    //   assert.equal(checkedIn, true);
    //   assert.equal(hours, 0, "Hours should be 0 before checkout");
    // });

    it("Should not allow volunteer to check in after checking out", async () => {
      const startTime = startTimePrior(2);
      const endTime = endTimeAfter(4);
      const currProjId = await volunteerInstance.getNextProjId();
      await volunteerInstance.createProject(startTime, endTime, exampleURI, {
        from: accounts[0],
      });
      await volunteerInstance.checkIn(currProjId, { from: accounts[1] });

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

      await volunteerInstance.checkOut(currProjId, { from: accounts[1] });

      await truffleAssert.reverts(volunteerInstance.checkIn(currProjId, {
        from: accounts[1],
      }),
        "You have already participated in the Project.",
      );
    });

    it("Should not allow volunteer to check in twice", async () => {
      const startTime = startTimePrior(2);
      const endTime = endTimeAfter(4);
      const currProjId = await volunteerInstance.getNextProjId();
      await volunteerInstance.createProject(startTime, endTime, exampleURI, {
        from: accounts[0],
      });
      await volunteerInstance.checkIn(currProjId, { from: accounts[1] });

      await truffleAssert.reverts(volunteerInstance.checkIn(currProjId, {
        from: accounts[1],
      }),
        "Volunteer has already checked in.",
      );
    });

    // -------------------------------------- Check Out ----------------------------------------------------------- //
    it("should revert if the volunteer tries to check out again after already completing the project", async () => {
      const currentTime = (await web3.eth.getBlock('latest')).timestamp;
      const startTime = currentTime - 3600; // project started 1 hour ago
      const endTime = currentTime + 7200; // project ends in 2 hours

      await volunteerInstance.createProject(startTime, endTime, exampleURI, { from: accounts[0] });
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
        "You have already checked out / Project organiser has checked you out."
      );
    });

    it("Should successfully check out and mint tokens if conditions are met", async () => {
      const tokenAddress = await volunteerInstance.getVolunteerTokenAddress(); // Method to get the deployed token address
      const tokenInstance = await VolunteerToken.at(tokenAddress);
      const currentTime = (await web3.eth.getBlock('latest')).timestamp;
      const startTime = currentTime - 3600; // 1 hours ago
      const endTime = currentTime + 14400; // 4 hours long project, still running

      await volunteerInstance.createProject(startTime, endTime, exampleURI, { from: accounts[0] });
      projId = await volunteerInstance.getNextProjId() - 1;

      //Volunteer first check in
      await volunteerInstance.checkIn(projId, { from: accounts[4] });

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
      await advanceTime(3601); // 1 hour and 1s later
      await volunteerInstance.checkOut(projId, { from: accounts[4] });

      // Check the balance of the minted token
      const balance = await tokenInstance.balanceOf(accounts[4], projId);
      assert.equal(balance.toString(), "1", "Balance should be 1 after minting");
    });

    it("Should not allow non-owner to end a project", async () => {
      const projId = 0; // Assuming a project with ID 0 exists
      await expectRevertCustomError(
        Volunteer,
        volunteerInstance.endProject(projId, { from: accounts[1] }),
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should allow the owner to end a project", async () => {
      let startTime = startTimePrior(2);
      let endTime = endTimeAfter(6);
      let currProjId = await volunteerInstance.getNextProjId();
      await volunteerInstance.createProject(startTime, endTime, exampleURI, {
        from: accounts[0],
      });
      await volunteerInstance.checkIn(currProjId, {
        from: accounts[1],
      });

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

      const project = await volunteerInstance.endProject(currProjId, { from: accounts[0] });
      const hoursClocked = await volunteerInstance.getProjectHours(currProjId, accounts[1]);

      truffleAssert.eventEmitted(project, 'ProjectEnded');
      truffleAssert.eventEmitted(project, 'VolunteerCheckedOut');

      assert(hoursClocked > 0, "Volunteer hours should be recorded");
    });

    it("Should not allow the volunteer to check out after owner has ended the project", async () => {
      let startTime = startTimePrior(2);
      let endTime = endTimeAfter(10);
      let currProjId = await volunteerInstance.getNextProjId();
      await volunteerInstance.createProject(startTime, endTime, exampleURI, {
        from: accounts[0],
      });
      await volunteerInstance.checkIn(currProjId, {
        from: accounts[1],
      });

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

      const project = await volunteerInstance.endProject(currProjId, { from: accounts[0] });

      // Check the state to confirm participation is recorded
      // const hoursClocked = await volunteerInstance.getProjectHours(projId, accounts[3]);
      // assert(hoursClocked > 0, "Volunteer hours should be recorded");

      // Try to check out again
      await truffleAssert.reverts(
        volunteerInstance.checkOut(currProjId, { from: accounts[1] }),
        "You have already checked out / Project organiser has checked you out."
      );

      truffleAssert.eventEmitted(project, 'ProjectEnded');
      truffleAssert.eventEmitted(project, 'VolunteerCheckedOut');
    });

    // ---------------------------------- Mint Token ------------------------------------------ //
    // MOVE TO VOLUNTEERTOKEN.SOL WHEN READY //
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

    it("should prevent token transfers", async () => {
      const tokenAddress = await volunteerInstance.getVolunteerTokenAddress(); // Method to get the deployed token address
      const tokenInstance = await VolunteerToken.at(tokenAddress);
      const currentTime = (await web3.eth.getBlock('latest')).timestamp;
      const startTime = currentTime - 3600; // 1 hours ago
      const endTime = currentTime + 14400; // 5hours long project, still running

      await volunteerInstance.createProject(startTime, endTime, { from: accounts[0] });
      projId = await volunteerInstance.getNextProjId() - 1;

      //Volunteer first check in
      await volunteerInstance.checkIn(projId, { from: accounts[4] });

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
      await advanceTime(3601); // 1 hour and 1s later
      await volunteerInstance.checkOut(projId, { from: accounts[4] });

      // Check the balance of the minted token
      const balance = await tokenInstance.balanceOf(accounts[4], projId);
      assert.equal(balance.toString(), "1", "Balance should be 1 after minting");


      // Attempt to transfer tokens - should revert
      try {
        await tokenInstance.safeTransferFrom(accounts[4], accounts[5], projId, 1, "0x0", { from: accounts[4] });
        assert.fail("The transaction should have reverted.");
      } catch (error) {
        assert.ok(
          error.message.includes("revert Only mint/burn allowed"),
          "Expected transfer to revert with 'Only mint/burn allowed'"
        );
      }


    });
  })


})
