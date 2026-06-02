import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useTabContext } from '../../contexts/TabContext';
import TabItem from './TabItem';

interface TabBarProps {
  contentScrollY: () => number;
}

export default function TabBar({ contentScrollY }: TabBarProps) {
  const { tabs, activeTabId, closeTab, switchTab } = useTabContext();
  const activeTabRef = useRef<HTMLDivElement>(null);
  const [dirtyCloseId, setDirtyCloseId] = useState<string | null>(null);

  // Scroll active tab into view whenever active tab changes
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeTabId]);

  const handleCloseRequest = (id: string) => {
    const tab = tabs.find((t) => t.id === id);
    if (tab?.isDirty) {
      setDirtyCloseId(id);
    } else {
      closeTab(id);
    }
  };

  const handleConfirmClose = () => {
    if (dirtyCloseId) closeTab(dirtyCloseId);
    setDirtyCloseId(null);
  };

  return (
    <>
      <Box
        role="tablist"
        aria-label="Open tabs"
        onKeyDown={(e) => {
          if (e.key === 'Delete' && tabs.length > 1) handleCloseRequest(activeTabId);
        }}
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          height: { xs: 36, md: 40 },
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
          backgroundColor: 'background.paper',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            flex: 1,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              ref={tab.id === activeTabId ? activeTabRef : null}
              style={{ display: 'flex', alignItems: 'stretch', paddingRight: 2 }}
            >
              <TabItem
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={tab.id === activeTabId}
                isDirty={tab.isDirty}
                isCloseable={tab.id !== tabs[0].id}
                onSelect={() => {
                  if (tab.id !== activeTabId) switchTab(tab.id, contentScrollY());
                }}
                onClose={() => handleCloseRequest(tab.id)}
              />
            </div>
          ))}
        </Box>
      </Box>

      <Dialog
        open={dirtyCloseId !== null}
        onClose={() => setDirtyCloseId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Unsaved changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This tab has unsaved changes. Close anyway?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDirtyCloseId(null)}>Cancel</Button>
          <Button onClick={handleConfirmClose} color="error" variant="contained">
            Close tab
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
