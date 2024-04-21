# Community Involvement Projects (CIP) Token System

## Overview

This project provides a blockchain-based solution for managing and rewarding participation in Community Involvement Projects (CIP). It serves two main stakeholders:

- **Participants**: Individuals who engage in volunteering activities can collect tokens representing their participation and have their volunteering hours recorded on the blockchain.
- **Charities/Non-profit Organizations**: These organizations can issue participation tokens and record the volunteering hours of participants on the blockchain.

## Installation

To set up and test the smart contracts, follow these steps:

1. **Install Node.js and npm**:
   Ensure that Node.js and npm are installed on your computer. If not, download and install them from [nodejs.org](https://nodejs.org/).

2. **Install Truffle**:
   Truffle is a development framework for Ethereum. Install it globally using npm:

   ```
   npm install -g truffle
   ```

3. **Install Ganache**:
   Ganache provides a personal Ethereum blockchain for testing purposes. Download and install it from [the Ganache website](https://trufflesuite.com/ganache/), or use the CLI version:

   ```
   npm install -g ganache-cli
   ```

4. **Clone the Repository**:
   Clone this repository to your local machine:

   ```
   git clone https://github.com/jefflcy/4302-group-project.git
   ```

5. **Install Dependencies**:
   Navigate into the project directory and install the required npm packages:

   ```
   cd 4302-group-project
   npm install
   ```

6. **Start Ganache**:
   Make sure you have the latest version of Ganache, though deprecated.

   ```
   npm install -g ganache
   ```

   Once done, launch Ganache CLI and run:

   ```
   ganache-cli
   ```

   Now ganache will be listening out for transactions on `127.0.0.1:8545`.

7. **Deploy the Contracts**:
   Compile and deploy the smart contracts to your local blockchain using Truffle:

   ```
   truffle compile
   truffle migrate
   ```

8. **Testing the Contracts**:
   Write unit tests to `test_volunteer.js` and test them using Truffle:
   ```
   truffle test
   ```

## Usage

- **Charities/Non-profits**:
  1. Obtain the `uri` for the your json files.
  2. Deploy the `Volunteer.sol` contract with that `uri` as parameter.
  3. Call `createProject` with `startDateTime`, `endDateTime` & `uriHash` as parameters.
  4. Call `endProject` with `projId` to finalize the project, which also handles volunteers who did not check out before the project's end.
- **Participants**:
  1. Call `checkIn` with the `projId` at the start ( >= project.startDateTime).
  2. Call `checkOut` with the `projId` at the end ( <= project.endDateTime).

## Function Criteria

- **Calling of `createProject`**:
  1. Ensure that the Wallet Address that deployed the `Volunteer.sol` contract is the address that calls the `createProject` function
  2. Ensure that the inputted `uriHash` is valid, starting with 'Qm' and have a length of 46 characters.
  3. Ensure that the `startDateTime` is earlier than the `endDateTime` and the `endDateTime` is in the future
- **Calling of `checkIn`**:
  1. Ensure that you are checking in within the Project Duration
  2. Ensure that you are checking in to a Project that the Project organiser has not ended.
  3. Ensure that you are checking in to an existing Project with a Valid Project ID
- **Calling of `checkOut`**:
  1. Ensure that you are checking out of a Project that you had previously checked into
  2. Ensure that you are checking out within the duration of the Project.
  3. Ensure that the Project organiser has not ended the Project you are checking out of.
- **Calling of `endProject`**:
  1. Ensure that the Wallet Address that deployed the `Volunteer.sol` contract is the address that calls the `endProject` function
  2. Ensure that there are Volunteers in the Project that you want to end

## Features

- **Time Tracking**: Utilizes `block.timestamp` for tracking the check-in and check-out times of volunteers.
- **Token Issuance**: A token representing participation is minted for volunteers who check out properly by the end of the project.
- **Soulbound Tokens**: Participants are not allowed to transfer tokens of project participation to other participants.

## Limitations
- **Single Day Events Only**  contract support events with defined start and end times but doesn't explicitly cater to events spanning multiple days. This could limit the flexibility of the platform, especially for events or volunteer activities that naturally extend beyond a single day.
- **Whole Numbers for Time Tracking** The contract uses whole numbers (integers) for time tracking, which means it can't easily handle time measurements that require more precise calculations (like partial hours or minutes), potentially leading to rounding errors or imprecise tracking of volunteer hours.
- **Lack of Event Modification Features**  Contract lacks methods for editing or updating details of an existing project once it has been created. This could pose challenges if there are changes to the event details, such as a change in timing or extending the duration of the project. Users would need to rely on external mechanisms to handle these changes, which could lead to discrepancies or the need to cancel and recreate projects.
- **No Deletion of Projects** Current implementation provides basic error handling through require statements but does not implement more sophisticated error management strategies that could give users more detailed feedback about the nature of errors or how to correct them.
- **Permission and Access Control Limitations:** The contract uses a simple ownership model with some functions restricted to the owner only. This may not be sufficient for organizations that require a more nuanced access control system with multiple levels of permissions for different types of administrative tasks.
- **Dependence on Accurate Timekeeping:** The contract's logic heavily relies on the block.timestamp for checking in and checking out volunteers, which is known to be manipulable by miners to a certain degree. This reliance could potentially be exploited under certain conditions, leading to inaccurate tracking of project start or end times.
- **Lack of Support for Fractional Token Minting** The system does not support issuing fractional tokens, which might be needed for more granular reward systems. For example, if volunteers earn tokens based on the exact number of minutes worked, the inability to handle fractions could limit the system's fairness or accuracy.



## License

This project is open-sourced under the MIT License.
