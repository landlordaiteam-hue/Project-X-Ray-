import Link from 'next/link';
import { getProjectList } from '@/lib/project-data';

export default async function HomePage() {
  const projects = await getProjectList();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-blue-300">Capital X-RAY</p>
            <h1 className="mt-3 text-4xl font-bold">Operations workspace</h1>
          </div>
          <span className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-400">Phase 2</span>
        </header>

        <section aria-labelledby="projects-heading">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 id="projects-heading" className="text-xl font-semibold">Projects</h2>
              <p className="mt-1 text-sm text-slate-400">Select a workspace to view its operating details.</p>
            </div>
            <span className="text-sm text-slate-400">{projects.length} total</span>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`} className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30 transition hover:border-blue-600 hover:bg-slate-800">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{project.code}</p>
                <h3 className="mt-3 text-2xl font-semibold">{project.name}</h3>
                <p className="mt-2 text-sm text-slate-300">{project.summary}</p>
                <p className="mt-4 text-sm capitalize text-blue-300">{project.statusLabel}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
