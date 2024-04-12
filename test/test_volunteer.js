const Volunteer = artifacts.require("Volunteer");
const _deploy_contracts = require("../migrations/deploy_contracts");
var assert = require('assert');

contract("Volunteer", accounts => {
    const [admin, charity, volunteer1, volunteer2] = accounts;

    before(async () => {
        this.volunteerInstance = await Volunteer.deployed();
        // Assuming the reward token is already deployed and its address is available
        // For these tests, you would mock the token or deploy a test token alongside the Volunteer contract
        await this.volunteerInstance.assignCharityRole(charity, { from: admin });
    });

    it("allows a charity to create a project", async () => {
        await this.volunteerInstance.createProject("Clean the Park", 1622548800, 1622635200, 20, { from: charity });
        const project = await this.volunteerInstance.projects(0);
        assert.equal(project.details, "Clean the Park", "Project details do not match");
    });

    it("allows volunteers to join a project", async () => {
        await this.volunteerInstance.joinProject(0, { from: volunteer1 });
        const project = await this.volunteerInstance.projects(0);
        assert.equal(project.volunteers[0], volunteer1, "Volunteer1 was not added to the project");
    });

    it("prevents volunteers from joining a full project", async () => {
        // Assuming the maxVolunteers is 1 for simplicity
        try {
            await this.volunteerInstance.joinProject(0, { from: volunteer2 });
            assert.fail("The contract did not prevent a second volunteer from joining a full project");
        } catch (error) {
            assert.include(error.message, "revert", "The error message should contain 'revert'");
        }
    });

    it("allows volunteers to check in and check out", async () => {
        // For these tests, you might need to manipulate block timestamps
        // This can be more challenging with Truffle tests depending on your environment
        // Consider testing these functionalities with higher-level scripts or in a staging environment

        // Check in
        await this.volunteerInstance.checkIn(0, { from: volunteer1 });
        let volunteerInfo = await this.volunteerInstance.projectVolunteers(0, volunteer1);
        assert.equal(volunteerInfo.hasCheckedIn, true, "Volunteer did not successfully check in");

        // Check out
        await this.volunteerInstance.checkOut(0, { from: volunteer1 });
        volunteerInfo = await this.volunteerInstance.projectVolunteers(0, volunteer1);
        assert(volunteerInfo.volunteerHours > 0, "Volunteer hours were not recorded");
    });

    it("distributes rewards properly", async () => {
        // This test requires the contract to have access to the reward tokens
        // Make sure to set up the proper permissions and have the contract hold tokens for distribution

        // For simplicity, assume volunteers receive tokens upon checkout
        // Check the volunteer's token balance before and after to ensure they received tokens
        // You would use the token contract instance to check balances
    });

    // Additional tests can include role management, token minting, edge cases, and error handling
});