import React, { useState } from 'react';
import { connectWallet, getIncidentContract } from '../utils/web3';

export const IncidentForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // File select handle karna
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Form submit karna
  const reportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select an image/video first!');
      return;
    }

    setLoading(true);
    setStatus('Connecting to Wallet...');

    try {
      // 1. MetaMask Wallet Connect Karein
      const signer = await connectWallet();
      if (!signer) {
        setStatus('Wallet connection failed.');
        setLoading(false);
        return;
      }

      // 2. Mock IPFS Upload (Abhi ke liye backend API ka dummy wait)
      // Real app mein aap yahan apne Python backend ko image bhejenge
      setStatus('Uploading evidence securely to IPFS...');
      await new Promise((resolve) => setTimeout(resolve, 2000)); 
      const mockIpfsHash = "QmTestHash1234567890ABCDEF"; // Dummy Hash

      // 3. Smart Contract se connect karein
      setStatus('Saving to Blockchain... Please confirm in MetaMask');
      const contract = await getIncidentContract(signer);
      
      // Dummy data for DID and Location
      const touristDid = "DID:Tourist:987654";
      const geoCoords = "Lat: 18.5204, Long: 73.8567";

      // 4. Contract ka function call karein
      const tx = await contract.reportIncident(touristDid, mockIpfsHash, geoCoords);
      setStatus('Transaction sent! Waiting for confirmation...');
      
      // Transaction complete hone ka wait karein
      await tx.wait();
      
      setStatus(`✅ Incident Reported Successfully! TX: ${tx.hash.substring(0, 15)}...`);
      setFile(null);

    } catch (error: any) {
      console.error(error);
      setStatus(`❌ Error: ${error.message || 'Transaction failed'}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-red-600">🚨 Report Emergency</h2>
      <p className="text-gray-600 mb-6">Your evidence will be securely saved on the blockchain.</p>
      
      <form onSubmit={reportIncident} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Upload Evidence (Photo/Video)</label>
          <input 
            type="file" 
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full text-white font-bold py-2 px-4 rounded ${loading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {loading ? 'Processing...' : 'Submit to Blockchain'}
        </button>
      </form>

      {status && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md text-sm text-gray-800 font-mono">
          {status}
        </div>
      )}
    </div>
  );
};

export default IncidentForm;