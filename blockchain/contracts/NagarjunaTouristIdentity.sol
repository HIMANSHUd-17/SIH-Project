// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NagarjunaTouristIdentity
 * @notice Privacy-Preserving Blockchain Digital Identity & Emergency Verification Ledger
 * @dev Anchors cryptographic zero-knowledge hashes of tourist identities and tracks emergency officer access.
 */
contract NagarjunaTouristIdentity {
    
    address public immutable authorityOwner;

    struct IdentityRecord {
        string did;
        bytes32 piiHash;             // Keccak256 hash of encrypted Passport/Aadhaar
        uint256 registeredAt;
        uint256 blockNumber;
        bool isVerified;
        address issuerNode;
    }

    struct EmergencyAccessLog {
        address officerAddress;
        string reason;
        uint256 timestamp;
    }

    // Mapping from DID string to IdentityRecord
    mapping(string => IdentityRecord) private records;
    
    // Mapping from DID to Emergency Audit Trail
    mapping(string => EmergencyAccessLog[]) private auditLogs;

    // Authorized Authority Nodes
    mapping(address => bool) public authorizedNodes;

    // Events
    event IdentityRegistered(string indexed did, bytes32 indexed piiHash, address issuerNode);
    event EmergencyAccessLogged(string indexed did, address indexed officer, string reason, uint256 timestamp);

    modifier onlyAuthority() {
        require(authorizedNodes[msg.sender] || msg.sender == authorityOwner, "Caller is not an authorized authority node");
        _;
    }

    constructor() {
        authorityOwner = msg.sender;
        authorizedNodes[msg.sender] = true;
    }

    function addAuthorityNode(address _node) external {
        require(msg.sender == authorityOwner, "Only owner can add nodes");
        authorizedNodes[_node] = true;
    }

    /**
     * @notice Register a new tourist digital identity hash on-chain
     */
    function registerIdentity(
        string calldata _did,
        bytes32 _piiHash
    ) external onlyAuthority {
        require(records[_did].registeredAt == 0, "DID already registered");

        records[_did] = IdentityRecord({
            did: _did,
            piiHash: _piiHash,
            registeredAt: block.timestamp,
            blockNumber: block.number,
            isVerified: true,
            issuerNode: msg.sender
        });

        emit IdentityRegistered(_did, _piiHash, msg.sender);
    }

    /**
     * @notice Verify identity on-chain and log officer emergency access
     */
    function verifyIdentityAndAudit(
        string calldata _did,
        string calldata _reason
    ) external onlyAuthority returns (bool isVerified, bytes32 piiHash, uint256 registeredAt) {
        IdentityRecord memory record = records[_did];
        require(record.registeredAt > 0, "Identity DID not found");

        auditLogs[_did].push(EmergencyAccessLog({
            officerAddress: msg.sender,
            reason: _reason,
            timestamp: block.timestamp
        }));

        emit EmergencyAccessLogged(_did, msg.sender, _reason, block.timestamp);

        return (record.isVerified, record.piiHash, record.registeredAt);
    }

    /**
     * @notice Retrieve audit log count for a given DID
     */
    function getAuditLogCount(string calldata _did) external view returns (uint256) {
        return auditLogs[_did].length;
    }
}
