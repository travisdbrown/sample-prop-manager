import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../contexts/AuthContext';
import { TabProvider, useTabContext } from '../contexts/TabContext';
import { Role } from '../types/auth';
import TabBar from '../components/tabs/TabBar';
import UniversalSearch from '../components/UniversalSearch';

const NAV_ITEMS = [
  { label: 'Dashboard',  icon: <DashboardIcon />,           path: '/',           roles: null },
  { label: 'Patients',   icon: <PersonIcon />,              path: '/patients',   roles: null },
  { label: 'Scheduling', icon: <CalendarMonthIcon />,       path: '/scheduling', roles: [Role.FrontDesk, Role.OfficeManager, Role.Dentist, Role.Hygienist] },
  { label: 'Admin',      icon: <AdminPanelSettingsIcon />,  path: '/admin',       roles: [Role.PracticeOwner] },
  { label: 'Users',      icon: <ManageAccountsIcon />,      path: '/admin/users',             roles: [Role.PracticeOwner, Role.OfficeManager] },
  { label: 'Reminders', icon: <NotificationsIcon />,       path: '/admin/reminder-settings', roles: [Role.PracticeOwner, Role.OfficeManager] },
  { label: 'Audit Log', icon: <SecurityIcon />,            path: '/admin/audit',             roles: [Role.PracticeOwner] },
] as const;

const DRAWER_WIDTH_COLLAPSED = 64;
const DRAWER_WIDTH_EXPANDED = 220;
const SEARCH_SHORTCUT = /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? '⌘K' : 'Ctrl+K';

const skipLinkSx = {
  position: 'absolute',
  top: '-40px',
  left: 0,
  background: 'primary.main',
  color: '#fff',
  px: 1,
  py: 0.5,
  zIndex: 9999,
  '&:focus': { top: 0 },
} as const;

