const Dice = artifacts.require("Volunteer");


module.exports = (deployer, network, accounts) => {
    deployer.deploy(Volunteer);
}