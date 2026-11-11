"use client";

import Link from "next/link"
import { usePathname } from "next/navigation";

const ITEMS = [
    { label: "Home", href: "/dashboard", exact: true},
    { label: "Daftar Lomba", href: "/dashboard/daftar-lomba" },
    { label: "Daftar Event", href: "/dashboard/daftar-event" },
    { label: "Profil", href: "/dashboard/profile"},
];

export default function DashboardSidebar() {
    const pathname = usePathname();

    return (
        <aside className="
        w-full 
        shrink-0 
        pl-4
        md:w-60
        md:pl-6
        
        ">
             <h1 className="mb-4 font-[family-name:var(--font-mono)] text-2xl font-bold text-white md:mb-6">
                Dashboard
            </h1>
            <nav
                aria-label="Dashboard"
                className="flex gap-2 overflow-x-auto md:sticky md:top-24 md:flex-col"
            >
                {ITEMS.map(({ label, href, exact }) => {
                    const active = exact
                        ? pathname === href
                        : pathname === href || pathname.startsWith(`${href}/`)
                    return (
                        <Link
                            key={href}
                            href={href}
                            aria-current={active ? "page" : undefined}
                            className={`
                                flex items-center
                                gap-3
                                whitespace-nowrap 
                                rounded-xl
                                border
                                px-4 
                                py-3 
                                font-[family-name:var(--font-mono)]
                                text-sm 
                                font-medium 
                                text-white
                                transition-colors
                                hover:border-white/40
                                active:bg-white/20
                                ${
                                    active
                                        ? "border-transparent bh-white/15"
                                        : "border-transparent"
                                }
                            }`}
                        >
                            {label}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}