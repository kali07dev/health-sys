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
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-5 shadow-lg border border-gray-800">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#555_0.5px,transparent_0.5px)] [background-size:10px_10px] opacity-[0.03]"></div>
      
      {/* Soft gradient overlays */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-red-500/5 blur-xl"></div>
      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-blue-500/5 blur-xl"></div>

      {/* Content */}
      <div className="relative">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1 text-xs font-medium text-gray-400 mb-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              href="/"
              className="flex items-center transition-colors hover:text-white p-1 rounded-md hover:bg-white/5"
            >
              <Home className="h-3.5 w-3.5" />
            </Link>
          </motion.div>

          {segments.length > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
          )}

          {segments.map((segment, index) => (
            <motion.div
              key={segment.path}
              className="flex items-center"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 300 }}
            >
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-gray-600 mx-0.5" />
              )}
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Link
                  href={segment.path}
                  className={`transition-colors px-1.5 py-0.5 rounded-md ${
                    segment.isLast 
                      ? 'text-red-400 font-semibold bg-white/5' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {segment.label}
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </nav>

        {/* Page Title */}
        <motion.h1 
          className="text-2xl font-semibold tracking-tight text-white mb-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 100 }}
        >
          {segments.length > 0 
            ? segments[segments.length - 1].label 
            : 'Dashboard'}
        </motion.h1>

        {/* Subtle Accent Line */}
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
        
        {/* Description text with fade-in */}
        {/* <motion.p 
          className="mt-2 text-xs text-gray-500 font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {segments.length > 0 
            ? `Manage your ${segments[segments.length - 1].label.toLowerCase()} settings and preferences`
            : 'Welcome to your dashboard'}
        </motion.p> */}
      </div>
    </div>
  );
}