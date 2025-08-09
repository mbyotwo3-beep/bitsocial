import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthToken, isUnauthorizedError } from '@/lib/authUtils';
import { ArrowLeft, Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, Info } from 'lucide-react';
import { Link } from 'wouter';

interface Transaction {
  id: number;
  senderId?: number;
  receiverId?: number;
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
  receiver?: {
    id: number;
    username: string;
    email: string;
  };
}

export default function Wallet() {
  const { user, isLoading } = useAuthContext();
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [amount, setAmount] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
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
  }, [user, isLoading, toast]);

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', user?.id],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch(`/api/transactions/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!user,
  });

  const withdrawalMutation = useMutation({
    mutationFn: async ({ destinationAddress, amount }: { destinationAddress: string; amount: number }) => {
      const token = getAuthToken();
      const response = await fetch('/api/lightning/withdraw-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ destinationAddress, amount }),
      });
      if (!response.ok) throw new Error('Failed to create withdrawal request');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal request has been submitted for admin review.",
      });
      setDestinationAddress('');
      setAmount('');
      setShowWithdrawForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
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
        title: "Withdrawal failed",
        description: error.message || "Failed to create withdrawal request",
        variant: "destructive",
      });
    },
  });

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseInt(amount);
    
    if (!destinationAddress || !withdrawAmount) {
      toast({
        title: "Invalid input",
        description: "Please enter both destination address and amount",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount > (user?.balance || 0)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough sats to withdraw this amount",
        variant: "destructive",
      });
      return;
    }

    withdrawalMutation.mutate({ destinationAddress, amount: withdrawAmount });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === 'withdrawal') {
      return <ArrowUpRight className="w-5 h-5 text-bitcoin" />;
    }
    if (transaction.senderId === user?.id) {
      return <ArrowUpRight className="w-5 h-5 text-bitcoin" />;
    }
    return <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />;
  };

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.type === 'withdrawal') {
      return `Withdrawal to ${transaction.destinationAddress?.substring(0, 10)}...`;
    }
    if (transaction.senderId === user?.id) {
      return `Tip sent to @${transaction.receiver?.username || 'Unknown'}`;
    }
    return `Tip received from @${transaction.sender?.username || 'Unknown'}`;
  };

  const getTransactionAmount = (transaction: Transaction) => {
    if (transaction.type === 'withdrawal' || transaction.senderId === user?.id) {
      return `-${transaction.amount.toLocaleString()}`;
    }
    return `+${transaction.amount.toLocaleString()}`;
  };

  const getTransactionColor = (transaction: Transaction) => {
    if (transaction.type === 'withdrawal' || transaction.senderId === user?.id) {
      return 'text-bitcoin';
    }
    return 'text-green-600 dark:text-green-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark">
        <div className="text-center">
          <div className="w-8 h-8 bitcoin-gradient rounded-lg flex items-center justify-center mx-auto mb-4">
            <WalletIcon className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark">
      <header className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Balance Card */}
        <div className="bitcoin-gradient rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Your Balance</p>
              <p className="text-3xl font-bold">{user?.balance?.toLocaleString() || 0} sats</p>
              <p className="text-white/60 text-sm mt-1">
                ≈ ${((user?.balance || 0) * 0.00025).toFixed(2)} USD
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <WalletIcon className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="hover:border-bitcoin transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowDownLeft className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-medium text-gray-900 dark:text-white">Receive</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get Lightning invoice</p>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:border-bitcoin transition-colors cursor-pointer"
            onClick={() => setShowWithdrawForm(!showWithdrawForm)}
          >
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-bitcoin/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowUpRight className="w-6 h-6 text-bitcoin" />
                </div>
                <p className="font-medium text-gray-900 dark:text-white">Withdraw</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Send to external wallet</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw Form */}
        {showWithdrawForm && (
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="destinationAddress">Destination Address</Label>
                  <Input
                    id="destinationAddress"
                    type="text"
                    placeholder="Bitcoin address or Lightning invoice"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (sats)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount to withdraw"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={user?.balance || 0}
                    required
                  />
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex">
                    <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium">Withdrawal Process</p>
                      <p>Your withdrawal request will be reviewed by admins. Processing typically takes 2-24 hours.</p>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-bitcoin hover:bg-bitcoin/90 text-white"
                  disabled={withdrawalMutation.isPending}
                >
                  {withdrawalMutation.isPending ? 'Submitting...' : 'Submit Withdrawal Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <WalletIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        {getTransactionIcon(transaction)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getTransactionDescription(transaction)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.status === 'pending' && (
                            <span className="text-yellow-600 dark:text-yellow-400">Pending • </span>
                          )}
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getTransactionColor(transaction)}`}>
                        {getTransactionAmount(transaction)} sats
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
