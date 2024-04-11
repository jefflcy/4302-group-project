// contracts/VolunteerToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract VolunteerToken is ERC1155, Ownable {

    // baseURI: https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/
    string baseURI;

    // maps `projId` to `mintedSuply`
    mapping(uint256 => uint256) projectsHistory;

    // _uri: https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/
    // owner: the deployer of the contract (input when calling from Volunteer.sol)
    constructor(address owner, string memory _uri) ERC1155(_uri) Ownable(owner) {
        baseURI = _uri;
    } 

    // mintAfterLockProject will mint nfts to the Volunteer.sol CA
    // make sure Volunteer.sol is ERC1155Holder 
    function mintAfterLockProject(uint256 projId, uint256 numOfParticipants) public {
        projectsHistory[projId] = numOfParticipants; // store mintedSupply for each project
        _mint(msg.sender, projId, numOfParticipants, "");
    }

    // override URI for indiv project metadata uri
    function uri(uint256 _projId) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, Strings.toString(_projId), ".json"));
    }

    // URI for entire contract for opensea
    function contractURI() public view returns (string memory) {
        return string(abi.encodePacked(baseURI, "collections.json"));
    }

    // making it soulbound, ie. only owner can transfer/burn tokens
    function _beforeTokenTransfer(
        address operator, 
        address from, 
        address to, 
        uint256[] memory ids, 
        uint256[] memory amounts,
        bytes memory data
        ) internal override {
            super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
            require(owner() == from || to == address(0), "Only charity (owner) can transfer/burn tokens");

}