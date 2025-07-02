import MainLayout from '@/components/layout/main-layout';
import HomeClient from '@/components/pages/home-client';

export default function Home() {
  return (
    <MainLayout locale="en">
      <HomeClient locale="en" />
    </MainLayout>
  );
}