// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract Volunteer is ERC1155, AccessControl, ReentrancyGuard {
    bytes32 public constant CHARITY_ROLE = keccak256("CHARITY_ROLE");

    // Tokens IDs
    uint256 private constant REWARD_TOKEN_ID = 1; // For reward tokens, fungible

    // Starting index for unique badge NFTs, non-fungible
    uint256 private currentBadgeId = 1000;

    enum projectState {
        created,
        ongoing,
        ended
    }

    struct VolunteerProject {
        uint256 id;
        uint256 maxHours;
        uint256 maxVolunteers;
        address[] participatingVolunteers;
        uint8 volunteerCount;
        projectState currentState;
        uint256 startDateTime;
        uint256 endDateTime;
    }

    struct VolunteerInfo {
        uint256 totalHours;
        uint256[] projectHistory;
    }

    VolunteerProject[] public projects;
    mapping(address => VolunteerInfo) volunteers;

    event ProjectCreated(uint256 indexed projectId, string details);
    event VolunteerJoined(uint256 indexed projectId, address volunteer);
    event VolunteerCheckedIn(uint256 indexed projectId, address volunteer);
    event VolunteerCheckedOut(
        uint256 indexed projectId,
        address volunteer,
        uint256 volunteerHours
    );
    event TokenDistributed(address volunteer, uint256 amount);
    event BadgeMinted(address volunteer, uint256 badgeId);
    ///

    constructor() ERC1155("https://yourmetadata.api/item/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function createProject(
        uint256 maxVolunteers,
        uint256 maxHours
    ) public onlyRole(CHARITY_ROLE) {
        require(
            maxVolunteers > 0,
            "Maximum number of volunteers must be at least one"
        );
        require(maxHours > 0, "Maximum number of hours must be at least one");

        uint256 projectId = projects.length;

        projects.push(
            VolunteerProject({
                id: projectId,
                maxHours: maxHours,
                maxVolunteers: maxVolunteers,
                currentState: projectState.created
            })
        );

        emit ProjectCreated(projectId);
    }

    function checkIn(uint256 projectId) public {
        require(projectId < projects.length, "Invalid project ID");
        VolunteerProject storage project = projects[projectId];

        require(
            project.currentState == projectState.created,
            "Project has stopped taking in volunteers"
        );

        require(
            volunteerCount + 1 < project.maxVolunteers,
            "Project has already hit the volunteer limit"
        );
        require(
            !isVolunteerInProject(project, msg.sender),
            "Volunteer has already checked in"
        );

        project.participatingVolunteers.push(msg.sender);
        project.volunteerCount += 1; // Increment the counter

        emit VolunteerCheckedIn(projectId, msg.sender);
    }

    function isVolunteerInProject(
        VolunteerProkject project,
        address volunteer
    ) public view returns (bool) {
        for (uint256 i = 0; i < project.participatingVolunteers.length; i++) {
            if (project.participatingVolunteers[i] == volunteer) {
                return true;
            }
        }
        return false;
    }

    function lockProject(uint256 projectId) public {
        require(projectId < projects.length, "Invalid project ID");
        VolunteerProject storage project = projects[projectId];
        require(
            project.currentState == projectState.created,
            "Project has been locked previously"
        );

        project.currentState = projectState.ongoing;

        // CALL VOLUNTEERTOKEN.SOL MINT

        project.startDateTime = block.timestamp;
    }

    function unlockProject(uint256 projectId) public {
        require(projectId < projects.length, "Invalid project ID");
        VolunteerProject storage project = projects[projectId];
        require(
            project.currentState == projectState.ongoing,
            "Project is not locked"
        );

        project.endDateTime = block.timestamp;
        uint256 hoursElapsed = (project.endDateTime - project.startDateTime) /
            3600;
        uint256 hoursToDistribute = Math.min(hoursElapsed, maxHours);

        project.currentState = projectState.ended;

        for (uint256 i = 0; i < project.participatingVolunteers.length; i++) {
            address volunteerAdd = project.participatingVolunteers[i];

            // CALL VOLUNTEERTOKEN.SOL TRANSFER

            VolunteerInfo storage volunteer = volunteers[volunteerAdd];
            volunteer.totalHours += hoursToDistribute;
            voluntter.history[projectId] = hoursToDistribute;
        }
    }

    // Similar to previous versions but adapted for ERC1155 token interactions

    // New function to mint badges as NFTs
    function mintBadge(address volunteer) internal {
        _mint(volunteer, currentBadgeId++, 1, "");
        emit BadgeMinted(volunteer, currentBadgeId - 1);
    }

    // Function to distribute reward tokens
    function distributeRewardTokens(
        address volunteer,
        uint256 amount
    ) internal {
        _mint(volunteer, REWARD_TOKEN_ID, amount, "");
        emit TokenDistributed(volunteer, amount);
    }

    // Additional utility and management functions as needed...
}
