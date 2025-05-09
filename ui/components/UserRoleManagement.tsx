// import type React from "react"
// import { useQuery, useMutation, useQueryClient } from "react-query"
// import { fetchUsers, updateUserRole } from "../api/users"
// import { Loader2 } from "lucide-react"
// import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./ui/select"
// import { toast } from "./ui/use-toast"

// export const UserRoleManagement: React.FC = () => {
//   const queryClient = useQueryClient()
//   const { data: users, isLoading, error } = useQuery("users", fetchUsers)

//   const mutation = useMutation(({ userId, role }: { userId: string; role: string }) => updateUserRole(userId, role), {
//     onSuccess: () => {
//       queryClient.invalidateQueries("users")
//       toast({
//         title: "Success",
//         description: "User role updated",
//         variant: "default",
//       })
//     },
//     onError: () => {
//       toast({
//         title: "Error",
//         description: "Failed to update user role",
//         variant: "destructive",
//       })
//     },
//   })

//   if (isLoading) {
//     return <Loader2 className="h-8 w-8 animate-spin" />
//   }

//   if (error) {
//     toast({
//       title: "Error",
//       description: "Failed to load users",
//       variant: "destructive",
//     })
//     return <div>Error loading users</div>
//   }

//   const handleRoleChange = (userId: string, newRole: string) => {
//     mutation.mutate({ userId, role: newRole })
//   }

//   return (
//     <div className="space-y-4">
//       {users.map((user: any) => (
//         <div key={user.id} className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
//           <div>
//             <h3 className="font-bold text-lg">{user.name}</h3>
//             <p className="text-gray-600">{user.email}</p>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Select value={user.role} onValueChange={(newRole) => handleRoleChange(user.id, newRole)}>
//               <SelectTrigger className="w-[180px]">
//                 <SelectValue placeholder="Select a role" />
//               </SelectTrigger>
//               <SelectContent className="bg-white text-black">
//                 <SelectItem value="report-only">Report Only</SelectItem>
//                 <SelectItem value="reviewer">Reviewer</SelectItem>
//                 <SelectItem value="manager">Manager</SelectItem>
//                 <SelectItem value="admin">Admin</SelectItem>
//               </SelectContent>
//             </Select>
//             {mutation.isLoading && mutation.variables?.userId === user.id && (
//               <Loader2 className="h-4 w-4 animate-spin" />
//             )}
//           </div>
//         </div>
//       ))}
//     </div>
//   )
// }

