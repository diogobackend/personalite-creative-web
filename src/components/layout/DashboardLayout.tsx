"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import Sidebar from "./Sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setAuthenticated(true);
  }, [router]);

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-[#f8f6f2] text-[#342d27]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] lg:block">
        <Sidebar close={() => setSidebarOpen(false)} />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <aside className="relative h-full w-[280px] max-w-[85vw]">
            <Sidebar close={() => setSidebarOpen(false)} />

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-4 top-4 text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:ml-[260px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-4 border-b border-[#ece6dc] bg-white/95 px-5 backdrop-blur-sm sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setSidebarOpen(true)}
              className="text-stone-600 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden items-center gap-3 rounded-xl border border-[#ece6dc] bg-[#faf9f7] px-4 py-2.5 md:flex">
              <Search className="h-4 w-4 text-stone-400" />
              <span className="pr-12 text-sm text-stone-400">
                Buscar no sistema...
              </span>
            </div>

            <span className="truncate font-serif text-xl lg:hidden">
              Personalité Creative
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-stone-400 sm:inline">
              Painel administrativo
            </span>
            <div className="h-7 w-px bg-[#ece6dc]" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3eadb] text-xs font-bold text-[#9c7e4e]">
              PC
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] space-y-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}