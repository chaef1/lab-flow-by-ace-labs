
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader, Facebook, Instagram, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getMetaPages, getSavedMetaToken } from '@/lib/api/meta-api';
import { useToast } from "@/hooks/use-toast";

interface PageSelectorProps {
  onPageSelected: (page: any) => void;
  selectedPageId?: string;
}

const PageSelector: React.FC<PageSelectorProps> = ({
  onPageSelected,
  selectedPageId
}) => {
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { accessToken } = getSavedMetaToken();
      
      if (!accessToken) {
        throw new Error('No Meta access token found');
      }

      console.log('Fetching Meta pages...');
      const pagesData = await getMetaPages(accessToken);
      
      if (pagesData && pagesData.data) {
        console.log('Meta pages fetched:', pagesData.data);
        setPages(pagesData.data);
        
        // Auto-select first page if none selected
        if (pagesData.data.length > 0 && !selectedPageId) {
          onPageSelected(pagesData.data[0]);
        }
      } else {
        console.warn('No pages data received');
        setPages([]);
      }
    } catch (error: any) {
      console.error('Error fetching Meta pages:', error);
      setError(error.message || 'Failed to fetch pages');
      
      toast({
        title: "Error Loading Pages",
        description: error.message || "Failed to fetch Facebook pages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageSelection = (pageId: string) => {
    const selectedPage = pages.find(page => page.id === pageId);
    if (selectedPage) {
      console.log('Page selected:', selectedPage);
      onPageSelected(selectedPage);
    }
  };

  const getSelectedPage = () => {
    return pages.find(page => page.id === selectedPageId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5" />
            Select Page/Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-2">
              <Loader className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading pages...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5" />
            Select Page/Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Facebook className="h-5 w-5" />
          Select Page/Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pages.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No Facebook pages found. Make sure you have admin access to at least one Facebook page.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Choose Facebook Page or Instagram Account
              </label>
              <Select 
                value={selectedPageId || ''} 
                onValueChange={handlePageSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a page or Instagram account" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      <div className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        <span>{page.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {pages.map((page) => 
                    page.instagram_business_account ? (
                      <SelectItem 
                        key={`ig_${page.instagram_business_account.id}`} 
                        value={`ig_${page.instagram_business_account.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          <span>@{page.instagram_business_account.username}</span>
                          <Badge variant="secondary" className="text-xs">IG</Badge>
                        </div>
                      </SelectItem>
                    ) : null
                  )}
                </SelectContent>
              </Select>
            </div>

            {getSelectedPage() && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-3">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{getSelectedPage()?.name}</p>
                    <p className="text-sm text-blue-700">Facebook Page</p>
                    {getSelectedPage()?.instagram_business_account && (
                      <p className="text-xs text-blue-600">
                        Connected to @{getSelectedPage()?.instagram_business_account.username}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p>
                Your ads will be published from the selected page or Instagram account. 
                Make sure you have the necessary permissions to advertise from this account.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PageSelector;
