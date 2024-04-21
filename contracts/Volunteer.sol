// contracts/Volunteer.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {VolunteerToken} from "./VolunteerToken.sol";

/// @title Volunteer Management Contract
/// @dev Manages volunteer projects and tracks volunteer participation hours
/// @notice This contract handles all operations related to creating projects,
///         registering volunteer hours, and issuing tokens based on participation.
contract Volunteer is Ownable {
    VolunteerToken volunteerTokenContract;

    struct VolunteerProject {
        uint256 projId;
        address[] participatingVolunteers;
        uint256 startDateTime;
        uint256 endDateTime;
        bool ended;
    }

    /*
        DATE TIME IN SOLIDITY: stored as seconds since 1st Jan 1970 
        USE: https://www.epochconverter.com/ for testing
    */

    struct TempVolunteer {
        uint256 startTime; // the temporary holder for the start time on an ongoing project
        uint256 endTime; // the temporary holder for the end time on an ongoing project
    }

    VolunteerProject[] projects; // array of all projects ever created
    mapping(uint256 => address[]) tempVolunteerAddresses; // maps projId to address array to keep track of all tempVolunteers -- used during endProject
    mapping(uint256 => mapping(address => TempVolunteer)) tempVolunteers; // maps projId to mapping of volunteer address to a TempVolunteer struct for an ongoing project (projId)
    mapping(address => uint256) volunteerTotalHours; // maps volunteer address to volunteer's totalHours clocked
    mapping(address => mapping(uint256 => uint256)) volunteerHistory; // maps volunteer address to mapping of projId to hoursClocked for each project

    event ProjectCreated(
        uint256 indexed projId,
        uint256 startDateTime,
        uint256 endDateTime,
        string uriHash
    );
    event VolunteerCheckedIn(uint256 indexed projId, address volunteer);
    event VolunteerCheckedOut(uint256 indexed projId, address volunteer);
    event ProjectEnded(uint256 indexed projId);

    /// @dev Ensures the provided project ID is valid
    modifier validProjId(uint256 projId) {
        require(projId >= 0 && projId < getNextProjId(), "Invalid Project ID.");
        _;
    }

    modifier validUriHash(string memory uriHash) {
        require(
            bytes(uriHash).length == 46 &&
                bytes(uriHash)[0] == 0x51 &&
                bytes(uriHash)[1] == 0x6D,
            "Invalid uriHash."
        );
        _;
    }

    // _uri: https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/
    constructor(string memory _uri) Ownable(msg.sender) {
        volunteerTokenContract = new VolunteerToken(_uri);
    }

    /// @notice Creates a new volunteer project
    /// @param startDateTime Start time of the project (UNIX timestamp)
    /// @param endDateTime End time of the project (UNIX timestamp)
    /// @param uriHash IPFS hash of project-related metadata
    function createProject(
        uint startDateTime,
        uint endDateTime,
        string memory uriHash
    ) public onlyOwner validUriHash(uriHash) {
        /* ADD NEW REQUIRE STATEMENTS HERE */
        require(endDateTime > startDateTime, "Invalid Start and End Timings.");
        require(
            endDateTime > block.timestamp,
            "End Time must be in the future."
        );

        uint256 projId = getNextProjId();

        // STORE THE URI IN THE VOLUNTEERTOKEN CONTRACT
        volunteerTokenContract.setUriHash(projId, uriHash);

        // Init empty volunteers array
        address[] memory participatingVolunteers;

        projects.push(
            VolunteerProject({
                projId: projId,
                participatingVolunteers: participatingVolunteers,
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                ended: false
            })
        );

        emit ProjectCreated(projId, startDateTime, endDateTime, uriHash);
    }

    /// @notice Registers a volunteer's check-in to a project
    /// @param projId The ID of the project to check into
    function checkIn(uint256 projId) public validProjId(projId) {
        VolunteerProject storage project = projects[projId];

        require(msg.sender != owner(), "Cannot check in to your own project.");
        require(
            block.timestamp >= project.startDateTime,
            "Project has not started."
        );
        require(
            block.timestamp < project.endDateTime && project.ended == false,
            "Project has ended."
        );
        require(
            volunteerHistory[msg.sender][projId] == 0,
            "You have already participated in the Project."
        );
        require(
            !isVolunteerInProject(projId, msg.sender),
            "Volunteer has already checked in."
        );

        // ADD to VolunteerProject struct
        project.participatingVolunteers.push(msg.sender);

        // ADD to tempVolunteerAddresses
        tempVolunteerAddresses[projId].push(msg.sender);

        // CREATE TempVolunteer struct
        tempVolunteers[projId][msg.sender] = TempVolunteer({
            startTime: 0,
            endTime: 0
        });

        // UPDATE startTime in TempVolunteer struct
        tempVolunteers[projId][msg.sender].startTime = block.timestamp;

        emit VolunteerCheckedIn(projId, msg.sender);
    }

    /// @notice Finalizes a volunteer's participation in a project
    /// @param projId The ID of the project to check out from
    function checkOut(uint256 projId) public validProjId(projId) {
        VolunteerProject memory project = projects[projId];
        require(
            project.ended == false,
            "Project organiser has ended the project and checked you out."
        );
        require(
            getProjectHours(projId, msg.sender) == 0,
            "You have already checked out."
        );
        _checkOut(projId, msg.sender);
    }

    /// @dev Handles the internal logic for checking a volunteer out of a project
    /// @param projId The ID of the project from which the volunteer is checking out
    /// @param volunteer The address of the volunteer to check out
    /// @notice This function is only called internally and enforces project participation rules
    function _checkOut(
        uint256 projId,
        address volunteer
    ) private validProjId(projId) {
        VolunteerProject memory project = projects[projId];
        require(
            isVolunteerInProject(projId, volunteer),
            "Volunteer did not check in to this project."
        );
        require(
            getProjectHours(projId, volunteer) == 0,
            "User has already checked out."
        );

        TempVolunteer storage tempVolunteer = tempVolunteers[projId][volunteer];

        // ADD endTime to TempVolunteer struct ACCORDINGLY
        if (block.timestamp >= project.endDateTime) {
            tempVolunteer.endTime = project.endDateTime; // for endProject
        } else {
            tempVolunteer.endTime = block.timestamp;
        }

        // CALCULATE hoursClocked
        uint256 hoursClocked = Math.ceilDiv(
            (tempVolunteer.endTime - tempVolunteer.startTime),
            3600
        );

        // ADD hoursClocked to volunteerTotalHours and volunteerHistory
        volunteerTotalHours[volunteer] += hoursClocked;
        volunteerHistory[volunteer][projId] = hoursClocked;

        // MINT the token to volunteer's EOA
        uint256 maxEventHours = Math.ceilDiv(
            (project.endDateTime - project.startDateTime),
            3600
        );
        (bool success, uint256 result) = Math.tryDiv(maxEventHours, 2);
        if (hoursClocked >= result && success) {
            volunteerTokenContract.mintAfterCheckout(projId, volunteer);
        }

        // EMIT the VolunteerCheckedOut event
        emit VolunteerCheckedOut(projId, volunteer);
    }

    /*
     *  NEW FUNCTION TO PURGE ALL VOLUNTEERS THAT CHECKED IN BUT NEVER CHECKOUT
     *  TO ENSURE STATE CONSISTENCY
     *  CALLED BY CHARITY
     */
    /// @notice Ends a project by checking out all volunteers who have not yet checked out
    /// @dev This function is called by the project owner to finalize a project and ensure all volunteer hours are recorded correctly.
    ///      It goes through the list of volunteers who checked in and checks them out if they haven't done so themselves.
    /// @param projId The project ID to be ended
    function endProject(uint256 projId) public onlyOwner validProjId(projId) {
        require(
            projects[projId].participatingVolunteers.length > 0,
            "No Volunteers have checked in yet."
        );

        // check out participants who have checked in but not checked out
        for (uint i = 0; i < tempVolunteerAddresses[projId].length; i++) {
            // to get wallet addresses to loop thru tempVolunteers
            address volunteer = tempVolunteerAddresses[projId][i];

            // using wallet address to get corresponding TempVolunteer for that projId
            TempVolunteer memory tempVolunteer = tempVolunteers[projId][
                volunteer
            ];
            // check if he has checkedOut or not
            if (tempVolunteer.endTime == 0) {
                // did not check Out
                _checkOut(projId, volunteer);
            }
        }

        // UPDATE project has ended to VolunteerProject
        projects[projId].ended = true;

        // purge tempVolunteers and tempVolunteerAddresses for that projId
        for (uint i = 0; i < tempVolunteerAddresses[projId].length; i++) {
            // to get wallet addresses to loop thru tempVolunteers
            address volunteer = tempVolunteerAddresses[projId][i];

            // remove each TempVolunteer struct linked to that wallet address
            delete tempVolunteers[projId][volunteer];
        }
        // remove address[] linked to that projId
        delete tempVolunteerAddresses[projId];

        emit ProjectEnded(projId);
    }

    // HELPER FUNCTIONS
    /// @notice Checks if a volunteer is currently participating in a given project
    /// @param projId The project ID to check for participation
    /// @param volunteer The address of the volunteer
    /// @return bool True if the volunteer is part of the project's participating volunteer list
    function isVolunteerInProject(
        uint256 projId,
        address volunteer
    ) public view returns (bool) {
        VolunteerProject memory project = projects[projId];
        for (uint256 i = 0; i < project.participatingVolunteers.length; i++) {
            if (project.participatingVolunteers[i] == volunteer) {
                return true;
            }
        }
        return false;
    }

    /// @notice Determines if a volunteer has already checked out of a project
    /// @param projId The project ID to check
    /// @param volunteer The address of the volunteer
    /// @return checkedOut True if the volunteer has checked out based on recorded hours
    function isCheckedOut(
        uint256 projId,
        address volunteer
    ) public view returns (bool checkedOut) {
        if (
            isVolunteerInProject(projId, volunteer) &&
            volunteerHistory[volunteer][projId] != 0
        ) {
            return true;
        }
        return false;
    }

    // GETTER FUNCTIONS
    /// @notice Retrieves the next available project ID, which is also the total count of projects
    /// @return projId The ID for the next project to be created
    function getNextProjId() public view returns (uint256 projId) {
        return projects.length;
    }

    /// @notice Gets the total hours clocked by a volunteer across all projects
    /// @param volunteer The address of the volunteer
    /// @return totalHours The total number of hours volunteered by the given address
    function getTotalHours(
        address volunteer
    ) public view returns (uint256 totalHours) {
        return volunteerTotalHours[volunteer];
    }

    /// @notice Retrieves the number of hours a volunteer has clocked for a specific project
    /// @param projId The ID of the project
    /// @param volunteer The address of the volunteer
    /// @return hoursClocked The hours recorded for the volunteer for the specified project
    function getProjectHours(
        uint256 projId,
        address volunteer
    ) public view returns (uint256 hoursClocked) {
        return volunteerHistory[volunteer][projId];
    }

    /// @notice Gets all project IDs and corresponding hours clocked by a volunteer
    /// @param volunteer The address of the volunteer
    /// @return projectIds Array of project IDs
    /// @return projectHours Array of hours clocked corresponding to each project ID
    function getAllProjectHours(
        address volunteer
    )
        public
        view
        returns (uint256[] memory projectIds, uint256[] memory projectHours)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < projects.length; i++) {
            uint256 projHours = volunteerHistory[volunteer][i];
            if (projHours != 0) {
                projectIds[count] = i;
                projectHours[count] = projHours;
                count++;
            }
        }

        return (projectIds, projectHours);
    }

    /// @notice Retrieves the address of the deployed VolunteerToken contract
    /// @return volunteerTokenAddress The address of the VolunteerToken contract
    function getVolunteerTokenAddress()
        public
        view
        returns (address volunteerTokenAddress)
    {
        return address(volunteerTokenContract);
    }
}
