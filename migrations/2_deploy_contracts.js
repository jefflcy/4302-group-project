const Volunteer = artifacts.require("../contracts/Volunteer.sol");

module.exports = (deployer, network, accounts) => {
  const tokenUri =
    "https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/";
  deployer.deploy(Volunteer, tokenUri);
};
