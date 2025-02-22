import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import PageHeader from '@/components/PageHeader'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-full bg-gray-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col sm:pl-64">
          <AppHeader />
          <main className="flex-1">
            <PageHeader />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}