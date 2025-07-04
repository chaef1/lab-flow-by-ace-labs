
import Dashboard from '@/components/layout/Dashboard';
import BudgetEstimator from '@/components/budget/BudgetEstimator';

const BudgetEstimatorPage = () => {
  return (
    <Dashboard 
      title="Budget Estimator" 
      subtitle="Calculate project costs based on creator tiers and requirements"
    >
      <BudgetEstimator />
    </Dashboard>
  );
};

export default BudgetEstimatorPage;
