import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, Cpu, Users, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar() {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Schools', href: '/schools', icon: GraduationCap },
    { name: 'Hardware Devices', href: '/devices', icon: Cpu },
    { name: 'Admins', href: '/admins', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-400 h-screen flex flex-col fixed left-0 top-0 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-slate-900 font-black text-xl tracking-tighter">
            V
          </div>
          <div>
            <h1 className="font-semibold text-white tracking-tight text-lg leading-tight">Voltava Drive</h1>
            <p className="text-[10px] uppercase text-emerald-500 font-bold tracking-widest">Fleet Intelligence</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 py-6 px-4 flex flex-col gap-1 mt-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href));
          
          return (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-md">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-medium text-slate-300">All Systems Operational</span>
        </div>
      </div>
    </aside>
  );
}
