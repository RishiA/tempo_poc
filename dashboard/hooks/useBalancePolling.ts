import { useEffect, useRef, useState } from 'react';
import { useTokenBalances } from './useTokenBalances';
import { toast } from 'sonner';

/**
 * Hook to poll token balances and detect incoming payments
 * Shows toast notification when balance increases
 */
export function useBalancePolling(intervalMs: number = 10000, enabled: boolean = true) {
  const { balances, refetch, isLoading } = useTokenBalances();
  const prevBalancesRef = useRef<Record<string, string>>({});
  const [isPolling, setIsPolling] = useState(false);

  // Initialize previous balances
  useEffect(() => {
    if (!isLoading && balances.length > 0 && Object.keys(prevBalancesRef.current).length === 0) {
      const balanceMap: Record<string, string> = {};
      balances.forEach(token => {
        balanceMap[token.address] = token.balance;
      });
      prevBalancesRef.current = balanceMap;
    }
  }, [balances, isLoading]);

  // Poll balances and detect changes
  useEffect(() => {
    if (!enabled || isLoading) return;

    setIsPolling(true);
    const interval = setInterval(async () => {
      // Only poll if tab is active (performance optimization)
      if (document.hidden) return;

      await refetch();
      
      // Use the current balances state (not the refetch result)
      const currentBalances = balances;
      const prevBalances = prevBalancesRef.current;

      // Check for balance increases
      currentBalances.forEach(token => {
        const prevBalance = prevBalances[token.address];
        const currentBalance = token.balance;

        if (prevBalance && BigInt(currentBalance) > BigInt(prevBalance)) {
          // Balance increased - payment received!
          const diff = BigInt(currentBalance) - BigInt(prevBalance);
          const formattedDiff = (Number(diff) / Math.pow(10, token.decimals)).toFixed(token.decimals);
          
          toast.success('Payment Received!', {
            description: `+${formattedDiff} ${token.symbol}`,
            duration: 5000,
          });
        }

        // Update prev balance
        prevBalances[token.address] = currentBalance;
      });

      prevBalancesRef.current = prevBalances;
    }, intervalMs);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [enabled, intervalMs, isLoading, refetch]);

  return {
    balances,
    isPolling,
    isLoading,
  };
}
