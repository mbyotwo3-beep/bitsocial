import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthToken, isUnauthorizedError } from '@/lib/authUtils';

interface WithdrawalRequest {
  id: number;
  senderId?: number;
  type: string;
  amount: number;
  status: string;
  destinationAddress?: string;
  createdAt: string;
  sender?: {
    id: number;
    username: string;
    email: string;
  };
}

export default function WithdrawalRequestsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<WithdrawalRequest[]>({
    queryKey: ['/api/admin/withdrawal-requests'],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch('/api/admin/withdrawal-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch withdrawal requests');
      return response.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/withdrawal-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to approve withdrawal');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal approved",
        description: "The withdrawal has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawal-requests'] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Approval failed",
        description: error.message || "Failed to approve withdrawal",
        variant: "destructive",
      });
    },
  });

  const denyMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/withdrawal-requests/${requestId}/deny`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to deny withdrawal');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal denied",
        description: "The withdrawal request has been denied.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawal-requests'] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Denial failed",
        description: error.message || "Failed to deny withdrawal",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (requestId: number) => {
    approveMutation.mutate(requestId);
  };

  const handleDeny = (requestId: number) => {
    denyMutation.mutate(requestId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const truncateAddress = (address?: string) => {
    if (!address) return 'N/A';
    if (address.length > 15) {
      return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`;
    }
    return address;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Requests</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review and approve user withdrawal requests
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="space-x-2">
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-20 inline-block"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16 inline-block"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pending requests</h3>
            <p className="text-gray-600 dark:text-gray-400">All withdrawal requests have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {request.sender?.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {request.sender?.username || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {request.sender?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.amount.toLocaleString()} sats
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {truncateAddress(request.destinationAddress)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(request.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={approveMutation.isPending || denyMutation.isPending}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm"
                        size="sm"
                      >
                        {approveMutation.isPending ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => handleDeny(request.id)}
                        disabled={approveMutation.isPending || denyMutation.isPending}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm"
                        size="sm"
                      >
                        {denyMutation.isPending ? 'Denying...' : 'Deny'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
