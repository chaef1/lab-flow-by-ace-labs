
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface Creator {
  id: string;
  name: string;
  instagram: string;
  tiktok: string;
  followers: string;
  engagement: string;
  posts: number;
  performance: string;
}

interface CreatorTableProps {
  creators: Creator[];
}

const CreatorTable = ({ creators }: CreatorTableProps) => {
  const getPerformanceBadgeColor = (performance: string) => {
    switch (performance.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'low':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Creator Performance</CardTitle>
        <CardDescription>Analytics by creator across all platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>TikTok</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Engagement Rate</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators.map((creator) => (
                <TableRow key={creator.id}>
                  <TableCell className="font-medium">{creator.name}</TableCell>
                  <TableCell>{creator.instagram}</TableCell>
                  <TableCell>{creator.tiktok}</TableCell>
                  <TableCell>{creator.followers}</TableCell>
                  <TableCell>{creator.engagement}</TableCell>
                  <TableCell>{creator.posts}</TableCell>
                  <TableCell>
                    <Badge className={getPerformanceBadgeColor(creator.performance)}>
                      {creator.performance}
                    </Badge>
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

export default CreatorTable;
