'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface AzureKey {
  id: string;
  name: string;
  speechKey: string;
  speechRegion: string;
  totalQuota: number;
  usedQuota: number;
  isActive: boolean;
  notes?: string;
}

interface AzureKeyFormProps {
  azureKey?: AzureKey | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function AzureKeyForm({ azureKey, onSubmit, onCancel }: AzureKeyFormProps) {
  const [formData, setFormData] = useState({
    name: azureKey?.name || '',
    speechKey: azureKey?.speechKey || '',
    speechRegion: azureKey?.speechRegion || '',
    totalQuota: azureKey?.totalQuota || 2000000,
    isActive: azureKey?.isActive ?? true,
    notes: azureKey?.notes || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.speechKey.trim() || !formData.speechRegion.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const url = azureKey 
        ? `/api/admin/azure-keys/${azureKey.id}`
        : '/api/admin/azure-keys';
      
      const method = azureKey ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(`Azure key ${azureKey ? 'updated' : 'created'} successfully`);
        onSubmit();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${azureKey ? 'update' : 'create'} Azure key`);
      }
    } catch (error) {
      console.error('Failed to submit form:', error);
      toast.error(`Failed to ${azureKey ? 'update' : 'create'} Azure key`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Azure regions for dropdown
  const azureRegions = [
    'eastus', 'eastus2', 'westus', 'westus2', 'westus3',
    'centralus', 'northcentralus', 'southcentralus',
    'westcentralus', 'canadacentral', 'canadaeast',
    'brazilsouth', 'northeurope', 'westeurope',
    'uksouth', 'ukwest', 'francecentral', 'francesouth',
    'germanywestcentral', 'norwayeast', 'switzerlandnorth',
    'swedencentral', 'eastasia', 'southeastasia',
    'japaneast', 'japanwest', 'koreacentral', 'koreasouth',
    'southindia', 'centralindia', 'westindia',
    'australiaeast', 'australiasoutheast', 'australiacentral',
    'southafricanorth', 'uaenorth'
  ];

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {azureKey ? 'Edit Azure Key' : 'Add New Azure Key'}
          </DialogTitle>
          <DialogDescription>
            {azureKey 
              ? 'Update the Azure Speech Service key configuration.'
              : 'Add a new Azure Speech Service key with quota management.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Primary Key, Backup Key"
              className="mt-1"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              A descriptive name for this Azure key
            </p>
          </div>

          {/* Speech Key */}
          <div>
            <Label htmlFor="speechKey">Azure Speech API Key *</Label>
            <Input
              id="speechKey"
              type="password"
              value={formData.speechKey}
              onChange={(e) => handleInputChange('speechKey', e.target.value)}
              placeholder="Your Azure Speech Service API key"
              className="mt-1"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              The API key from your Azure Speech Service resource
            </p>
          </div>

          {/* Speech Region */}
          <div>
            <Label htmlFor="speechRegion">Azure Region *</Label>
            <select
              id="speechRegion"
              value={formData.speechRegion}
              onChange={(e) => handleInputChange('speechRegion', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a region</option>
              {azureRegions.map(region => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              The Azure region where your Speech Service is deployed
            </p>
          </div>

          {/* Total Quota */}
          <div>
            <Label htmlFor="totalQuota">Total Quota (Characters)</Label>
            <Input
              id="totalQuota"
              type="number"
              value={formData.totalQuota}
              onChange={(e) => handleInputChange('totalQuota', parseInt(e.target.value) || 0)}
              min="1"
              step="1000"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum number of characters allowed for this key (default: 2,000,000)
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Active Status</Label>
              <p className="text-sm text-gray-500">
                Whether this key should be available for use
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Optional notes about this Azure key..."
              className="mt-1"
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              Additional information or notes about this key
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {azureKey ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                azureKey ? 'Update Key' : 'Create Key'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
