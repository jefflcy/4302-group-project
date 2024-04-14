// contracts/Volunteer.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import "./VolunteerToken.sol";

contract Volunteer is Ownable {

    VolunteerToken volunteerTokenContract;

    struct VolunteerProject {
        uint256 id;
        uint256 maxVolunteers;
        address[] participatingVolunteers;
        uint8 volunteerCount;
        uint256 startDateTime; // new impl
        uint256 endDateTime; // new impl
    }

    /* HOW TO USE DATE TIME AS UINT IN SOLIDITY */

    // uint startDate = 1638352800; // 2012-12-01 10:00:00
    // uint endDate = 1638871200; // 2012-12-07 10:00:00
    // uint daysDiff = (endDate - startDate) / 60 / 60 / 24; // 6 days

    struct VolunteerInfo {
        uint256 totalHours;
        uint256[] startTimes; // new
        uint256[] endTimes; // new
        uint256[] projectHistory;
    }

    VolunteerProject[] public projects;
    mapping(address => VolunteerInfo) volunteers;

    event ProjectCreated(uint256 indexed projectId);
    event VolunteerCheckedIn(uint256 indexed projectId, address volunteer);
    /* ADD EVENT FOR CHECKOUT HERE */

    /* ADD ACCESS MODIFIER FOR VALID PROJ ID*/

    // _uri: https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/
    constructor(string memory _uri) Ownable(msg.sender) {
        volunteerTokenContract = new VolunteerToken(_uri);
    }

    function createProject(
        uint startDateTime,
        uint endDateTime
    ) public onlyOwner {

        /* ADD NEW REQUIRE STATEMENTS HERE */

        uint256 projectId = projects.length;

        // Init empty volunteers array
        address[] memory participatingVolunteers;

        // projects.push(
        //     VolunteerProject({
        //     })
        // );

        emit ProjectCreated(projectId);
    }

    function checkIn(uint256 projectId) public {
        
        VolunteerProject storage project = projects[projectId]; 

        require(projectId < projects.length, "Invalid project ID"); // TO BE PULLED OUT TO MODIFIER
        require(
            project.volunteerCount + 1 <= project.maxVolunteers,
            "Project has already hit the volunteer limit"
        );
        require(
            !isVolunteerInProject(projectId, msg.sender),
            "Volunteer has already checked in"
        );

        project.participatingVolunteers.push(msg.sender);
        project.volunteerCount += 1; // Increment the counter

        emit VolunteerCheckedIn(projectId, msg.sender);
    }


    /* TO BE REMOVED, LEAVING HERE FOR REFERENCE */

    // function lockProject(uint256 projectId) public {
    //     require(projectId < projects.length, "Invalid project ID");
    //     VolunteerProject storage project = projects[projectId];
    //     require(
    //         project.currentState == projectState.created,
    //         "Project has been locked previously"
    //     );

    //     project.currentState = projectState.ongoing;

    //     volunteerTokenContract.mintAfterLockProject(
    //         projectId,
    //         project.participatingVolunteers.length
    //     );

    //     project.startDateTime = block.timestamp;

    //     emit ProjectLocked(projectId, project.startDateTime);
    // }

    /* TO BE CHANGED TO CHECKOUT, LEAVING HERE FOR REFERENCE */
    // function unlockProject(uint256 projectId) public {
    //     require(projectId < projects.length, "Invalid project ID");
    //     VolunteerProject storage project = projects[projectId];
    //     require(
    //         project.currentState == projectState.ongoing,
    //         "Project is not locked"
    //     );

    //     project.endDateTime = block.timestamp;
    //     uint256 hoursElapsed = (project.endDateTime - project.startDateTime) /
    //         3600;
    //     uint256 hoursToDistribute = Math.min(hoursElapsed, project.maxHours);

    //     project.currentState = projectState.ended;

    //     volunteerTokenContract.transferAfterUnlock(
    //         projectId,
    //         project.participatingVolunteers
    //     );

    //     for (uint256 i = 0; i < project.participatingVolunteers.length; i++) {
    //         address volunteerAdd = project.participatingVolunteers[i];

    //         VolunteerInfo storage volunteer = volunteers[volunteerAdd];
    //         volunteer.totalHours += hoursToDistribute;
    //         volunteer.projectHistory[projectId] = hoursToDistribute;
    //     }

    //     emit ProjectUnlocked(projectId, project.endDateTime);
    // }

    
    
    // HELPER FUNCTIONS
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


    // GETTER FUNCTIONS 
    function getNextProjId() public view returns (uint256) {
        return projects.length;
    }

    function getTotalHours(address volunteerAdd) public view returns (uint256) {
        VolunteerInfo storage volunteer = volunteers[volunteerAdd];
        uint256 volunteerHours = volunteer.totalHours;

        return volunteerHours;
    }

    function getProjectHours(
        address volunteerAdd,
        uint256 projectId
    ) public view returns (uint256) {
        VolunteerInfo storage volunteer = volunteers[volunteerAdd];
        uint256 volunteerHours = volunteer.projectHistory[projectId];

        return volunteerHours;
    }
}