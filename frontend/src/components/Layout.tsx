import type { ReactNode } from "react"
import { Route } from "lucide-react"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Route size={20} />
          </span>
          <div>
            <p className="text-lg font-semibold leading-tight text-slate-900">RideMate</p>
            <p className="text-xs leading-tight text-slate-500">Partner Onboarding</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
