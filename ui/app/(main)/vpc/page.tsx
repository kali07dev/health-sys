// src/app/vpc/page.tsx (Modified)
"use client"; // This page now needs to manage modal state, so it becomes a client component

import { Suspense, useState, useEffect } from "react"; // Added useState, useEffect
// import { getServerSession } from "next-auth/next" // Cannot use in client component
// import { redirect } from "next/navigation" // Cannot use in client component
// import { authOptions } from "@/app/api/auth/auth-options" // Cannot use in client component
import { useSession } from "next-auth/react"; // Use client-side session hook
import { useRouter } from "next/navigation"; // For client-side navigation

import VPCView from "@/components/view/VPCView";
import { VPCSkeleton } from "@/components/view/VPCSkeleton";
import InfoPanel from "@/components/ui/InfoPanel";
import { ClipboardList, Plus, FileText as ReportIcon } from "lucide-react"; // Added ReportIcon
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ReportGenerationModal from "@/components/reports/ReportGenerationModal"; // Import the modal

// This component will wrap the part that needs session data
function VPCPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return; // Wait for session to load
    if (!session) {
      router.push("/auth/login");
    } else if (session.role === "employee") {
      router.push("/vpc/create");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || session.role === "employee") {
    // Render a loading state or null while redirecting or session is loading
    // Or use VPCSkeleton here too if appropriate for the whole page load
    return <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center"><VPCSkeleton /></div>;
  }
  
  const userRole = session.role;
  const userId = session.user?.id;

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <InfoPanel
        title="Visible Person Commitment (VPC) Management"
        icon={<ClipboardList className="h-6 w-6 text-red-600" />}
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          This section lists all VPCs in the system. You can view details, search, and manage commitments.
          Generate comprehensive reports to analyze safety trends and performance.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link href="/vpc/create">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create New VPC
            </Button>
          </Link>
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white text-red-600 border-red-500 hover:bg-red-50 hover:text-red-700 shadow-sm"
            onClick={() => setIsReportModalOpen(true)}
          >
            <ReportIcon className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </InfoPanel>

      <Suspense fallback={<VPCSkeleton />}>
        {/* Pass session data directly if VPCView needs it. For this example, it's props. */}
        <VPCView userId={userId!} userRole={userRole!} />
      </Suspense>

      <ReportGenerationModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        // vpcIdToReport can be set if you want to pre-fill from a specific VPC context
      />
    </div>
  );
}

// Main export for the page route
export default function VPCPage() {
  // The useSession hook must be used in a component wrapped with <SessionProvider>
  // Usually, SessionProvider is in your _app.tsx or a layout component.
  // For this page to use useSession, it must be a client component or its content must be.
  return <VPCPageContent />;
}