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

    // Event emitted after transferring to all participants
    event TransferComplete(uint256 projId, address[] participants);

    // _uri: https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/
    // owner: the deployer of the contract (input when calling from Volunteer.sol)
    constructor(string memory _uri) ERC1155(_uri) Ownable(tx.origin) {
        baseURI = _uri;
    } 

    // mint nfts to the Volunteer.sol CA
    // called by Volunteer.sol's lockProject
    // make sure Volunteer.sol is ERC1155Holder 
    function mintAfterLockProject(uint256 projId, uint256 numOfParticipants) public {
        projectsHistory[projId] = numOfParticipants; // store mintedSupply for each project
        _mint(msg.sender, projId, numOfParticipants, "");
    }

    // transfer NFTs to participants
    // called by Volunteer.sol's unlockProject
    function transferAfterUnlock(uint256 projId, address[] calldata participants) public {
        require(tx.origin == owner(), "Only owner can award tokens.");

        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            if (participant == address(0)) break; // break if address(0) as address[] may not be filled up completely
            safeTransferFrom(tx.origin, participant, projId, 1, "");
        } 

        emit TransferComplete(projId, participants);
    }

    // override URI for indiv project metadata uri
    function uri(uint256 _projId) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, Strings.toString(_projId), ".json"));
    }

    // URI for entire contract for opensea
    function contractURI() public view returns (string memory) {
        return string(abi.encodePacked(baseURI, "collection.json"));
    }

    // making it soulbound, ie. only owner can transfer/burn tokens
    function _updateWithAcceptanceCheck(
        address from, 
        address to, 
        uint256[] memory ids, 
        uint256[] memory values,
        bytes memory data
        ) internal override {
            super._updateWithAcceptanceCheck(from, to, ids, values, data);
            require(address(0) == from || owner() == from || to == address(0), "Only charity (owner) can transfer/burn tokens");
        }

}