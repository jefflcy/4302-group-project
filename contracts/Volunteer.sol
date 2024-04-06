// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Volunteer is ERC1155, AccessControl, ReentrancyGuard {
    bytes32 public constant CHARITY_ROLE = keccak256("CHARITY_ROLE");

    // Token IDs
    uint256 private constant REWARD_TOKEN_ID = 1; // For reward tokens, fungible
    // Starting index for unique badge NFTs, non-fungible
    uint256 private currentBadgeId = 1000;

    struct VolunteerProject {
        uint256 id;
        string details;
        uint256 startDateTime;
        uint256 endDateTime;
        uint256 maxVolunteers;
        address[1000] volunteers;
        uint8 volunteerCount;
        bool isActive;
    }

    struct VolunteerInfo {
        bool hasCheckedIn;
        uint256 checkInTime;
        uint256 volunteerHours;
    }

    VolunteerProject[] public projects;
    mapping(uint256 => mapping(address => VolunteerInfo))
        public projectVolunteers;

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

    constructor() ERC1155("https://yourmetadata.api/item/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function createProject(
        string memory details,
        uint256 startDateTime,
        uint256 endDateTime,
        uint256 maxVolunteers
    ) public onlyRole(CHARITY_ROLE) {
        require(
            startDateTime < endDateTime,
            "Start date must be before end date"
        );
        require(
            startDateTime > block.timestamp,
            "Start date must be in the future"
        );
        require(
            maxVolunteers > 0,
            "Maximum number of volunteers must be at least one"
        );

        uint256 projectId = projects.length;
        address[1000] memory emptyVolunteers; // No need to explicitly initialize

        projects.push(
            VolunteerProject({
                id: projectId,
                details: details,
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                maxVolunteers: maxVolunteers,
                volunteers: emptyVolunteers,
                volunteerCount: 0,
                isActive: true
            })
        );

        emit ProjectCreated(projectId, details);
    }

    function joinProject(uint256 projectId) public {
        require(projectId < projects.length, "Invalid project ID");
        VolunteerProject storage project = projects[projectId];

        require(
            block.timestamp < project.startDateTime,
            "Project has already started"
        );
        require(
            project.volunteerCount < project.maxVolunteers,
            "Project is full"
        );
        // Ensure the volunteer is not already in the project; requires iterating over the volunteers array

        project.volunteers[project.volunteerCount] = msg.sender; // Add volunteer to the next spot
        project.volunteerCount += 1; // Increment the counter

        emit VolunteerJoined(projectId, msg.sender);
    }

    function checkIn(uint256 projectId) public {
        require(projectId < projects.length, "Invalid project ID");
        VolunteerProject storage project = projects[projectId];

        require(
            block.timestamp >= project.startDateTime,
            "Project has not started yet"
        );
        require(
            block.timestamp <= project.endDateTime,
            "Project has already ended"
        );
        require(
            isVolunteerInProject(projectId, msg.sender),
            "Not a volunteer of this project"
        );

        VolunteerInfo storage volunteer = projectVolunteers[projectId][
            msg.sender
        ];
        require(!volunteer.hasCheckedIn, "Already checked in");

        volunteer.hasCheckedIn = true;
        volunteer.checkInTime = block.timestamp;
        emit VolunteerCheckedIn(projectId, msg.sender);
    }

    function checkOut(uint256 projectId) public {
        require(projectId < projects.length, "Invalid project ID");
        VolunteerProject storage project = projects[projectId];

        require(
            isVolunteerInProject(projectId, msg.sender),
            "Not a volunteer of this project"
        );

        VolunteerInfo storage volunteer = projectVolunteers[projectId][
            msg.sender
        ];
        require(volunteer.hasCheckedIn, "Not checked in");

        uint256 workedHours = (block.timestamp - volunteer.checkInTime) / 3600;
        volunteer.volunteerHours += workedHours;
        emit VolunteerCheckedOut(projectId, msg.sender, workedHours);

        // Example token distribution logic; customize as needed
        uint256 tokensToDistribute = workedHours * 1e18; // Assuming 1 token per hour
        _mint(msg.sender, REWARD_TOKEN_ID, tokensToDistribute, "");
        emit TokenDistributed(msg.sender, tokensToDistribute);
    }

    function isVolunteerInProject(
        uint256 projectId,
        address volunteer
    ) public view returns (bool) {
        for (uint256 i = 0; i < projects[projectId].volunteers.length; i++) {
            if (projects[projectId].volunteers[i] == volunteer) {
                return true;
            }
        }
        return false;
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
