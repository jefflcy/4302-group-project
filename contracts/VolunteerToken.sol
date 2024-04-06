// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VolunteerToken is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    constructor() ERC721("VolunteerToken", "VLT") {}

    function mintVolunteerToken(
        address volunteer,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newItemId = _tokenIds;
        _mint(volunteer, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
}
