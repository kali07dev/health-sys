'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  ClipboardDocumentListIcon, 
  ChartBarIcon, 
  CogIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline'

const navItems = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Incidents', href: '/incidents', icon: ClipboardDocumentListIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Alerts', href: '/alerts', icon: BellAlertIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

const Sidebar: React.FC = () => {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full bg-gray-100 border-r border-gray-200">
      <div className="flex items-center justify-center h-16 bg-white">
        <img className="h-8 w-auto" src="/logo.png" alt="Your logo" />
      </div>
      <nav className="mt-5 flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${
                isActive
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
            >
              <item.icon
                className={`${
                  isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                } mr-3 flex-shrink-0 h-6 w-6`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default Sidebar