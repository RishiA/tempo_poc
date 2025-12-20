import { useAccount, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { TEMPO_TOKENS } from '@/lib/constants';
import { ERC20_ABI } from '@/lib/abi';

export interface TokenBalance {
  address: string;
  name: string;
  symbol: string;
  balance: string;
  formatted: string;
  decimals: number;
  isLoading: boolean;
  error: Error | null;
}

export function useTokenBalances() {
  const { address } = useAccount();

  const tokens = Object.entries(TEMPO_TOKENS);

  // Create contract read calls for all tokens
  const contracts = tokens.flatMap(([, tokenAddress]) => [
    {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
    },
    {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'symbol',
    },
    {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'decimals',
    },
  ]);

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Parse results into token balances
  const balances: TokenBalance[] = tokens.map(([name, tokenAddress], index) => {
    const balanceIndex = index * 3;
    const symbolIndex = index * 3 + 1;
    const decimalsIndex = index * 3 + 2;

    const balanceResult = data?.[balanceIndex];
    const symbolResult = data?.[symbolIndex];
    const decimalsResult = data?.[decimalsIndex];

    let balance: bigint = 0n;
    if (balanceResult?.status === 'success') {
      const result = balanceResult.result;
      balance = typeof result === 'bigint' ? result : BigInt((result as any) || 0);
    }
    
    const symbol = symbolResult?.status === 'success' ? (symbolResult.result as string) : name;
    const decimals = decimalsResult?.status === 'success' ? Number(decimalsResult.result as any) : 18;

    const formatted = formatUnits(balance, decimals);

    return {
      address: tokenAddress,
      name,
      symbol,
      balance: balance.toString(),
      formatted,
      decimals,
      isLoading,
      error: error as Error | null,
    };
  });

  // Calculate total balance in USD (assuming 1:1 for stablecoins)
  const totalBalance = balances.reduce((sum, token) => {
    return sum + parseFloat(token.formatted || '0');
  }, 0);

  return {
    balances,
    totalBalance: totalBalance.toFixed(2),
    isLoading,
    error,
    refetch,
  };
}

