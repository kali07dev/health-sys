// app/dashboard/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { redirect } from "next/navigation";
import IncidentTrendsDashboard from "./adminDash";
import EmployeeDashboard from "./empDash";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const role = session?.role;
  const userID = session.user?.id;


  return (
    <div>
      {role === "admin" && <IncidentTrendsDashboard />}
      {role === "manager" && <IncidentTrendsDashboard />}
      {role === "safety_officer" && <IncidentTrendsDashboard />}
      {role === "employee" && <EmployeeDashboard userID={userID} />}
    </div>
  );
}