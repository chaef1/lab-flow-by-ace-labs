import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, X, Loader2 } from 'lucide-react';
import { Platform } from '@/hooks/useModashDiscovery';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  isLoading: boolean;
  platform: Platform;
  placeholder?: string;
}

export const ModernSearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  suggestions,
  isLoading,
  platform,
  placeholder = 'Search creators...',
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setSelectedIndex(-1);
    setShowSuggestions(newValue.length >= 2);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const clearSearch = () => {
    onChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getSearchHint = () => {
    if (value.startsWith('@')) return 'Username search';
    if (value.includes('@') && value.includes('.')) return 'Email search';
    if (value.startsWith('#')) return 'Hashtag search';
    if (value.length >= 3) return 'Keyword search';
    return null;
  };

  const searchHint = getSearchHint();

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(value.length >= 2)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="pl-10 pr-20 h-10"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
          {value && !isLoading && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSearch}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Hint */}
      {searchHint && (
        <div className="mt-2">
          <Badge variant="outline" className="text-xs">
            {searchHint}
          </Badge>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <Command>
            <CommandList>
              <CommandGroup>
                {suggestions.slice(0, 8).map((suggestion, index) => (
                  <CommandItem
                    key={suggestion}
                    onSelect={() => handleSuggestionSelect(suggestion)}
                    className={`cursor-pointer ${
                      index === selectedIndex ? 'bg-accent' : ''
                    }`}
                  >
                    <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span>{suggestion}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {suggestions.length === 0 && (
                <CommandEmpty>No suggestions found.</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};