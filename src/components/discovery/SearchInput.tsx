import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, RefreshCw, CheckCircle } from 'lucide-react';
import { SearchResult } from '@/hooks/useModashSearch';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onSuggestionSelect: (suggestion: SearchResult) => void;
  suggestions: SearchResult[];
  isLoadingSuggestions: boolean;
  isSearching: boolean;
  platform: string;
  placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  onSuggestionSelect,
  suggestions,
  isLoadingSuggestions,
  isSearching,
  platform,
  placeholder = "Search creators..."
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
    
    if (newValue.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearch();
      }
      return;
    }

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
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          onSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    onChange(suggestion.username);
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  return (
    <div className="relative flex-1">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => {
              if (value.trim().length >= 2 && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="pl-10"
            autoComplete="off"
          />
          
          {/* Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {isLoadingSuggestions ? (
                <div className="p-4 text-center text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                  Searching creators...
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.userId}-${suggestion.platform}`}
                    ref={el => suggestionRefs.current[index] = el}
                    className={cn(
                      "flex items-center gap-3 p-3 cursor-pointer hover:bg-accent border-b border-border last:border-b-0",
                      selectedIndex === index && "bg-accent"
                    )}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={suggestion.profilePicUrl} alt={suggestion.username} />
                      <AvatarFallback>
                        {suggestion.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          @{suggestion.username}
                        </span>
                        {suggestion.isVerified && (
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      
                      {suggestion.fullName && (
                        <p className="text-sm text-muted-foreground truncate">
                          {suggestion.fullName}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatNumber(suggestion.followers)} followers
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {suggestion.platform}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <Button onClick={onSearch} disabled={isSearching}>
          {isSearching && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          Search
        </Button>
      </div>
    </div>
  );
};