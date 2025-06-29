import LoadingSpinner from '@/components/ui/loading-spinner';
import MainLayout from '@/components/layout/main-layout';

export default function Loading() {
  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    </MainLayout>
  );
}
