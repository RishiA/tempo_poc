import { NextResponse } from 'next/server'
import { createPublicClient, formatUnits, http, parseAbiItem } from 'viem'
import { TOKEN_METADATA, TEMPO_TESTNET } from '@/lib/constants'

type Direction = 'sent' | 'received'

export type TransferRow = {
  kind: 'transfer'
  hash: `0x${string}`
  logIndex: number
  tokenAddress: `0x${string}`
  tokenSymbol: string
  amount: string
  from: `0x${string}`
  to: `0x${string}`
  direction: Direction
  blockNumber: number
  timestamp: number // unix seconds
}

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value)
}

async function findBlockAtOrAfterTimestamp(args: {
  client: ReturnType<typeof createPublicClient>
  latestBlockNumber: bigint
  targetTimestamp: bigint
}): Promise<bigint> {
  const { client, latestBlockNumber, targetTimestamp } = args
  let lo = 0n
  let hi = latestBlockNumber

  while (lo < hi) {
    const mid = (lo + hi) / 2n
    const block = await client.getBlock({ blockNumber: mid })
    if ((block.timestamp as bigint) < targetTimestamp) lo = mid + 1n
    else hi = mid
  }

  return lo
}

async function getLogsChunked(args: {
  client: ReturnType<typeof createPublicClient>
  address: `0x${string}`
  event: ReturnType<typeof parseAbiItem>
  filterArgs: { from?: `0x${string}`; to?: `0x${string}` }
  fromBlock: bigint
  toBlock: bigint
  maxBlockRange?: bigint
}) {
  const { client, address, event, filterArgs, fromBlock, toBlock } = args
  const maxBlockRange = args.maxBlockRange ?? 100_000n

  // Tempo RPC rejects getLogs queries exceeding max block range (e.g. 100000).
  // Split the query into chunks and merge results.
  const logs = []
  let start = fromBlock
  while (start <= toBlock) {
    const end = start + maxBlockRange - 1n <= toBlock ? start + maxBlockRange - 1n : toBlock
    const chunk = await client.getLogs({
      address,
      event,
      args: filterArgs,
      fromBlock: start,
      toBlock: end,
    })
    logs.push(...chunk)
    start = end + 1n
  }

  return logs
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const addressParam = searchParams.get('address') ?? ''
    const fromDaysParam = searchParams.get('fromDays') ?? '7'
    const fromDays = Math.min(Math.max(Number(fromDaysParam) || 7, 1), 30)

    if (!isAddress(addressParam)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const rpcUrl = TEMPO_TESTNET.rpcUrls.default.http[0]
    const client = createPublicClient({ transport: http(rpcUrl) })

    const latestBlockNumber = await client.getBlockNumber()
    const latestBlock = await client.getBlock({ blockNumber: latestBlockNumber })

    const nowTs = latestBlock.timestamp as bigint
    const targetTs = nowTs - BigInt(fromDays) * 24n * 60n * 60n

    const fromBlock = await findBlockAtOrAfterTimestamp({
      client,
      latestBlockNumber,
      targetTimestamp: targetTs,
    })

    const transferEvent = parseAbiItem(
      'event Transfer(address indexed from, address indexed to, uint256 value)'
    )

    const tokenEntries = Object.entries(TOKEN_METADATA) as Array<
      [`0x${string}`, { symbol: string; decimals: number; address: `0x${string}` }]
    >

    const allLogs = await Promise.all(
      tokenEntries.map(async ([tokenAddress, meta]) => {
        const [sent, received] = await Promise.all([
          getLogsChunked({
            client,
            address: tokenAddress,
            event: transferEvent,
            filterArgs: { from: addressParam },
            fromBlock,
            toBlock: latestBlockNumber,
          }),
          getLogsChunked({
            client,
            address: tokenAddress,
            event: transferEvent,
            filterArgs: { to: addressParam },
            fromBlock,
            toBlock: latestBlockNumber,
          }),
        ])

        return { meta, logs: [...sent, ...received] }
      })
    )

    // Gather timestamps by block number (avoid refetching same block)
    const blockNumbers = new Set<bigint>()
    for (const { logs } of allLogs) {
      for (const l of logs) {
        if (typeof l.blockNumber === 'bigint') blockNumbers.add(l.blockNumber)
      }
    }

    const blockTimestampMap = new Map<bigint, number>()
    await Promise.all(
      Array.from(blockNumbers).map(async (bn) => {
        const b = await client.getBlock({ blockNumber: bn })
        blockTimestampMap.set(bn, Number(b.timestamp as bigint))
      })
    )

    const rows: TransferRow[] = []
    const seen = new Set<string>() // txHash:logIndex

    for (const { meta, logs } of allLogs) {
      for (const l of logs) {
        const txHash = l.transactionHash as `0x${string}` | null
        const bn = l.blockNumber as bigint | null
        const logIndex = typeof l.logIndex === 'number' ? l.logIndex : Number(l.logIndex ?? 0)

        if (!txHash || !bn) continue
        const dedupeKey = `${txHash}:${logIndex}`
        if (seen.has(dedupeKey)) continue
        seen.add(dedupeKey)

        const args = (l as unknown as { args?: { from?: `0x${string}`; to?: `0x${string}`; value?: bigint } })
          .args

        const from = args?.from
        const to = args?.to
        const value = args?.value

        if (!from || !to || typeof value !== 'bigint') continue

        const direction: Direction =
          from.toLowerCase() === addressParam.toLowerCase() ? 'sent' : 'received'

        rows.push({
          kind: 'transfer',
          hash: txHash,
          logIndex,
          tokenAddress: meta.address,
          tokenSymbol: meta.symbol,
          amount: formatUnits(value, meta.decimals),
          from,
          to,
          direction,
          blockNumber: Number(bn),
          timestamp: blockTimestampMap.get(bn) ?? 0,
        })
      }
    }

    rows.sort((a, b) => {
      if (a.timestamp !== b.timestamp) return b.timestamp - a.timestamp
      if (a.blockNumber !== b.blockNumber) return b.blockNumber - a.blockNumber
      return b.logIndex - a.logIndex
    })

    return NextResponse.json({
      address: addressParam,
      fromDays,
      fromBlock: Number(fromBlock),
      toBlock: Number(latestBlockNumber),
      transfers: rows,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


