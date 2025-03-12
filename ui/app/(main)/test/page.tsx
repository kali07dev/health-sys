// // app/view/page.tsx
// "use client";

// import { useState, useEffect } from "react";
// import DashboardLayout from "@/components/AdminDashboard";
// import { IncidentTrendsData } from "@/types"; // Define this type based on your backend response

// export default function ViewPage() {
//   const [data, setData] = useState<IncidentTrendsData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await fetch("/api/incident-trends");
//         if (!response.ok) {
//           throw new Error("Failed to fetch data");
//         }
//         const result = await response.json();
//         setData(result);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : "An error occurred");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

//   return (
//     <DashboardLayout>
//       <div className="p-6">
//         <h1 className="text-2xl font-bold mb-6">Incident Trends Report</h1>

//         {/* Common Hazards Section */}
//         <section className="mb-8">
//           <h2 className="text-xl font-semibold mb-4">Common Hazards</h2>
//           <div className="bg-white shadow rounded-lg p-4">
//             <table className="min-w-full">
//               <thead>
//                 <tr>
//                   <th className="text-left">Type</th>
//                   <th className="text-left">Frequency</th>
//                   <th className="text-left">Risk Score</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data?.commonHazards.map((hazard, index) => (
//                   <tr key={index}>
//                     <td>{hazard.type}</td>
//                     <td>{hazard.frequency}</td>
//                     <td>{hazard.riskScore.toFixed(2)}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </section>

//         {/* Monthly Trends Section */}
//         <section className="mb-8">
//           <h2 className="text-xl font-semibold mb-4">Monthly Trends</h2>
//           <div className="bg-white shadow rounded-lg p-4">
//             <table className="min-w-full">
//               <thead>
//                 <tr>
//                   <th className="text-left">Month</th>
//                   <th className="text-left">Incident Count</th>
//                   <th className="text-left">Severity Score</th>
//                   <th className="text-left">Resolved Count</th>
//                   <th className="text-left">New Hazards</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data?.trendsByMonth.map((trend, index) => (
//                   <tr key={index}>
//                     <td>{new Date(trend.month).toLocaleDateString()}</td>
//                     <td>{trend.incidentCount}</td>
//                     <td>{trend.severityScore.toFixed(2)}</td>
//                     <td>{trend.resolvedCount}</td>
//                     <td>{trend.newHazards}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </section>

//         {/* Risk Patterns Section */}
//         <section className="mb-8">
//           <h2 className="text-xl font-semibold mb-4">Risk Patterns</h2>
//           <div className="bg-white shadow rounded-lg p-4">
//             <table className="min-w-full">
//               <thead>
//                 <tr>
//                   <th className="text-left">Category</th>
//                   <th className="text-left">Frequency</th>
//                   <th className="text-left">Severity</th>
//                   <th className="text-left">Departments</th>
//                   <th className="text-left">Root Causes</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data?.riskPatterns.map((pattern, index) => (
//                   <tr key={index}>
//                     <td>{pattern.category}</td>
//                     <td>{pattern.frequency}</td>
//                     <td>{pattern.severity}</td>
//                     <td>{pattern.departments.join(", ")}</td>
//                     <td>{pattern.rootCauses.join(", ")}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </section>

//         {/* Recurring Issues Section */}
//         <section className="mb-8">
//           <h2 className="text-xl font-semibold mb-4">Recurring Issues</h2>
//           <div className="bg-white shadow rounded-lg p-4">
//             <table className="min-w-full">
//               <thead>
//                 <tr>
//                   <th className="text-left">Description</th>
//                   <th className="text-left">Frequency</th>
//                   <th className="text-left">Last Occurred</th>
//                   <th className="text-left">Status</th>
//                   <th className="text-left">Priority</th>
//                   <th className="text-left">Locations</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data?.recurringIssues.map((issue, index) => (
//                   <tr key={index}>
//                     <td>{issue.description}</td>
//                     <td>{issue.frequency}</td>
//                     <td>{new Date(issue.lastOccurred).toLocaleDateString()}</td>
//                     <td>{issue.status}</td>
//                     <td>{issue.priority}</td>
//                     <td>{issue.locations.join(", ")}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </section>
//       </div>
//     </DashboardLayout>
//   );
// }