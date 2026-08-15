# SafeYatra Blockchain Anchor Layer

This directory hosts the smart contracts and documentation for the decentralized, privacy-preserving tourist identity ledger used in the SafeYatra Smart Tourist Safety Platform.

## Core Smart Contract: `SafeYatraTouristIdentity.sol`

The contract is written in Solidity (^0.8.20) and provides:
1. **Privacy-Preserving PII Verification**: Anchors cryptographic hashes (SHA-256 / Keccak-256) of sensitive personal identification information (PII, such as Passport or Aadhaar number) bound to a decentralized identifier (DID) instead of storing raw values on-chain.
2. **Authorized Issuance**: Only trusted nodes registered by the Decentralized Tourism Authority trust network can call identity registration APIs.
3. **Immutable Emergency Auditing**: Automatically logs and audits when verification officers or administrative nodes query a tourist identity during active emergency operations.

## Compilation and Deployment

To compile or deploy the contract:

1. Install Hardhat or Truffle:
   ```bash
   npm install --save-dev hardhat
   ```
2. Compile the contract:
   ```bash
   npx hardhat compile
   ```
3. Deploy to the destination blockchain network (e.g., Polygon Amoy, Sepolia, or Hyperledger Besu EVM):
   ```bash
   npx hardhat run scripts/deploy.js --network polygon-amoy
   ```
