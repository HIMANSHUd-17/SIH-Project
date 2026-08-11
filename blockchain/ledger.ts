type EmergencyAccessLog = {
  accessedBy: string;
  reason: string;
  timestamp: number;
};

export type BlockchainIdentityRecord = {
  did: string;
  piiHash: string;
  verificationTimestamp: number;
  blockNumber: number;
  txHash: string;
  issuer: string;
  isVerified: boolean;
  emergencyAccessLog: EmergencyAccessLog[];
};

const blockchainRecords: Record<string, BlockchainIdentityRecord> = {
  'did:nagarjuna:polygon:0x71C7656EC7ab88b098defB751B7401B5f6d8976F': {
    did: 'did:nagarjuna:polygon:0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    piiHash: '0xa498f3214b72ef31890cd123490aafe78291039bc029384721ab',
    verificationTimestamp: Date.now() - 86400000 * 3,
    blockNumber: 4891203,
    txHash: '0x99a12c458129e0123fba90123891230129bc8192301923',
    issuer: 'Uttarakhand Tourism Authority Trust Node',
    isVerified: true,
    emergencyAccessLog: [],
  },
};

function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function registerBlockchainIdentity(): BlockchainIdentityRecord {
  const pseudoRandomHash = `0x${randomHex(40)}`;
  const did = `did:nagarjuna:polygon:${pseudoRandomHash.slice(0, 22)}`;

  const record: BlockchainIdentityRecord = {
    did,
    piiHash: pseudoRandomHash,
    verificationTimestamp: Date.now(),
    blockNumber: 4892000 + Math.floor(Math.random() * 500),
    txHash: `0x${randomHex(64)}`,
    issuer: 'NAGARJUNA Decentralized Safety Authority (Polygon Anchor)',
    isVerified: true,
    emergencyAccessLog: [],
  };

  blockchainRecords[did] = record;
  return record;
}

export function verifyBlockchainIdentity(did: string): BlockchainIdentityRecord | undefined {
  const record = blockchainRecords[did];
  if (!record) return undefined;

  record.emergencyAccessLog.push({
    accessedBy: 'Authority Admin Command Center (Verified Officer)',
    reason: 'Emergency Identity Verification',
    timestamp: Date.now(),
  });

  return record;
}
