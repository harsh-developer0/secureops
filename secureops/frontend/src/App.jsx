import { useEffect, useState } from "react";
import { Overview, Pipeline, Security, Monitoring, Deployments, Rollback } from "./pages.jsx";

const nav = [
  ["Overview", Overview], ["Pipeline", Pipeline], ["Security", Security],
  ["Monitoring", Monitoring], ["Deployments", Deployments], ["Rollback", Rollback],
];

export default function App() {
  const [page, setPage] = useState("Overview");
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const Page = nav.find(([n]) => n === page)[1];

  return (
    <div className="min-h-screen md:flex">
      <aside className={`${open ? "block" : "hidden"} border-b border-slate-200 bg-white p-4 md:block md:min-h-screen md:w-56 md:border-b-0 md:border-r dark:border-slate-800 dark:bg-slate-900`}>
        <p className="mb-4 hidden text-lg font-semibold md:block">SecureOps</p>
        <nav className="space-y-1">
          {nav.map(([name]) => (
            <button key={name} onClick={() => { setPage(name); setOpen(false); }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${page === name ? "bg-teal-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
              {name}
            </button>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <button className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
            <h1 className="font-semibold">{page}</h1>
          </div>
          <button onClick={() => setDark(!dark)} className="rounded-lg border border-slate-300 px-3 py-1 text-sm dark:border-slate-700">
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </header>
        <main key={page} className="fade-in p-4 md:p-6"><Page /></main>
      </div>
    </div>
  );
}
