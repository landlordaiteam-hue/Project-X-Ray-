export default function ProjectPage({ params }: { params: { projectId: string } }) {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-300">Project workspace</p>
        <h1 className="mt-3 text-3xl font-bold">Project {params.projectId}</h1>
        <p className="mt-4 text-slate-300">
          This is the project detail page shell for the Phase 2 workspace foundation.
        </p>
      </div>
    </main>
  );
}
