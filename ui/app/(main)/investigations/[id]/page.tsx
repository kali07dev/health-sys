// "use client"

// import { useState, useEffect } from "react"
// import { useRouter } from "next/router"
// import { ViewInvestigation } from "@/components/Investigations/view-investigation"
// import { EditInvestigationForm } from "@/components/Investigations/edit-investigation-form"
// import { Button } from "@/components/ui/button"
// import type { Investigation } from "@/interfaces/investigation"

// export default function InvestigationDetailPage() {
//   const router = useRouter()
//   const { id } = router.query
//   const [investigation, setInvestigation] = useState<Investigation | null>(null)
//   const [isEditing, setIsEditing] = useState(false)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const fetchInvestigation = async () => {
//       if (!id) return

//       try {
//         // Replace this with your actual API call
//         const response = await fetch(`/api/investigations/${id}`)
//         const data = await response.json()
//         setInvestigation(data)
//       } catch (error) {
//         console.error("Failed to fetch investigation:", error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchInvestigation()
//   }, [id])

//   const handleEditSuccess = (updatedInvestigation: Investigation) => {
//     setInvestigation(updatedInvestigation)
//     setIsEditing(false)
//   }

//   if (loading) {
//     return <div>Loading...</div>
//   }

//   if (!investigation) {
//     return <div>Investigation not found</div>
//   }

//   return (
//     <div className="container mx-auto py-8">
//       <h1 className="text-2xl font-bold mb-6">Investigation Details</h1>
//       {isEditing ? (
//         <EditInvestigationForm 
//             investigation={investigation} 
//             onSuccess={handleEditSuccess} />
//       ) : (
//         <>
//           <ViewInvestigation investigation={investigation} />
//           <Button onClick={() => setIsEditing(true)} className="mt-4">
//             Edit Investigation
//           </Button>
//         </>
//       )}
//       <Button onClick={() => router.push("/investigations")} className="mt-4 ml-4">
//         Back to Investigations
//       </Button>
//     </div>
//   )
// }

