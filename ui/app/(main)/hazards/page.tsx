import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { HazardsTable } from "@/components/Hazards/landing";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { hazardAPI } from '@/utils/hazardAPI';
import { authOptions } from "@/app/api/auth/auth-options";

// Define types for better type safety
interface Session {
    user: {
        id: string;
        email: string;
    };
    token: string;
    role: string;
}

// interface HazardsPageProps {
//     searchParams: {
//         page?: string;
//         pageSize?: string;
//     };
// }

const fetchHazards = async (page = 1, pageSize = 10) => {
    try {
        const response = await hazardAPI.getAllHazardsFiltered({ page, pageSize });
        return response;
    } catch (error) {
        console.error("Error fetching hazards:", error);
        throw error;
    }
};

const HazardsContent = async ({ userRole }: { userRole: string }) => {
    const page = 1;
    const pageSize = 10;

    const hazardsData = await fetchHazards(page, pageSize);
    
    return (
        <HazardsTable
            initialHazards={hazardsData.data || []}
            userRole={userRole}
            totalHazards={hazardsData.total || 0}
            initialPage={page}
            totalPages={Math.ceil((hazardsData.total || 0) / pageSize)}
            pageSize={pageSize}
        />
    );
};

export default async function HazardsPage() {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session) {
        redirect('/auth/signin');
    }

    return (
        <div className="container mx-auto py-6">
            {/* <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Hazards Management</h1>
            </div> */}
            
            <Suspense fallback={<TableSkeleton />}>
                <HazardsContent userRole={session.role} />
            </Suspense>
        </div>
    );
}

