import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { getAuthToken } from '@/lib/authUtils';
import { useToast } from '@/hooks/use-toast';
import { X, Zap } from 'lucide-react';

interface TipModalProps {
  recipientId: number;
  recipientUsername: string;
  onClose: () => void;
  onTipSent: () => void;
}

export default function TipModal({ recipientId, recipientUsername, onClose, onTipSent }: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const { toast } = useToast();

  const tipMutation = useMutation({
    mutationFn: async (amount: number) => {
      const token = getAuthToken();
      const response = await fetch('/api/lightning/tip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: recipientId,
          amount,
          message: `Tip from SatStream`
        }),
      });
      if (!response.ok) throw new Error('Failed to send tip');
      return response.json();
    },
    onSuccess: () => {
      onTipSent();
    },
    onError: (error: any) => {
      toast({
        title: "Tip failed",
        description: error.message || "Failed to send tip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendTip = () => {
    const amount = selectedAmount || parseInt(customAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please select or enter a valid tip amount.",
        variant: "destructive",
      });
      return;
    }

    tipMutation.mutate(amount);
  };

  const quickAmounts = [100, 500, 1000, 2500, 5000];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Send Tip</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {recipientUsername.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300">Sending tip to</p>
            <p className="font-semibold text-gray-900 dark:text-white">@{recipientUsername}</p>
          </div>

          {/* Quick Amount Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {quickAmounts.slice(0, 3).map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount('');
                  }}
                  className={`p-3 text-center ${
                    selectedAmount === amount
                      ? 'border-bitcoin bg-bitcoin/10 text-bitcoin'
                      : 'hover:border-bitcoin'
                  }`}
                >
                  <div>
                    <div className="text-lg font-semibold">{amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">sats</div>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {quickAmounts.slice(3).map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount('');
                  }}
                  className={`p-3 text-center ${
                    selectedAmount === amount
                      ? 'border-bitcoin bg-bitcoin/10 text-bitcoin'
                      : 'hover:border-bitcoin'
                  }`}
                >
                  <div>
                    <div className="text-lg font-semibold">{amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">sats</div>
                  </div>
                </Button>
              ))}
            </div>
            
            {/* Custom Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Custom Amount
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Enter sats amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className="pr-12"
                />
                <span className="absolute right-3 top-3 text-gray-500 text-sm">sats</span>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendTip}
            disabled={tipMutation.isPending || (!selectedAmount && !customAmount)}
            className="w-full bg-bitcoin hover:bg-bitcoin/90 text-white font-medium"
          >
            <Zap className="w-4 h-4 mr-2" />
            {tipMutation.isPending ? 'Sending...' : 'Send Tip'}
          </Button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Tips are sent instantly via Lightning Network
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
