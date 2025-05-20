
import React, { useState } from 'react';
import Dashboard from "@/components/layout/Dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletCard from '@/components/wallet/WalletCard';
import AdWallet from '@/components/wallet/AdWallet';

// Sample transaction data
const sampleTransactions = [
  {
    id: "tr1",
    type: "payment",
    description: "Campaign payment",
    amount: 1200,
    status: "completed",
    date: "2025-05-01"
  },
  {
    id: "tr2",
    type: "invoice",
    description: "Content creation invoice",
    amount: 750,
    status: "pending",
    date: "2025-05-10"
  },
  {
    id: "tr3",
    type: "withdrawal",
    description: "Bank withdrawal",
    amount: 500,
    status: "completed",
    date: "2025-04-28"
  },
  {
    id: "tr4", 
    type: "payment",
    description: "Ad revenue",
    amount: 350,
    status: "completed",
    date: "2025-04-15"
  },
  {
    id: "tr5",
    type: "invoice",
    description: "Influencer partnership",
    amount: 1500,
    status: "pending",
    date: "2025-05-18"
  }
] as const;

const Wallet = () => {
  const [activeTab, setActiveTab] = useState("general");
  
  return (
    <Dashboard 
      title="Wallet" 
      subtitle="Manage your payments and transactions"
      showSearch={false}
    >
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General Wallet</TabsTrigger>
          <TabsTrigger value="advertising">Advertising Wallet</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <WalletCard balance={3250} transactions={sampleTransactions} />
        </TabsContent>
        
        <TabsContent value="advertising">
          <AdWallet />
        </TabsContent>
      </Tabs>
    </Dashboard>
  );
};

export default Wallet;
