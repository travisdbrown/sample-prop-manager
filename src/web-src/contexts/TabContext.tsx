import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';

export interface Tab {
  id: string;
  path: string;
  label: string;
  icon?: string;
  scrollY: number;
  isDirty: boolean;
}

interface TabContextValue {
  tabs: Tab[];
  activeTabId: string;
  openTab: (path: string, label: string) => void;
  closeTab: (id: string) => void;
  switchTab: (id: string, currentScrollY: number) => void;
  updateTabLabel: (id: string, label: string) => void;
  setTabDirty: (id: string, dirty: boolean) => void;
  navigateInTab: (path: string) => void;
  /** Always navigates within the main tab (tabs[0]), switching to it if needed. */
  navigateMainTab: (path: string) => void;
}

export const MAX_TABS = 5;

function labelForPath(path: string): string {
  if (path === '/') return 'Dashboard';
  if (path === '/patients') return 'Patients';
  if (/^\/patients\/[^/]+\/chart/.test(path)) return 'Clinical Chart';
  if (/^\/patients\/[^/]+/.test(path)) return 'Patient';
  if (path === '/scheduling') return 'Schedule';
  if (path === '/clinical') return 'Clinical';
  if (path === '/admin/users') return 'Users';
  if (path === '/admin/audit') return 'Audit Log';
  if (path === '/admin/reminder-settings') return 'Reminders';
  if (path.startsWith('/admin')) return 'Admin';
  return 'Page';
}

function iconForPath(path: string): string {
  if (path === '/') return 'dashboard';
  if (/^\/patients\/[^/]+\/chart/.test(path)) return 'medical';
  if (/^\/patients\/[^/]+/.test(path)) return 'person';
  if (path === '/patients') return 'people';
  if (path === '/scheduling') return 'calendar';
  if (path === '/clinical') return 'medical';
  if (path === '/admin/users') return 'manage-accounts';
  if (path === '/admin/audit') return 'security';
  if (path === '/admin/reminder-settings') return 'notifications';
  if (path.startsWith('/admin')) return 'admin';
  return 'page';
}

const TabContext = createContext<TabContextValue | null>(null);

export function TabProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showMaxTabsError, setShowMaxTabsError] = useState(false);

  const [tabs, setTabs] = useState<Tab[]>(() => {
    const initial: Tab = {
      id: crypto.randomUUID(),
      path: location.pathname,
      label: labelForPath(location.pathname),
      icon: iconForPath(location.pathname),
      scrollY: 0,
      isDirty: false,
    };
    return [initial];
  });
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id);

  // Keep active tab path in sync with browser back/forward navigation
  useEffect(() => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, path: location.pathname, label: t.label } : t
      )
    );
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const openTab = useCallback(
    (path: string, label: string) => {
      const existing = tabs.find((t) => t.path === path);
      if (existing) {
        setActiveTabId(existing.id);
        navigate(path);
        return;
      }
      if (tabs.length >= MAX_TABS) {
        setShowMaxTabsError(true);
        return;
      }
      const newTab: Tab = {
        id: crypto.randomUUID(),
        path,
        label,
        icon: iconForPath(path),
        scrollY: 0,
        isDirty: false,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
      navigate(path);
    },
    [tabs, navigate]
  );

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev;
        const idx = prev.findIndex((t) => t.id === id);
        const next = prev.filter((t) => t.id !== id);
        if (id === activeTabId) {
          const nextTab = next[Math.min(idx, next.length - 1)];
          setActiveTabId(nextTab.id);
          navigate(nextTab.path);
        }
        return next;
      });
    },
    [activeTabId, navigate]
  );

  const switchTab = useCallback(
    (id: string, currentScrollY: number) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, scrollY: currentScrollY } : t))
      );
      const target = tabs.find((t) => t.id === id);
      if (target) {
        setActiveTabId(id);
        navigate(target.path);
      }
    },
    [activeTabId, tabs, navigate]
  );

  const updateTabLabel = useCallback((id: string, label: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));
  }, []);

  const setTabDirty = useCallback((id: string, dirty: boolean) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, isDirty: dirty } : t)));
  }, []);

  const navigateInTab = useCallback(
    (path: string) => {
      const label = labelForPath(path);
      const icon = iconForPath(path);
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, path, label, icon } : t))
      );
      navigate(path);
    },
    [activeTabId, navigate]
  );

  const navigateMainTab = useCallback(
    (path: string) => {
      const label = labelForPath(path);
      const icon = iconForPath(path);
      setTabs((prev) => {
        const mainId = prev[0].id;
        return prev.map((t) => (t.id === mainId ? { ...t, path, label, icon } : t));
      });
      setActiveTabId((prev) => tabs[0]?.id ?? prev);
      navigate(path);
    },
    [tabs, navigate]
  );

  return (
    <TabContext.Provider
      value={{ tabs, activeTabId, openTab, closeTab, switchTab, updateTabLabel, setTabDirty, navigateInTab, navigateMainTab }}
    >
      {children}
      <Snackbar
        open={showMaxTabsError}
        autoHideDuration={5000}
        onClose={() => setShowMaxTabsError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setShowMaxTabsError(false)}>
          Maximum of {MAX_TABS} tabs reached. Close a tab before opening a new one.
        </Alert>
      </Snackbar>
    </TabContext.Provider>
  );
}

export function useTabContext(): TabContextValue {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTabContext must be used within TabProvider');
  return ctx;
}
