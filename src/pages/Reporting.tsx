
import { Suspense } from 'react';
import DashboardLayout from '@/components/layout/Dashboard';
import { Loader } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ReportingDashboard from '@/components/reporting/ReportingDashboard';

const Reporting = () => {
  return (
    <DashboardLayout title="Campaign Reporting" subtitle="Track campaign performance for both organic and paid media">
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center space-y-4">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading reporting dashboard...</p>
            </div>
          </div>
        }>
          <ReportingDashboard />
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
};

export default Reporting;
