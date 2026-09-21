import Link from 'next/link';

const projects = [
  { name: 'Alpha Tower', code: 'AT-101', status: 'Active', href: '/project/alpha-tower' },
  { name: 'Northline Logistics', code: 'NL-220', status: 'Planning', href: '/project/northline-logistics' },
  { name: 'Harbor Suites', code: 'HS-310', status: 'On hold', href: '/project/harbor-suites' }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-blue-300">Capital X-RAY</p>
            <h1 className="mt-3 text-4xl font-bold">Operations workspace</h1>
          </div>
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500">
            New project
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.name}
              href={project.href}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30 transition hover:border-blue-600 hover:bg-slate-800"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{project.code}</p>
              <h2 className="mt-3 text-2xl font-semibold">{project.name}</h2>
              <p className="mt-4 text-sm text-slate-300">Status: {project.status}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
