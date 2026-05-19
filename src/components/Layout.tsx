import { ReactNode } from 'react';

export function Layout({ children, sidebar }: { children: ReactNode; sidebar?: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-ocean-950 font-sans selection:bg-electric-500/30 selection:text-white">
      {sidebar && (
        <aside className="w-80 flex-shrink-0 bg-ocean-950/50 text-white flex flex-col hidden lg:flex border-r border-white/5">
          {sidebar}
        </aside>
      )}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-electric-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />
        
        {children}
      </main>
    </div>
  );
}
