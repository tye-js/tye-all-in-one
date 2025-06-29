'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export default function BackButton({ className, variant = 'ghost' }: BackButtonProps) {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <Button variant={variant} onClick={handleBack} className={className}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      Go Back
    </Button>
  );
}
