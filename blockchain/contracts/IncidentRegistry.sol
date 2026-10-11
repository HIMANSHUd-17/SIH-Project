// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IncidentRegistry
 * @notice Tamper-proof registry for storing tourist emergency incidents & IPFS evidence hashes
 */
contract IncidentRegistry {
    address public owner;

    struct Incident {
        string touristDid;      // Jis tourist ne report kiya (DID)
        string ipfsHash;        // Original Image ka IPFS CID (Evidence)
        string geoCoordinates;  // Exact Latitude aur Longitude
        uint256 timestamp;      // Incident kab report hua
        bool isAIVerified;      // Backend AI verification status
    }

    // Incident ID se Incident data ka mapping
    mapping(uint256 => Incident) public incidents;
    uint256 public incidentCount;

    // Frontend aur Backend ke liye Events
    event IncidentReported(uint256 indexed incidentId, string touristDid, string ipfsHash, uint256 timestamp);
    event IncidentVerified(uint256 indexed incidentId, bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only authorized backend node can verify");
        _;
    }

    constructor() {
        // Contract deploy karne wala (aapka backend wallet) owner ban jayega
        owner = msg.sender;
    }

    /**
     * @notice Naya incident report karne ke liye (Called via Frontend or Backend)
     */
    function reportIncident(
        string calldata _did, 
        string calldata _ipfsHash, 
        string calldata _geoCoords
    ) external {
        incidentCount++;
        incidents[incidentCount] = Incident({
            touristDid: _did,
            ipfsHash: _ipfsHash,
            geoCoordinates: _geoCoords,
            timestamp: block.timestamp,
            isAIVerified: false
        });

        emit IncidentReported(incidentCount, _did, _ipfsHash, block.timestamp);
    }

    /**
     * @notice AI/Authority dwara incident verify karne ke liye (Called by Backend)
     */
    function verifyIncident(uint256 _incidentId, bool _status) external onlyOwner {
        require(_incidentId > 0 && _incidentId <= incidentCount, "Invalid Incident ID");
        incidents[_incidentId].isAIVerified = _status;
        
        emit IncidentVerified(_incidentId, _status);
    }

    /**
     * @notice Kisi bhi incident ki details read karne ke liye
     */
    function getIncident(uint256 _incidentId) 
        external 
        view 
        returns (
            string memory touristDid, 
            string memory ipfsHash, 
            string memory geoCoordinates, 
            uint256 timestamp, 
            bool isAIVerified
        ) 
    {
        require(_incidentId > 0 && _incidentId <= incidentCount, "Invalid Incident ID");
        Incident memory inc = incidents[_incidentId];
        return (inc.touristDid, inc.ipfsHash, inc.geoCoordinates, inc.timestamp, inc.isAIVerified);
    }
}