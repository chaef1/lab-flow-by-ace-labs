
import React, { useState } from 'react';
import Dashboard from "@/components/layout/Dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletCard from '@/components/wallet/WalletCard';
import AdWallet from '@/components/wallet/AdWallet';

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
          <WalletCard />
        </TabsContent>
        
        <TabsContent value="advertising">
          <AdWallet />
        </TabsContent>
      </Tabs>
    </Dashboard>
  );
};

export default Wallet;
