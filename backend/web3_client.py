import os
import json
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545") 
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

CONTRACT_ABI = json.loads('''[
    {
        "inputs": [
            {"internalType": "uint256", "name": "_incidentId", "type": "uint256"},
            {"internalType": "bool", "name": "_status", "type": "bool"}
        ],
        "name": "verifyIncident",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]''')

def verify_incident_on_chain(incident_id: int, is_verified: bool):
    """
    Called after AI incident verification to update the status in the IncidentRegistry smart contract.
    """
    try:
        from web3 import Web3
        w3 = Web3(Web3.HTTPProvider(RPC_URL))
        if not w3.is_connected() or not PRIVATE_KEY or PRIVATE_KEY == "your_admin_wallet_private_key_here":
            print("[Web3 Client] Local chain offline or no private key configured. Simulating on-chain verification.")
            return f"0xsimulated_tx_{incident_id}_{int(is_verified)}"

        account = w3.eth.account.from_key(PRIVATE_KEY)
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
        
        tx = contract.functions.verifyIncident(incident_id, is_verified).build_transaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address),
            'gas': 2000000,
            'gasPrice': w3.eth.gas_price
        })
        
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        tx_hash_hex = w3.to_hex(tx_hash)
        print(f"[Web3 Client] Blockchain verification successful! TX Hash: {tx_hash_hex}")
        return tx_hash_hex
        
    except Exception as e:
        print(f"[Web3 Client] Blockchain transaction failed: {e}")
        return f"0xsimulated_tx_err_{incident_id}"
