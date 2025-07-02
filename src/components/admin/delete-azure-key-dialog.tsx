'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface AzureKey {
  id: string;
  name: string;
  speechRegion: string;
  usedQuota: number;
  totalQuota: number;
}

interface DeleteAzureKeyDialogProps {
  azureKey: AzureKey | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isDeleting?: boolean;
}

export default function DeleteAzureKeyDialog({
  azureKey,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteAzureKeyDialogProps) {
  if (!azureKey) return null;

  const handleConfirm = () => {
    onConfirm(azureKey.id);
  };

  const usagePercentage = Math.round((azureKey.usedQuota / azureKey.totalQuota) * 100);
  const hasUsage = azureKey.usedQuota > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertDialogTitle>Delete Azure Key</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Are you sure you want to delete the Azure key <strong>"{azureKey.name}"</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="text-sm">
              <span className="font-medium">Region:</span> {azureKey.speechRegion}
            </div>
            <div className="text-sm">
              <span className="font-medium">Quota Usage:</span> {azureKey.usedQuota.toLocaleString()} / {azureKey.totalQuota.toLocaleString()} characters ({usagePercentage}%)
            </div>
          </div>

          {hasUsage && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Warning: This key has usage history</p>
                  <p>
                    This key has been used for {azureKey.usedQuota.toLocaleString()} characters.
                    Deleting it will permanently remove all usage data and statistics.
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-red-600 font-medium">
            This action cannot be undone.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              'Delete Key'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
