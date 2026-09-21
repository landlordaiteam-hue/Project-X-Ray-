import Link from 'next/link';
import { getProjectById } from '@/lib/project-data';

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const project = await getProjectById(params.projectId);

  if (!project) {
    return <main className="min-h-screen bg-slate-950 p-8 text-slate-100"><div className="mx-auto max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-8"><p className="text-sm uppercase tracking-[0.2em] text-blue-300">Project workspace</p><h1 className="mt-3 text-3xl font-bold">Project not found</h1><Link href="/" className="mt-6 inline-block rounded-md border border-slate-700 px-4 py-2 text-sm">Back home</Link></div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.25em] text-blue-300">Project workspace</p><h1 className="mt-3 text-4xl font-bold">{project.name}</h1></div><Link href="/" className="rounded-md border border-slate-700 px-4 py-2 text-sm">Back home</Link></div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">Status</p><p className="mt-2 text-2xl font-semibold capitalize">{project.status.replace('_', ' ')}</p></div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">Code</p><p className="mt-2 text-2xl font-semibold">{project.code}</p></div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">Members</p><p className="mt-2 text-2xl font-semibold">{project.members.length}</p></div>
        </div>
        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Project overview</h2><p className="mt-3 text-slate-300">{project.summary}</p><h2 className="mt-8 text-xl font-semibold">Project members</h2><div className="mt-4 space-y-3">{project.members.map((member) => <div key={member.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3"><div><p className="font-medium">{member.name}</p><p className="text-sm capitalize text-slate-400">{member.role.replace('_', ' ')}</p></div><span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-wide text-blue-300">{member.role}</span></div>)}</div></section>
      </div>
    </main>
  );
}
