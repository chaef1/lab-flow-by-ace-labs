
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Link, Instagram } from "lucide-react";

export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'linkedin';

interface SearchFormProps {
  platform: Platform;
  username: string;
  isLoading: boolean;
  onUsernameChange: (username: string) => void;
  onSearch: () => void;
}

export function SearchForm({ 
  platform, 
  username, 
  isLoading, 
  onUsernameChange, 
  onSearch 
}: SearchFormProps) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground mb-2">
        <div className="flex items-center">
          <Link className="h-4 w-4 mr-1" />
          Enter {platform} username or profile URL
        </div>
      </div>
      
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Username or ${platform}.com/username`}
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <Button onClick={onSearch} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Search
        </Button>
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        <p className="flex items-center">
          <Link className="h-3 w-3 mr-1" />
          Example: https://www.{platform}.com/username
        </p>
      </div>
    </div>
  );
}
