'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  {
    key: 'home',
    name: 'Home',
    href: '/dashboard',
    isActive: (pathname: string) => pathname === '/dashboard',
    icon: (active: boolean) => (
      <svg
        className={cn('h-5 w-5', active ? 'text-foreground' : 'text-muted-foreground')}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    key: 'money',
    name: '$',
    href: '/dashboard/send',
    isActive: (pathname: string) =>
      pathname === '/dashboard/send' || pathname === '/dashboard/receive',
    icon: (active: boolean) => (
      <div
        className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center',
          active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
        )}
      >
        <span className="text-base font-semibold">$</span>
      </div>
    ),
  },
  {
    key: 'history',
    name: 'History',
    href: '/dashboard/transactions',
    isActive: (pathname: string) => pathname === '/dashboard/transactions',
    icon: (active: boolean) => (
      <svg
        className={cn('h-5 w-5', active ? 'text-foreground' : 'text-muted-foreground')}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
      )}
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
      }}
      aria-label="Bottom navigation"
    >
      <div className="container px-4">
        <div className="h-16 flex items-center justify-around">
          {items.map((item) => {
            const active = item.isActive(pathname)
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-md transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                {item.icon(active)}
                <span
                  className={cn(
                    'text-[11px] leading-none',
                    item.key === 'money' ? 'sr-only' : ''
                  )}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}


