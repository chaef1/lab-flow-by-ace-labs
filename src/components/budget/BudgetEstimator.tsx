
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Calculator } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';

interface CreatorTier {
  name: string;
  baseRate: number;
  count: number;
}

interface BudgetBreakdown {
  creatorCosts: {
    nano: number;
    micro: number;
    midTier: number;
    macro: number;
    total: number;
    totalWithMargin: number;
  };
  creativeHours: number;
  creativeCost: number;
  subtotal: number;
  agencyFee: number;
  totalCampaignCost: number;
  isValid: boolean;
  minimumNotMet: boolean;
}

const BudgetEstimator = () => {
  const [creators, setCreators] = useState<CreatorTier[]>([
    { name: 'Nano', baseRate: 6000, count: 0 },
    { name: 'Micro', baseRate: 15000, count: 0 },
    { name: 'Mid Tier', baseRate: 28000, count: 0 },
    { name: 'Macro', baseRate: 55000, count: 0 }
  ]);
  
  const [creativeHours, setCreativeHours] = useState<number>(4);
  const [breakdown, setBreakdown] = useState<BudgetBreakdown | null>(null);

  const CREATIVE_RATE = 2786; // per hour
  const AGENCY_FEE_RATE = 0.30; // 30%
  const CREATOR_MARGIN = 0.12; // 12%
  const MINIMUM_CAMPAIGN_BUDGET = 50000;
  const MINIMUM_CREATIVE_HOURS = 4;

  const calculateBudget = () => {
    // Calculate creator costs
    const creatorCosts = {
      nano: creators[0].count * creators[0].baseRate,
      micro: creators[1].count * creators[1].baseRate,
      midTier: creators[2].count * creators[2].baseRate,
      macro: creators[3].count * creators[3].baseRate,
      total: 0,
      totalWithMargin: 0
    };

    creatorCosts.total = creatorCosts.nano + creatorCosts.micro + creatorCosts.midTier + creatorCosts.macro;
    creatorCosts.totalWithMargin = creatorCosts.total * (1 + CREATOR_MARGIN);

    // Calculate creative costs
    const finalCreativeHours = Math.max(creativeHours, MINIMUM_CREATIVE_HOURS);
    const creativeCost = finalCreativeHours * CREATIVE_RATE;

    // Calculate subtotal (before agency fee)
    const subtotal = creatorCosts.totalWithMargin + creativeCost;

    // Calculate agency fee
    const agencyFee = subtotal * AGENCY_FEE_RATE;

    // Calculate total campaign cost
    const totalCampaignCost = subtotal + agencyFee;

    // Check if minimum budget is met
    const minimumNotMet = creatorCosts.totalWithMargin < MINIMUM_CAMPAIGN_BUDGET;
    const isValid = !minimumNotMet && creatorCosts.total > 0;

    const newBreakdown: BudgetBreakdown = {
      creatorCosts,
      creativeHours: finalCreativeHours,
      creativeCost,
      subtotal,
      agencyFee,
      totalCampaignCost,
      isValid,
      minimumNotMet
    };

    setBreakdown(newBreakdown);
  };

  const updateCreatorCount = (index: number, count: number) => {
    const newCreators = [...creators];
    newCreators[index].count = Math.max(0, count);
    setCreators(newCreators);
  };

  const resetForm = () => {
    setCreators(prev => prev.map(creator => ({ ...creator, count: 0 })));
    setCreativeHours(4);
    setBreakdown(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Project Budget Estimator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Creator Inputs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Creator Requirements</h3>
            <div className="grid grid-cols-2 gap-4">
              {creators.map((creator, index) => (
                <div key={creator.name} className="space-y-2">
                  <Label htmlFor={`creator-${index}`}>
                    {creator.name} ({formatCurrency(creator.baseRate)} each)
                  </Label>
                  <Input
                    id={`creator-${index}`}
                    type="number"
                    min="0"
                    value={creator.count}
                    onChange={(e) => updateCreatorCount(index, parseInt(e.target.value) || 0)}
                    placeholder="Number of creators"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Creative Hours Input */}
          <div className="space-y-2">
            <Label htmlFor="creative-hours">
              Creative & Ideation Hours (Min: {MINIMUM_CREATIVE_HOURS} hrs @ {formatCurrency(CREATIVE_RATE)}/hr)
            </Label>
            <Input
              id="creative-hours"
              type="number"
              min={MINIMUM_CREATIVE_HOURS}
              value={creativeHours}
              onChange={(e) => setCreativeHours(Math.max(MINIMUM_CREATIVE_HOURS, parseInt(e.target.value) || MINIMUM_CREATIVE_HOURS))}
              placeholder="Hours required"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={calculateBudget} className="flex-1">
              Calculate Budget
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Budget Breakdown */}
      {breakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {breakdown.minimumNotMet && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Warning: Creator budget ({formatCurrency(breakdown.creatorCosts.totalWithMargin)}) is below the minimum campaign budget of {formatCurrency(MINIMUM_CAMPAIGN_BUDGET)}.
                </AlertDescription>
              </Alert>
            )}

            {/* Creator Costs Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold">Creator Costs</h4>
              <div className="space-y-2 text-sm">
                {creators.map((creator, index) => {
                  const cost = creator.count * creator.baseRate;
                  const costWithMargin = cost * (1 + CREATOR_MARGIN);
                  if (creator.count > 0) {
                    return (
                      <div key={creator.name} className="flex justify-between">
                        <span>{creator.name} ({creator.count} × {formatCurrency(creator.baseRate)})</span>
                        <div className="text-right">
                          <div>{formatCurrency(cost)}</div>
                          <div className="text-xs text-muted-foreground">
                            +12% margin: {formatCurrency(costWithMargin)}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Creator Costs (with margin)</span>
                  <span>{formatCurrency(breakdown.creatorCosts.totalWithMargin)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Creative Costs */}
            <div className="flex justify-between">
              <span>Creative & Ideation ({breakdown.creativeHours} hrs × {formatCurrency(CREATIVE_RATE)})</span>
              <span>{formatCurrency(breakdown.creativeCost)}</span>
            </div>

            <Separator />

            {/* Subtotal */}
            <div className="flex justify-between font-medium">
              <span>Subtotal</span>
              <span>{formatCurrency(breakdown.subtotal)}</span>
            </div>

            {/* Agency Fee */}
            <div className="flex justify-between">
              <span>Agency Fee (30%)</span>
              <span>{formatCurrency(breakdown.agencyFee)}</span>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between text-lg font-bold">
              <span>Total Campaign Cost</span>
              <span className={breakdown.isValid ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(breakdown.totalCampaignCost)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetEstimator;
