import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchSymbols } from '@/api/marketData';
import type { SymbolSuggestion } from '@/types';
import { GLOBAL_SYMBOL_SELECTED_EVENT } from '@/lib/events';
import { toast } from '@/components/loaders/Toast';

const MIN_QUERY_LENGTH = 2;

export default function GlobalSymbolSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    const debounce = setTimeout(() => {
      searchSymbols(trimmed)
        .then((suggestions) => {
          if (cancelled) return;
          setResults(suggestions ?? []);
          if ((suggestions ?? []).length === 0) {
            setError('No matches found');
          }
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setError('Lookup failed');
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [query, isOpen]);

  const visibleResults = useMemo(() => results.slice(0, 8), [results]);

  const dispatchSelection = (suggestion: SymbolSuggestion) => {
    const ticker = (suggestion.ticker || suggestion.symbol || '').trim().toUpperCase();
    if (!ticker) return;

    window.dispatchEvent(
      new CustomEvent<SymbolSuggestion>(GLOBAL_SYMBOL_SELECTED_EVENT, {
        detail: {
          ...suggestion,
          symbol: ticker,
          ticker,
        },
      })
    );
    toast.success(`Added ${ticker} to symbol pickers`);
  };

  const handleSelect = (suggestion: SymbolSuggestion) => {
    dispatchSelection(suggestion);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleSubmit = () => {
    const ticker = query.trim().toUpperCase();
    if (!ticker) return;
    handleSelect({ symbol: ticker, ticker });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/40">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          onKeyDown={handleKeyDown}
          placeholder="Search any ticker or company across the app"
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>
      {isOpen && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-border/70 bg-card shadow-xl">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-slate-400">Searching...</div>
          )}
          {!isLoading && error && (
            <div className="px-4 py-3 text-xs text-slate-400">{error}</div>
          )}
          {!isLoading && !error && visibleResults.length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-400">
              Type at least two characters to search
            </div>
          )}
          {!isLoading && visibleResults.length > 0 && (
            <ul>
              {visibleResults.map((result) => (
                <li
                  key={`${result.symbol}-${result.name ?? ''}`}
                  className="cursor-pointer px-4 py-3 hover:bg-primary/5"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(result)}
                >
                  <p className="text-sm font-semibold">{(result.ticker || result.symbol || '').toUpperCase()}</p>
                  <p className="text-xs text-slate-400">
                    {[result.name, result.exchange, result.sector]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
