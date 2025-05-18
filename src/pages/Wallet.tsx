
import Dashboard from "@/components/layout/Dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DownloadCloud, Upload } from "lucide-react";

const walletData = {
  balance: 14250.75,
  pending: 4500,
  transactions: [
    {
      id: "t1",
      type: "payment" as const,
      description: "Website Redesign Payment",
      amount: 2500,
      status: "completed" as const,
      date: "2025-05-16"
    },
    {
      id: "t2",
      type: "invoice" as const,
      description: "Q2 Marketing Campaign",
      amount: 4500,
      status: "pending" as const,
      date: "2025-05-10"
    },
    {
      id: "t3",
      type: "withdrawal" as const,
      description: "Withdrawal to Bank Account",
      amount: 3000,
      status: "completed" as const,
      date: "2025-05-05"
    },
    {
      id: "t4",
      type: "payment" as const,
      description: "Logo Design",
      amount: 850,
      status: "completed" as const,
      date: "2025-04-28"
    },
    {
      id: "t5",
      type: "invoice" as const,
      description: "Monthly Retainer - April",
      amount: 5000,
      status: "completed" as const,
      date: "2025-04-15"
    },
    {
      id: "t6",
      type: "payment" as const,
      description: "Social Media Management",
      amount: 1200,
      status: "completed" as const,
      date: "2025-04-10"
    },
    {
      id: "t7",
      type: "withdrawal" as const,
      description: "Withdrawal to Bank Account",
      amount: 7000,
      status: "completed" as const,
      date: "2025-04-05"
    },
  ]
};

const TransactionItem = ({ transaction }) => {
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
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex flex-col">
        <span className="font-medium">{transaction.description}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{formattedDate}</span>
          <span className={`text-sm font-medium ${statusColors[transaction.status]}`}>
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

const Wallet = () => {
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(walletData.balance);

  const formattedPending = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(walletData.pending);
  
  return (
    <Dashboard title="Wallet" subtitle="Manage your financial transactions">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="pb-0">
              <CardTitle>Account Balance</CardTitle>
              <CardDescription>Overview of your financial status</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                  <p className="text-4xl font-bold">{formattedBalance}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-semibold text-amber-500">{formattedPending}</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-2 mt-auto">
                  <Button size="sm">
                    <Upload className="mr-2 h-4 w-4" /> Deposit Funds
                  </Button>
                  <Button size="sm" variant="outline">
                    <DownloadCloud className="mr-2 h-4 w-4" /> Withdraw Funds
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>View all your financial transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {walletData.transactions.map(transaction => (
                      <TransactionItem key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="payments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payments</CardTitle>
                  <CardDescription>Income from clients and projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {walletData.transactions
                      .filter(t => t.type === 'payment')
                      .map(transaction => (
                        <TransactionItem key={transaction.id} transaction={transaction} />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="invoices" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Pending and paid client invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {walletData.transactions
                      .filter(t => t.type === 'invoice')
                      .map(transaction => (
                        <TransactionItem key={transaction.id} transaction={transaction} />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="withdrawals" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawals</CardTitle>
                  <CardDescription>Money transferred to external accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {walletData.transactions
                      .filter(t => t.type === 'withdrawal')
                      .map(transaction => (
                        <TransactionItem key={transaction.id} transaction={transaction} />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Dashboard>
  );
};

export default Wallet;
