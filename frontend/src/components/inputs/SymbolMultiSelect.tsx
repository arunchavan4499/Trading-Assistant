import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAvailableSymbols, searchSymbols } from '@/api/marketData';
import type { SymbolSuggestion } from '@/types';

type Props = {
  label?: string;
  value: string[];
  onChange: (symbols: string[]) => void;
  placeholder?: string;
};

export default function SymbolMultiSelect({ label = 'Symbols', value, onChange, placeholder: _placeholder }: Props) {
  const [input, setInput] = useState('');
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SymbolSuggestion[]>([]);
  const [visible, setVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    let mounted = true;
    getAvailableSymbols()
      .then((list) => {
        if (mounted) setAvailableSymbols(list || []);
      })
      .catch(() => {
        if (mounted) setAvailableSymbols([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const query = input.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);
    const handle = setTimeout(() => {
      searchSymbols(query)
        .then((results) => {
          if (cancelled) return;
          setSearchResults(results || []);
        })
        .catch((err) => {
          console.warn('Symbol search failed', err);
          if (cancelled) return;
          setSearchResults([]);
          setSearchError('Search service unavailable');
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [input]);

  const normalizedInput = input.trim().toLowerCase();
  const fallbackSuggestions: SymbolSuggestion[] = availableSymbols
    .filter((s) => !normalizedInput || s.toLowerCase().includes(normalizedInput))
    .filter((s) => !value.includes(s.toUpperCase()))
    .slice(0, 12)
    .map((symbol) => ({ symbol }));

  const normalizedSearchResults = searchResults.filter((s) => {
    const sym = (s.symbol || s.ticker || '').toUpperCase();
    return sym && !value.includes(sym);
  });

  const fallbackPool: SymbolSuggestion[] = fallbackSuggestions.length > 0
    ? fallbackSuggestions
    : ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'].map((symbol) => ({ symbol }));

  const combinedSuggestions: SymbolSuggestion[] = normalizedSearchResults.length > 0 ? normalizedSearchResults : fallbackPool;

  const addSymbol = (raw: string) => {
    const sym = raw.trim().toUpperCase();
    if (!sym) return;
    if (value.includes(sym)) return;
    onChange([...value, sym]);
    setInput('');
    setVisible(false);
  };

  const removeSymbol = (sym: string) => {
    onChange(value.filter((s) => s !== sym));
  };

  // Reset selection when options change
  useEffect(() => {
    setSelectedIndex(0);
  }, [input, searchResults, value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < combinedSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (visible && combinedSuggestions.length > 0) {
        // Always prefer the selected item, or default to the first one if selection is invalid
        const index = (selectedIndex >= 0 && selectedIndex < combinedSuggestions.length) ? selectedIndex : 0;
        addSymbol(combinedSuggestions[index].symbol);
      } else {
        const cleanInput = input.trim().replace(/,$/, '');
        if (cleanInput) addSymbol(cleanInput);
      }
    } else if (e.key === 'Backspace' && !input) {
      if (value.length > 0) onChange(value.slice(0, -1));
    } else if (e.key === 'Escape') {
      setVisible(false);
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</Label>
      <div className="mt-2 rounded-md border border-slate-300 bg-slate-50 p-2 dark:border-white/10 dark:bg-slate-950/50">
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((s) => (
            <div key={s} className="flex items-center space-x-2 rounded bg-slate-200 px-2 py-1 text-sm text-slate-700 dark:bg-white/10 dark:text-slate-100">
              <span className="font-medium">{s}</span>
              <button
                type="button"
                aria-label={`Remove ${s}`}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => removeSymbol(s)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="relative">
          <Input
            value={input}
            onFocus={() => setVisible(true)}
            onBlur={() => setTimeout(() => setVisible(false), 150)}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type company name (e.g. Apple) or ticker..."
            className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-400/40 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {visible && (
            <div className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-auto rounded border border-slate-200 bg-white text-sm text-slate-700 shadow-lg dark:border-white/10 dark:bg-slate-950/95 dark:text-slate-100">
              {isSearching && (
                <div className="px-3 py-2 text-slate-500 dark:text-slate-400">Searching...</div>
              )}
              {!isSearching && searchError && (
                <div className="px-3 py-2 text-xs text-rose-300">
                  {searchError}
                  <span className="ml-1 text-slate-400">Showing local suggestions.</span>
                </div>
              )}
              {!isSearching && combinedSuggestions.map((s, index) => (
                (() => {
                  const resolved = (s.symbol || s.ticker || '').toUpperCase();
                  if (!resolved) return null;
                  return (
                    <div
                      key={`${resolved}-${s.name ?? ''}`}
                      className={`cursor-pointer px-3 py-2 ${index === selectedIndex ? 'bg-slate-100 dark:bg-white/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addSymbol(resolved)}
                    >
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{resolved}</div>
                      {(s.name || s.exchange || s.sector) && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {[s.name, s.exchange, s.sector].filter(Boolean).join(' • ')}
                          {typeof s.score === 'number' ? ` • ${(s.score * 100).toFixed(0)}%` : ''}
                        </div>
                      )}
                    </div>
                  );
                })()
              ))}
              {!isSearching && combinedSuggestions.length === 0 && !searchError && (
                <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                  {normalizedInput
                    ? `Press Enter to add "${normalizedInput.toUpperCase()}"`
                    : 'Start typing a ticker or company name'}
                </div>
              )}
            </div>
          )}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
          Type a company name ("Google") to auto-select its ticker ("GOOGL"). Press Enter or comma to add.
        </p>
      </div>
    </div>
  );
}
