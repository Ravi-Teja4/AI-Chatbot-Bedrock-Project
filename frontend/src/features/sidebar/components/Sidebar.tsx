'use client';

import { useRouter, usePathname } from 'next/navigation';
import { PanelLeftClose, Plus, Settings, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ConversationList } from './ConversationList';
import { SearchBar } from './SearchBar';
import { useThemeContext } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';

interface SidebarProps {
  onToggle: () => void;
}

/**
 * Sidebar — Main navigation panel
 *
 * Layout:
 * ┌────────────────────┐
 * │ Logo + Collapse btn│
 * │────────────────────│
 * │ New Chat button    │
 * │────────────────────│
 * │ Search             │
 * │────────────────────│
 * │ Conversation List  │  ← scrollable, infinite scroll in Phase 5
 * │ (flex-1 scroll)    │
 * │────────────────────│
 * │ Theme toggle       │
 * │ Settings (future)  │
 * │ User avatar (future│
 * └────────────────────┘
 */
export function Sidebar({ onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useThemeContext();

  function handleNewChat() {
    router.push('/chat');
  }

  const isNewChat = pathname === '/chat';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full w-full flex-col bg-sidebar border-r border-sidebar-border">
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Bot className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground">AI Chat</span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggle}
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Collapse sidebar (⌘B)</TooltipContent>
          </Tooltip>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* New Chat */}
        <div className="px-3 py-2">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleNewChat}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2 text-sm font-medium h-9',
                'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                isNewChat && 'bg-sidebar-accent text-sidebar-foreground',
              )}
              aria-label="Start new conversation"
            >
              <Plus className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              New chat
            </Button>
          </motion.div>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <SearchBar />
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Conversation list — scrollable */}
        <ScrollArea className="flex-1 px-2 py-2">
          <ConversationList />
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* Footer actions */}
        <div className="flex flex-col gap-1 p-2">
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent h-9"
                aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                )}
                <span className="text-sm">
                  {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Toggle theme</TooltipContent>
          </Tooltip>

          {/* Settings — placeholder */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent h-9"
                aria-label="Settings (coming soon)"
                disabled
              >
                <Settings className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm">Settings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings (coming soon)</TooltipContent>
          </Tooltip>

          {/* User avatar placeholder */}
          <div className="flex items-center gap-2 rounded-md px-2 py-2 mt-1">
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold"
              aria-hidden="true"
            >
              G
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-sidebar-foreground truncate">
                Guest User
              </span>
              <span className="text-[10px] text-sidebar-foreground/50">Free plan</span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
