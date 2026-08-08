'use client';

import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

/**
 * SearchBar — Conversation search input
 *
 * Phase 1: Local UI only (no API call yet)
 * Phase 5: Will trigger debounced API search
 */
export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  }

  function handleClear() {
    setQuery('');
    onSearch?.('');
    inputRef.current?.focus();
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 h-8 rounded-md border bg-background/50 px-2 transition-colors',
        isFocused
          ? 'border-ring/50 bg-background'
          : 'border-sidebar-border hover:border-sidebar-border/80',
      )}
    >
      <Search
        className="h-3.5 w-3.5 flex-shrink-0 text-sidebar-foreground/40"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search conversations..."
        className="flex-1 bg-transparent text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none"
        aria-label="Search conversations"
      />
      {query && (
        <button
          onClick={handleClear}
          className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
