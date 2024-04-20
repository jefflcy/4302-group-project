// contracts/VolunteerToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title VolunteerToken
 * @dev This contract handles the minting and management of tokens for a volunteer-based system.
 * Tokens are minted as ERC1155 tokens, where each token type represents participation in a unique project.
 * Tokens can only be minted to volunteers upon project completion and are soulbound, meaning they cannot be transferred between wallets.
 */
contract VolunteerToken is ERC1155, Ownable {
    // baseURI: https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/
    // baseURI is the IPFS hash of the collection.json metadata
    string private _baseURI;

    // mapping stores the IPFS HASH to the file "0.json" for eg
    mapping(uint256 => string) private _projectUriHashs;

    /**
     * @notice Initializes the VolunteerToken contract with the base URI for token metadata.
     * @param _uri The base URI to be used for all token metadata linked via IPFS.
     */

    constructor(string memory _uri) ERC1155(_uri) Ownable(msg.sender) {
        _baseURI = _uri;
    }

    // mint nfts to the volunteer
    // called via Volunteer.sol's lockProject
    /**
     * @notice Mints tokens to a volunteer's address upon successful project completion.
     * @param projId The project ID for which the token is minted.
     * @param volunteer The address of the volunteer receiving the tokens.
     */
    function mintAfterCheckout(
        uint256 projId,
        address volunteer
    ) public onlyOwner {
        _mint(volunteer, projId, 1, "");
    }

    // STORE URIHASH FOR EACH PROJECT
    /**
     * @notice Sets the IPFS hash for a specific project's metadata.
     * @param projId The project ID to associate with the metadata URI hash.
     * @param _uriHash The IPFS hash pointing to the project-specific metadata.
     */
    function setUriHash(
        uint256 projId,
        string memory _uriHash
    ) public onlyOwner {
        _projectUriHashs[projId] = _uriHash;
    }

    /**
     * @notice Retrieves the complete URI for a specific project's metadata.
     * @dev Constructs the URI by appending the project-specific part to the base IPFS URL stored during construction.
     * @param projId The project ID whose metadata URI is being requested.
     * @return The full URI string pointing to the project's metadata on IPFS.
     */
    function uri(uint256 projId) public view override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "https://ipfs.io/ipfs/",
                    _projectUriHashs[projId],
                    "/",
                    Strings.toString(projId),
                    ".json"
                )
            );
    }

    /**
     * @notice Retrieves the URI for the overall contract metadata that is compatible with OpenSea standards.
     * @dev Appends 'collection.json' to the base URI set during the contract's initialization.
     * @return The URI string pointing to the overall contract metadata on IPFS.
     */
    function contractURI() public view returns (string memory) {
        return string(abi.encodePacked(_baseURI, "collection.json"));
    }

    /**
     * @notice Overrides the ERC1155 `safeTransferFrom` to restrict token transfers, allowing only mint or burn operations.
     * @param from The address tokens are being transferred from.
     * @param to The address tokens are being transferred to.
     * @param id The ID of the token type.
     * @param amount The number of tokens being transferred.
     * @param data Additional data with no specified format, sent in call to `_to`.
     * @dev This function reverts if any transfer attempt is made that isn't a mint or burn operation.
     */
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

    /**
     * @notice Overrides the ERC1155 `safeBatchTransferFrom` to prevent any token transfers, enforcing a soulbound mechanism where only minting and burning are allowed.
     * @param from The address tokens are being transferred from.
     * @param to The address tokens are being transferred to.
     * @param ids An array of token IDs.
     * @param amounts An array of transfer amounts for each token ID.
     * @param data Additional data with no specified format, sent in call to `_to`.
     * @dev This function reverts if any transfer attempt is made that isn't a batch mint or burn operation.
     */
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
