// contracts/Volunteer.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {VolunteerToken} from "./VolunteerToken.sol";

contract Volunteer is Ownable {
    VolunteerToken volunteerTokenContract;

    struct VolunteerProject {
        uint256 projId;
        address owner;
        address[] participatingVolunteers;
        uint256 startDateTime;
        uint256 endDateTime;
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
        uint256 endDateTime
    );
    event VolunteerCheckedIn(uint256 indexed projId, address volunteer);
    event VolunteerCheckedOut(uint256 indexed projId, address volunteer);
    event ProjectEnded(uint256 indexed projId);

    modifier validProjId(uint256 projId) {
        require(projId >= 0 && projId < getNextProjId(), "Invalid Project ID.");
        _;
    }

    // _uri: https://ipfs.io/ipfs/QmXHGAwVWFFstAHTX758FE5eiEb7TghFnUN3xfQCu2dk6B/
    constructor(string memory _uri) Ownable(msg.sender) {
        volunteerTokenContract = new VolunteerToken(_uri);
    }

    function createProject(
        uint startDateTime,
        uint endDateTime
    ) public onlyOwner {
        /* ADD NEW REQUIRE STATEMENTS HERE */
        require(endDateTime > startDateTime, "Invalid Start and End Timings.");
        require(
            endDateTime > block.timestamp,
            "End Time must be in the future."
        );

        uint256 projId = getNextProjId();

        // Init empty volunteers array
        address[] memory participatingVolunteers;

        projects.push(
            VolunteerProject({
                projId: projId,
                owner: msg.sender,
                participatingVolunteers: participatingVolunteers,
                startDateTime: startDateTime,
                endDateTime: endDateTime
            })
        );

        emit ProjectCreated(projId, startDateTime, endDateTime);
    }

    function checkIn(uint256 projId) public validProjId(projId) {
        VolunteerProject storage project = projects[projId];

        require(
            msg.sender != project.owner,
            "Cannot check in to your own project."
        );
        require(
            block.timestamp >= project.startDateTime,
            "Project has not started."
        );
        require(
            block.timestamp < project.endDateTime - 3600,
            "Project has ended or will be ending soon."
        ); // cannnot check in when there is an hour left in the allocated Project time
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

    function checkOut(uint256 projId) public validProjId(projId) {
        VolunteerProject memory project = projects[projId];
        require(
            block.timestamp <= project.endDateTime,
            "Project has already ended."
        );
        _checkOut(projId, msg.sender);
    }

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
            volunteerHistory[volunteer][projId] == 0,
            "You have already participated in the Project."
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
    function isVolunteerInProject(
        uint256 projId,
        address volunteer
    ) private view returns (bool) {
        VolunteerProject memory project = projects[projId];
        for (uint256 i = 0; i < project.participatingVolunteers.length; i++) {
            if (project.participatingVolunteers[i] == volunteer) {
                return true;
            }
        }
        return false;
    }

    // GETTER FUNCTIONS
    function getNextProjId() public view returns (uint256 projId) {
        return projects.length;
    }

    function getTotalHours(
        address volunteer
    ) public view returns (uint256 totalHours) {
        return volunteerTotalHours[volunteer];
    }

    function getProjectHours(
        uint256 projId,
        address volunteer
    ) public view returns (uint256 hoursClocked) {
        return volunteerHistory[volunteer][projId];
    }

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

    function getVolunteerTokenAddress()
        public
        view
        returns (address volunteerTokenAddress)
    {
        return address(volunteerTokenContract);
    }
}
