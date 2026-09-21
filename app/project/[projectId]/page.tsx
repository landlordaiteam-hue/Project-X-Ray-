import Link from 'next/link';

const projectCatalog: Record<string, { name: string; code: string; status: string; members: string[] }> = {
  'alpha-tower': {
    name: 'Alpha Tower',
    code: 'AT-101',
    status: 'Active',
    members: ['Alicia Stone', 'Marcus Hall', 'Jenna Patel']
  },
  'northline-logistics': {
    name: 'Northline Logistics',
    code: 'NL-220',
    status: 'Planning',
    members: ['Nia Brooks', 'Rafael Chen']
  },
  'harbor-suites': {
    name: 'Harbor Suites',
    code: 'HS-310',
    status: 'On hold',
    members: ['Priya Shah', 'Omar Grant', 'Leah Flores']
  }
};

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const project = projectCatalog[params.projectId] ?? {
    name: 'Unknown project',
    code: 'N/A',
    status: 'Unknown',
    members: []
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-blue-300">Project workspace</p>
            <h1 className="mt-3 text-4xl font-bold">{project.name}</h1>
          </div>
          <Link href="/" className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500">
            Back home
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Status</p>
            <p className="mt-2 text-2xl font-semibold">{project.status}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Code</p>
            <p className="mt-2 text-2xl font-semibold">{project.code}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Members</p>
            <p className="mt-2 text-2xl font-semibold">{project.members.length}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Project members</h2>
          <div className="mt-4 space-y-3">
            {project.members.map((member) => (
              <div key={member} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3">
                <div>
                  <p className="font-medium">{member}</p>
                  <p className="text-sm text-slate-400">Project team member</p>
                </div>
                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-wide text-blue-300">
                  Assigned
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
