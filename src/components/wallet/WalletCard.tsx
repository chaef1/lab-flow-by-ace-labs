
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface Transaction {
  id: string;
  type: "payment" | "invoice" | "withdrawal";
  description: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  date: string;
}

interface WalletCardProps {
  balance: number;
  transactions: Transaction[];
}

const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
  const isPositive = transaction.type === "payment";
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(transaction.amount);

  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const statusColors = {
    'pending': 'text-amber-500',
    'completed': 'text-green-500',
    'failed': 'text-red-500',
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex flex-col">
        <span className="font-medium text-sm">{transaction.description}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
          <span className={`text-xs font-medium ${statusColors[transaction.status]}`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </span>
        </div>
      </div>
      <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-foreground'}`}>
        {isPositive ? '+' : '-'} {formattedAmount}
      </span>
    </div>
  );
};

const WalletCard = ({ balance, transactions }: WalletCardProps) => {
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(balance);

  const pendingAmount = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const formattedPending = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(pendingAmount);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Wallet</CardTitle>
        <CardDescription>Manage your payments and invoices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Current Balance</div>
            <div className="text-3xl font-semibold">{formattedBalance}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Pending</div>
            <div className="text-xl font-medium text-amber-500">{formattedPending}</div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            Withdraw Funds
          </Button>
          <Button size="sm" variant="outline">
            Invoice Client
          </Button>
        </div>
        
        <Tabs defaultValue="recent">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="space-y-4 mt-4">
            <div className="max-h-64 overflow-y-auto pr-1">
              {transactions.slice(0, 5).map(transaction => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="payments" className="space-y-4 mt-4">
            <div className="max-h-64 overflow-y-auto pr-1">
              {transactions
                .filter(t => t.type === 'payment')
                .map(transaction => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
            </div>
          </TabsContent>
          <TabsContent value="invoices" className="space-y-4 mt-4">
            <div className="max-h-64 overflow-y-auto pr-1">
              {transactions
                .filter(t => t.type === 'invoice')
                .map(transaction => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          View All Transactions
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WalletCard;
