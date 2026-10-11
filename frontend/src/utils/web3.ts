import { ethers } from "ethers";

// Yeh humare naye Incident contract ka ABI (Application Binary Interface) hai
// Yeh frontend ko batata hai ki contract ke andar kaunse functions hain
export const INCIDENT_CONTRACT_ABI = [
    "function reportIncident(string calldata _did, string calldata _ipfsHash, string calldata _geoCoords) external",
    "function getIncident(uint256 _incidentId) external view returns (string touristDid, string ipfsHash, string geoCoordinates, uint256 timestamp, bool isAIVerified)"
];

// ✅ Naya deploy kiya hua Contract Address yahan update ho gaya hai
export const INCIDENT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

// Tourist ka wallet (MetaMask) connect karne ka function
export const connectWallet = async () => {
    // Check karte hain ki browser mein MetaMask install hai ya nahi
    const eth = typeof window !== 'undefined' ? (window as any).ethereum : undefined;
    if (typeof eth === 'undefined') {
        alert("Please install MetaMask to report incidents securely!");
        return null;
    }

    try {
        // User se wallet connect karne ki permission mangte hain
        await eth.request({ method: 'eth_requestAccounts' });
        
        // Ethers.js provider set karte hain
        const provider = new ethers.BrowserProvider(eth);
        const signer = await provider.getSigner();
        
        return signer;
    } catch (error) {
        console.error("Wallet connection failed:", error);
        return null;
    }
};

// Contract instance banane ka function
export const getIncidentContract = async (signer: ethers.Signer) => {
    return new ethers.Contract(INCIDENT_CONTRACT_ADDRESS, INCIDENT_CONTRACT_ABI, signer);
};