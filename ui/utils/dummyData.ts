// import { v4 as uuidv4 } from "uuid"

export interface Incident {
  id: string
  referenceNumber: string
  type: "injury" | "near_miss" | "property_damage" | "environmental" | "security"
  severityLevel: "low" | "medium" | "high" | "critical"
  status: "new" | "investigating" | "action_required" | "resolved" | "closed"
  title: string
  description: string
  location: string
  occurredAt: string
  reportedBy: string
  userReported: string
  assignedTo?: string
  immediateActionsTaken?: string
  witnesses?: string[]
  environmentalConditions?: Record<string, string>
  equipmentInvolved?: string[]
  createdAt: string
  updatedAt: string
  closedAt?: string
}

// export const generateDummyIncidents = (count: number): Incident[] => {
//   const incidents: Incident[] = []
//   for (let i = 0; i < count; i++) {
//     incidents.push({
//       id: uuidv4(),
//       referenceNumber: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
//       type: ["injury", "near_miss", "property_damage", "environmental", "security"][
//         Math.floor(Math.random() * 5)
//       ] as Incident["type"],
//       severityLevel: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)] as Incident["severityLevel"],
//       status: ["new", "investigating", "action_required", "resolved", "closed"][
//         Math.floor(Math.random() * 5)
//       ] as Incident["status"],
//       title: `Incident ${i + 1}`,
//       description: `This is a description for incident ${i + 1}`,
//       location: `Location ${i + 1}`,
//       occurredAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
//       reportedBy: uuidv4(),
//       assignedTo: Math.random() > 0.5 ? uuidv4() : undefined,
//       immediateActionsTaken: Math.random() > 0.5 ? `Immediate actions for incident ${i + 1}` : undefined,
//       witnesses: Math.random() > 0.5 ? ["John Doe", "Jane Smith"] : undefined,
//       environmentalConditions: Math.random() > 0.5 ? { weather: "Sunny", temperature: "25°C" } : undefined,
//       equipmentInvolved: Math.random() > 0.5 ? ["Machine A", "Tool B"] : undefined,
//       createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
//       updatedAt: new Date().toISOString(),
//       closedAt: Math.random() > 0.8 ? new Date().toISOString() : undefined,
//     })
//   }
//   return incidents
// }

