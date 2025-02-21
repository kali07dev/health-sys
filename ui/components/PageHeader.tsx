// components/PageHeader.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbSegment {
  label: string;
  path: string;
  isLast: boolean;
}

export default function PageHeader() {
  const pathname = usePathname();
  
  // Format the pathname into breadcrumb segments
  const getSegments = (path: string): BreadcrumbSegment[] => {
    const segments = path.split('/').filter(Boolean);
    return segments.map((segment, index) => ({
      label: segment.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      path: '/' + segments.slice(0, index + 1).join('/'),
      isLast: index === segments.length - 1
    }));
  };

  const segments = getSegments(pathname);

  return (
    <div className="relative mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 p-6 shadow-lg">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-600/10 blur-3xl"></div>
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-900/10 blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1 text-sm font-medium text-gray-400">
          <Link 
            href="/"
            className="flex items-center transition-colors hover:text-white"
          >
            <Home className="h-4 w-4" />
          </Link>

          {segments.length > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          )}

          {segments.map((segment, index) => (
            <motion.div
              key={segment.path}
              className="flex items-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
              
              <Link
                href={segment.path}
                className={`ml-1 transition-colors ${
                  segment.isLast 
                    ? 'text-red-500 hover:text-red-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {segment.label}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Page Title */}
        <motion.h1 
          className="mt-2 text-3xl font-bold tracking-tight text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {segments.length > 0 
            ? segments[segments.length - 1].label 
            : 'Dashboard'}
        </motion.h1>

        {/* Subtle Accent Line */}
        <motion.div
          className="mt-4 h-0.5 w-20 bg-gradient-to-r from-red-500 to-blue-900"
          initial={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ delay: 0.3 }}
        />
      </div>
    </div>
  );
}