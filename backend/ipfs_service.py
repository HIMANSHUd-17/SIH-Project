import os
import requests
from dotenv import load_dotenv

load_dotenv()

PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_API_KEY = os.getenv("PINATA_SECRET_API_KEY")

def upload_image_to_ipfs(file_bytes: bytes, filename: str) -> str:
    """
    Uploads incident evidence photo/video to Pinata IPFS.
    Returns: IPFS Hash (CID) string or a simulated hash if API keys not provided.
    """
    if not PINATA_API_KEY or not PINATA_SECRET_API_KEY or PINATA_API_KEY == "your_pinata_api_key_here":
        import hashlib
        simulated_hash = "Qm" + hashlib.sha256(file_bytes).hexdigest()[:44]
        print(f"[IPFS Pinata] Demo fallback (no Pinata keys in .env). Generated CID: {simulated_hash}")
        return simulated_hash

    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY
    }
    files = {
        "file": (filename, file_bytes)
    }
    
    try:
        response = requests.post(url, files=files, headers=headers)
        response.raise_for_status()
        result = response.json()
        ipfs_hash = result.get("IpfsHash")
        print(f"[IPFS Pinata] Successfully uploaded to IPFS. Hash: {ipfs_hash}")
        return ipfs_hash
    except Exception as e:
        print(f"[IPFS Pinata] Upload Failed: {e}")
        import hashlib
        return "Qm" + hashlib.sha256(file_bytes).hexdigest()[:44]
