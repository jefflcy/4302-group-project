const Volunteer = artifacts.require("Volunteer");
const VolunteerToken = artifacts.require("VolunteerToken");

module.exports = (deployer, network, accounts) => {
  deployer.deploy(Volunteer);
  deployer.deploy(VolunteerToken);
};
