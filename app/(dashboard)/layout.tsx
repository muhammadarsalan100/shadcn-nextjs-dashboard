"use client";
import { useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { AuthGuard } from "@/components/shared/auth-guard";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

	return (
		<AuthGuard>
			<div className="relative flex h-screen overflow-hidden bg-background">
				{/* Sidebar */}
				<Sidebar
					isMobileOpen={isMobileSidebarOpen}
					onMobileClose={() => setIsMobileSidebarOpen(false)}
				/>

				{/* Main Content */}
				<div className="flex-1 min-w-0 overflow-auto">
					<Topbar onMenuClick={() => setIsMobileSidebarOpen(true)} />
					<main className="p-4 sm:p-6 lg:p-8">
						<div className="min-h-[calc(100vh-8rem)]">{children}</div>
					</main>
				</div>
			</div>
		</AuthGuard>
	);
}
