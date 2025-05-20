
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, ArrowUpRight, ArrowRight, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdWallet = () => {
  const [walletBalance, setWalletBalance] = useState(5000);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState(500);
  
  // Mock transaction data
  const transactions = [
    { id: 1, date: '2025-05-19', type: 'Deposit', amount: 2000, campaign: 'Initial Funding', platform: 'Wallet' },
    { id: 2, date: '2025-05-20', type: 'Transfer', amount: -1000, campaign: 'Summer Product Launch', platform: 'TikTok' },
    { id: 3, date: '2025-05-21', type: 'Transfer', amount: -500, campaign: 'Brand Awareness Q2', platform: 'TikTok' },
    { id: 4, date: '2025-05-22', type: 'Deposit', amount: 4500, campaign: 'Additional Funding', platform: 'Wallet' },
  ];
  
  // Mock spending data
  const spendingData = [
    { name: '5/14', TikTok: 120, Meta: 0 },
    { name: '5/15', TikTok: 180, Meta: 0 },
    { name: '5/16', TikTok: 250, Meta: 0 },
    { name: '5/17', TikTok: 310, Meta: 0 },
    { name: '5/18', TikTok: 420, Meta: 0 },
    { name: '5/19', TikTok: 380, Meta: 0 },
    { name: '5/20', TikTok: 290, Meta: 0 },
  ];
  
  const handleAddFunds = () => {
    setWalletBalance(prev => prev + fundAmount);
    transactions.unshift({
      id: transactions.length + 1,
      date: new Date().toISOString().split('T')[0],
      type: 'Deposit',
      amount: fundAmount,
      campaign: 'Manual Deposit',
      platform: 'Wallet'
    });
    setIsAddFundsOpen(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Advertising Wallet</CardTitle>
            <CardDescription>Manage your advertising budget across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
                <div className="text-3xl font-bold">${walletBalance.toLocaleString()}</div>
                <div className="mt-6">
                  <Button onClick={() => setIsAddFundsOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Funds
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Allocated to Campaigns</div>
                <div className="text-3xl font-bold">$1,500</div>
                <div className="text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-ace-green" />
                    $500 allocated this month
                  </span>
                </div>
                <div className="mt-6">
                  <Button variant="outline">
                    View Allocations <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Current budget allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">TikTok</span>
                  <span>$1,500 (100%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-2 bg-ace-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Meta (Coming Soon)</span>
                  <span>$0 (0%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-2 bg-ace-yellow rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="spending">
        <TabsList className="mb-6">
          <TabsTrigger value="spending">Spending History</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="spending">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Daily Spending</CardTitle>
                  <CardDescription>Track your advertising spend over time</CardDescription>
                </div>
                <Select defaultValue="7d">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spendingData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="TikTok" stackId="1" stroke="#3370FF" fill="#3370FF" />
                    <Area type="monotone" dataKey="Meta" stackId="1" stroke="#F9B81A" fill="#F9B81A" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Record of all wallet transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Date</th>
                      <th className="h-10 px-4 text-left font-medium">Type</th>
                      <th className="h-10 px-4 text-left font-medium">Amount</th>
                      <th className="h-10 px-4 text-left font-medium">Campaign/Purpose</th>
                      <th className="h-10 px-4 text-left font-medium">Platform</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction.id} className="border-b">
                        <td className="p-4 align-middle flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 align-middle">
                          {transaction.type === 'Deposit' ? 
                            <span className="inline-flex items-center">
                              <DollarSign className="mr-1 h-4 w-4 text-ace-green" /> 
                              {transaction.type}
                            </span> : 
                            <span className="inline-flex items-center">
                              <TrendingUp className="mr-1 h-4 w-4 text-ace-yellow" /> 
                              {transaction.type}
                            </span>
                          }
                        </td>
                        <td className={`p-4 align-middle font-medium ${
                          transaction.amount > 0 ? 'text-ace-green' : 'text-ace-red'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount)}
                        </td>
                        <td className="p-4 align-middle">{transaction.campaign}</td>
                        <td className="p-4 align-middle">
                          <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ${
                            transaction.platform === 'TikTok' 
                              ? 'bg-ace-500/10 text-ace-500' 
                              : transaction.platform === 'Meta'
                                ? 'bg-ace-yellow/10 text-ace-yellow' 
                                : 'bg-secondary text-muted-foreground'
                          }`}>
                            {transaction.platform}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to Wallet</DialogTitle>
            <DialogDescription>
              Enter the amount you want to add to your advertising wallet
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="amount" 
                  placeholder="500" 
                  className="pl-9" 
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select defaultValue="card1">
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card1">Credit Card •••• 4242</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="add">+ Add New Payment Method</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFundsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFunds}>
              Add ${fundAmount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdWallet;