// Inner shell — consumes TabContext (must be child of TabProvider)
function AppShellContent() {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));   // controls nav layout (unchanged)
  const isTouchTablet = useMediaQuery('(min-width: 768px)') &&   // controls density-tablet CSS
    typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { navigateMainTab, activeTabId } = useTabContext();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!((e.metaKey || e.ctrlKey) && e.key === 'k')) return;
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('density-tablet', isTouchTablet);
    return () => document.body.classList.remove('density-tablet');
  }, [isTouchTablet]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getScrollY = useCallback(() => contentRef.current?.scrollTop ?? 0, []);

  // Restore scroll position when switching tabs
  useLayoutEffect(() => {
    // activeTabId change triggers scroll restoration via switchTab which saves scrollY
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTabId]);

  const visibleNavItems = NAV_ITEMS.filter(
    (item) =>
      item.roles === null ||
      user?.roles?.some(r => (item.roles as ReadonlyArray<string>).includes(r))
  );

  const currentNavIndex = visibleNavItems.reduce((bestIdx, item, idx) => {
    const matches = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    if (!matches) return bestIdx;
    const bestPath = bestIdx === -1 ? '' : visibleNavItems[bestIdx].path;
    return item.path.length > bestPath.length ? idx : bestIdx;
  }, -1);

  const drawerWidth = drawerExpanded ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED;

  return (
    <>
      {isTablet ? (
        // Tablet: AppBar → TabBar → content → bottom nav
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Box component="a" href="#main-content" sx={skipLinkSx}>Skip to main content</Box>
          <Box component="a" href="#main-nav" sx={skipLinkSx}>Skip to navigation</Box>

          <AppBar position="static" color="primary" elevation={1}>
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                DyVisions Dental
              </Typography>
              <Tooltip title={`Search patients (${SEARCH_SHORTCUT})`}>
                <IconButton color="inherit" aria-label={`Search patients (${SEARCH_SHORTCUT})`} onClick={() => setSearchOpen(true)}>
                  <SearchIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Sign out">
                <IconButton color="inherit" aria-label="Sign out" onClick={handleLogout}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>

          <TabBar contentScrollY={getScrollY} />

          <Box
            ref={contentRef}
            component="main"
            id="main-content"
            sx={{ flex: 1, overflow: 'auto', p: 2 }}
          >
            <Outlet />
          </Box>

          <Paper elevation={3} sx={{ position: 'sticky', bottom: 0 }}>
            <Box component="nav" id="main-nav" aria-label="Main navigation">
              <BottomNavigation
                value={currentNavIndex}
                onChange={(_, newValue) => navigateMainTab(visibleNavItems[newValue].path)}
                showLabels
              >
                {visibleNavItems.map((item) => (
                  <BottomNavigationAction
                    key={item.path}
                    label={item.label}
                    icon={item.icon}
                  />
                ))}
              </BottomNavigation>
            </Box>
          </Paper>
        </Box>
      ) : (
        // Desktop: nav rail | AppBar → TabBar → content
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Box component="a" href="#main-content" sx={skipLinkSx}>Skip to main content</Box>
          <Box component="a" href="#main-nav" sx={skipLinkSx}>Skip to navigation</Box>

          <Box component="nav" id="main-nav" aria-label="Main navigation">
            <Drawer
              variant="permanent"
              sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  width: drawerWidth,
                  boxSizing: 'border-box',
                  overflowX: 'hidden',
                  transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                },
              }}
            >
              <Toolbar sx={{ justifyContent: drawerExpanded ? 'space-between' : 'center', px: 1 }}>
                {drawerExpanded && (
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }} noWrap>
                    DyVisions Dental
                  </Typography>
                )}
                <IconButton
                  onClick={() => setDrawerExpanded((prev) => !prev)}
                  aria-label={drawerExpanded ? 'Collapse navigation' : 'Expand navigation'}
                  size="small"
                >
                  <MenuIcon />
                </IconButton>
              </Toolbar>

              <List>
                {visibleNavItems.map((item) => (
                  <Tooltip
                    title={drawerExpanded ? '' : item.label}
                    placement="right"
                    key={item.path}
                  >
                    <ListItem disablePadding sx={{ display: 'block' }}>
                      <ListItemButton
                        selected={visibleNavItems[currentNavIndex]?.path === item.path}
                        onClick={() => navigateMainTab(item.path)}
                        sx={{
                          minHeight: 48,
                          justifyContent: drawerExpanded ? 'initial' : 'center',
                          px: 2.5,
                          '&.Mui-selected': {
                            backgroundColor: 'primary.light',
                            borderLeft: '3px solid',
                            borderLeftColor: 'primary.main',
                            '&:hover': { backgroundColor: 'primary.light' },
                          },
                        }}
                        aria-label={item.label}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: drawerExpanded ? 3 : 'auto',
                            justifyContent: 'center',
                            color: 'inherit',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        {drawerExpanded && <ListItemText primary={item.label} />}
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>
                ))}
              </List>
            </Drawer>
          </Box>

          <Box
            component="main"
            id="main-content"
            sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <AppBar
              position="static"
              color="default"
              elevation={0}
              sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}
            >
              <Toolbar>
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title={`Search patients (${SEARCH_SHORTCUT})`}>
                  <IconButton aria-label={`Search patients (${SEARCH_SHORTCUT})`} onClick={() => setSearchOpen(true)}>
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sign out">
                  <IconButton aria-label="Sign out" onClick={handleLogout}>
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              </Toolbar>
            </AppBar>

            <TabBar contentScrollY={getScrollY} />

            <Box
              ref={contentRef}
              sx={{ flex: 1, overflow: 'auto', p: 3 }}
            >
              <Outlet />
            </Box>
          </Box>
        </Box>
      )}
      <UniversalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

// AppShell — wraps AppShellContent with TabProvider
export default function AppShell() {
  return (
    <TabProvider>
      <AppShellContent />
    </TabProvider>
  );
}
