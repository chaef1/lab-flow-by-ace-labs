
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface ContentItem {
  id: string;
  platform: string;
  title: string;
  creator: string;
  reach: string;
  engagement: string;
  date: string;
  link: string;
}

interface ContentTableProps {
  items: ContentItem[];
  platform: string;
}

const ContentTable = ({ items, platform }: ContentTableProps) => {
  // Filter content based on selected platform
  const filteredContent = useMemo(() => {
    if (platform === 'all') return items;
    return items.filter(item => 
      item.platform.toLowerCase() === platform.toLowerCase()
    );
  }, [platform, items]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Content</CardTitle>
        <CardDescription>Content with highest engagement and reach</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Reach</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.map((content) => (
                <TableRow key={content.id}>
                  <TableCell>
                    <div className="flex items-center">
                      {content.platform === 'Instagram' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram mr-2 text-pink-500">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 448 512" className="mr-2">
                          <path fill="currentColor" d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                        </svg>
                      )}
                      {content.platform}
                    </div>
                  </TableCell>
                  <TableCell>{content.title}</TableCell>
                  <TableCell>{content.creator}</TableCell>
                  <TableCell>{content.reach}</TableCell>
                  <TableCell>{content.engagement}</TableCell>
                  <TableCell>{content.date}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <a href={content.link} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentTable;
