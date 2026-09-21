import Link from 'next/link';

const modules = [
  { name: 'Project overview', status: 'implemented' },
  { name: 'Project members', status: 'implemented' },
  { name: 'Schedule', status: 'not implemented' },
  { name: 'Payroll', status: 'not implemented' },
  { name: 'Purchasing', status: 'not implemented' },
  { name: 'RFIs', status: 'not implemented' },
  { name: 'Safety', status: 'not implemented' },
  { name: 'Xena', status: 'planned' }
];

export default function ProjectWorkspacePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-300">Project workspace</p>
            <h1 className="mt-2 text-3xl font-bold">Alpha Tower</h1>
          </div>
          <Link href="/" className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200">Back to home</Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
          <aside className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Navigation</h2>
            <nav className="space-y-2">
              {modules.map((module) => (
                <div key={module.name} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                  <span>{module.name}</span>
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">{module.status}</span>
                </div>
              ))}
            </nav>
          </aside>

          <section className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Overview</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><p className="text-sm text-slate-400">Status</p><p className="mt-2 text-2xl font-semibold">Active</p></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><p className="text-sm text-slate-400">Code</p><p className="mt-2 text-2xl font-semibold">AT-101</p></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><p className="text-sm text-slate-400">Members</p><p className="mt-2 text-2xl font-semibold">3</p></div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Project members</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3"><div><p className="font-medium">Alicia Stone</p><p className="text-sm text-slate-400">Project Manager</p></div><span className="text-xs uppercase tracking-wide text-blue-300">project_manager</span></div>
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3"><div><p className="font-medium">Marcus Hall</p><p className="text-sm text-slate-400">Foreman</p></div><span className="text-xs uppercase tracking-wide text-blue-300">field_staff</span></div>
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3"><div><p className="font-medium">Jenna Patel</p><p className="text-sm text-slate-400">Executive Admin</p></div><span className="text-xs uppercase tracking-wide text-blue-300">exec_admin</span></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
