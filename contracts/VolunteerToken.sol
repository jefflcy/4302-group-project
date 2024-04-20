// contracts/VolunteerToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract VolunteerToken is ERC1155, Ownable {
    // baseURI: https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/
    // baseURI is the IPFS hash of the collection.json metadata
    string private _baseURI;

    // mapping stores the IPFS HASH to the file "0.json" for eg
    mapping(uint256 => string) private _projectURIs;

    // owner is the Volunteer.sol CA
    constructor(string memory _uri) ERC1155(_uri) Ownable(msg.sender) {
        _baseURI = _uri;
    }

    // mint nfts to the volunteer
    // called via Volunteer.sol's lockProject
    function mintAfterCheckout(
        uint256 projId,
        address volunteer
    ) public onlyOwner {
        _mint(volunteer, projId, 1, "");
    }

    // STORE URI FOR EACH PROJECT
    function setURI(uint256 projId, string memory _uri) public onlyOwner {
        _projectURIs[projId] = _uri;
    }

    // override URI for indiv project metadata uri
    function uri(uint256 projId) public view override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "https://ipfs.io/ipfs/",
                    _projectURIs[projId],
                    "/",
                    Strings.toString(projId),
                    ".json"
                )
            );
    }

    // URI for entire contract for opensea
    function contractURI() public view returns (string memory) {
        return string(abi.encodePacked(_baseURI, "collection.json"));
    }

    // making it soulbound, ie. only minting from address(0) is possible
    // Override safeTransferFrom to prevent token transfers
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual override {
        require(
            from == address(0) || to == address(0),
            "Only mint/burn allowed."
        ); // only allow minting/burning
        super.safeTransferFrom(from, to, id, amount, data);
    }

    // Override safeBatchTransferFrom to prevent token transfers.
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override {
        require(
            from == address(0) || to == address(0),
            "Only batch mint/burn allowed."
        ); // only allow batch minting/burning
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }
}
