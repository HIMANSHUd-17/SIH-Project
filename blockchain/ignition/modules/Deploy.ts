import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("IncidentModule", (m) => {
  // Contract deploy karna
  const incidentRegistry = m.contract("IncidentRegistry");
  
  return { incidentRegistry };
});