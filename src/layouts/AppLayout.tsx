import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import GlobalModals from '@/components/GlobalModals';
import ShopVerificationOverlay from '@/components/ShopVerificationOverlay';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    return localStorage.getItem('sidebar-expanded') === 'true';
  });

  const handleToggleExpand = () => {
    setSidebarExpanded(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-expanded', String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        expanded={sidebarExpanded}
        onToggleExpand={handleToggleExpand}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5">
          <Outlet />
        </main>
      </div>
      <GlobalModals />
      <ShopVerificationOverlay />
    </div>
  );
}
