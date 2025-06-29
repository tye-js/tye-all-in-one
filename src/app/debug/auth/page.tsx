'use client';

import { useSession } from 'next-auth/react';

export default function AuthDebugPage() {
  const { data: session, status } = useSession();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {status}
        </div>
        
        <div>
          <strong>Session:</strong>
          <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>User Role:</strong> {session?.user?.role || 'Not available'}
        </div>
        
        <div>
          <strong>User ID:</strong> {session?.user?.id || 'Not available'}
        </div>
      </div>
    </div>
  );
}
