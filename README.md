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

## Usage

- **Charities/Non-profits**:
  1. Obtain the `uri` for the your json files.
  2. Deploy the `Volunteer.sol` contract with that `uri` as parameter.
  3. Call `createProject` with `startDateTime` & `endDateTime` as parameters.
  4. Call `endProject` with `projId` to finalize the project, which also handles volunteers who did not check out before the project's end.
- **Participants**:
  1. Call `checkIn` with the `projId` at the start ( >= project.startDateTime).
  2. Call `checkOut` with the `projId` at the end ( <= project.endDateTime).

## Features

- **Time Tracking**: Utilizes `block.timestamp` for tracking the check-in and check-out times of volunteers.
- **Token Issuance**: A token representing participation is minted for volunteers who check out properly by the end of the project.

## License

This project is open-sourced under the MIT License.
