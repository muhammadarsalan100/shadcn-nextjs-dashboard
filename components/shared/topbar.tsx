"use client";
import { Bell, Menu, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppSwitcher } from "./app-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { getUser, logout } from "@/lib/auth";
import { useEffect, useState } from "react";
import type { User } from "@/lib/auth";
import { cn } from "@/lib/utils";



interface TopbarProps {
	onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
	const [user, setUser] = useState<User | null>(null);
	const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

	useEffect(() => {
		setUser(getUser());
	}, []);

	const handleLogout = () => {
		logout();
	};

	const getUserInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			{/* Mobile: expanded search overlay */}
			<div
				className={cn(
					"h-16 items-center gap-2 px-3",
					isMobileSearchOpen ? "flex sm:hidden" : "hidden",
				)}
			>
				<div className="relative flex-1 min-w-0">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						autoFocus
						type="search"
						placeholder="Search anything..."
						className="pl-10 pr-4 py-2 h-10 w-full bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
					/>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 shrink-0 hover:bg-muted transition-colors"
					aria-label="Close search"
					onClick={() => setIsMobileSearchOpen(false)}
				>
					<X className="h-5 w-5" />
				</Button>
			</div>

			{/* Default bar */}
			<div
				className={cn(
					"h-16 items-center justify-between gap-2 px-3 sm:px-6",
					isMobileSearchOpen ? "hidden sm:flex" : "flex",
				)}
			>
			{/* Mobile menu toggle */}
			<Button
				variant="ghost"
				size="icon"
				className="h-9 w-9 shrink-0 hover:bg-muted transition-colors md:hidden"
				aria-label="Open menu"
				onClick={onMenuClick}
			>
				<Menu className="h-5 w-5" />
			</Button>

			{/* Search */}
			<div className="flex items-center max-w-2xl flex-1 min-w-0">
				{/* Mobile: icon-only trigger */}
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 shrink-0 hover:bg-muted transition-colors sm:hidden"
					aria-label="Open search"
					onClick={() => setIsMobileSearchOpen(true)}
				>
					<Search className="h-5 w-5" />
				</Button>
				{/* sm+: full search input */}
				<div className="hidden sm:flex w-full max-w-lg relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search anything..."
						className="pl-10 pr-4 py-2 h-10 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
					/>
				</div>
			</div>

			{/* Right Section */}
			<div className="flex items-center gap-1 sm:gap-3 shrink-0">
				{/* App Switcher */}
				<div className="hidden sm:block">
					<AppSwitcher />
				</div>

				{/* Theme Toggle */}
				<ThemeToggle />

				{/* Notifications */}
				<Button
					variant="ghost"
					size="icon"
					className="relative h-9 w-9 hover:bg-muted transition-colors hidden sm:inline-flex"
					aria-label="Notifications"
				>
					<Bell className="h-4 w-4" />
					<span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
						3
					</span>
				</Button>

				{/* Profile */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="relative h-9 w-9 rounded-full hover:bg-muted transition-colors"
						>
							<Avatar className="h-8 w-8 ring-2 ring-background">
								<AvatarImage src="/avatar.png" alt={user?.name || "User"} />
								<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
									{user?.name ? getUserInitials(user.name) : "AD"}
								</AvatarFallback>
							</Avatar>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-64 p-2" align="end" forceMount>
						<DropdownMenuLabel className="font-normal p-3">
							<div className="flex items-center gap-3">
								<Avatar className="h-10 w-10">
									<AvatarImage src="/avatar.png" alt={user?.name || "User"} />
									<AvatarFallback className="bg-primary text-primary-foreground">
										{user?.name ? getUserInitials(user.name) : "AD"}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium leading-none">
										{user?.name || "Admin"}
									</p>
									<p className="text-xs leading-none text-muted-foreground">
										{user?.email || "admin@example.com"}
									</p>
									{user?.role && (
										<p className="text-xs leading-none text-primary font-semibold mt-1">
											{user.role.toUpperCase()}
										</p>
									)}
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator className="my-2" />
						<DropdownMenuItem className="p-3 cursor-pointer hover:bg-muted rounded-md transition-colors">
							<span className="flex items-center gap-2">👤 Profile</span>
						</DropdownMenuItem>
						<DropdownMenuItem className="p-3 cursor-pointer hover:bg-muted rounded-md transition-colors">
							<span className="flex items-center gap-2">⚙️ Settings</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator className="my-2" />
						<DropdownMenuItem
							onClick={handleLogout}
							className="p-3 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
						>
							<span className="flex items-center gap-2">🚪 Log out</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
		</div>
	);
}
