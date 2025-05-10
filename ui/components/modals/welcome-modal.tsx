"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CuboidIcon as Cube, FileText, BarChart3, MousePointerClick } from "lucide-react"
import { useOnClickOutside } from "@/hooks/use-click-outside"
import { cn } from "@/lib/utils"

export interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) as NodeListOf<HTMLElement>

      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key === "Tab") {
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault()
              lastElement.focus()
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault()
              firstElement.focus()
            }
          }
        }

        firstElement.focus()
        window.addEventListener("keydown", handleTabKey)
        return () => window.removeEventListener("keydown", handleTabKey)
      }
    }
  }, [isOpen])

  // Handle click outside
  // The modalRef is correctly typed as RefObject<HTMLDivElement>
  // but TypeScript is inferring it as RefObject<HTMLDivElement | null>
  // We can safely use it with the hook as the null check happens inside the hook
  useOnClickOutside(modalRef as React.RefObject<HTMLElement>, onClose)

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
  }

  const modalVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.98,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            className={cn(
              "relative w-[95vw] max-w-[480px] bg-neutral-50 rounded-xl shadow-2xl",
              "p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto",
            )}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-modal-title"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className={cn(
                "absolute top-4 right-4 p-2 rounded-full",
                "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                "hover:scale-[1.02] transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2",
              )}
              aria-label="Close modal"
            >
              <X className="w-6 h-6 stroke-2" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 rounded-lg">
                <Cube className="w-8 h-8 text-red-600 stroke-2" aria-hidden="true" />
              </div>
              <h2 id="welcome-modal-title" className="text-2xl font-bold text-gray-900">
                VPC Management Guide
              </h2>
            </div>

            {/* Content */}
            <div className="space-y-6 text-gray-700">
              <section>
                <h3 className="text-lg font-semibold mb-3">As an Admin, you can:</h3>
                <ul className="space-y-4">
                  <FeatureItem
                    icon={<FileText className="w-6 h-6 text-red-600" />}
                    title="Create new VPC networks"
                    description="Set up and configure new Visible Person Commitment networks for your organization."
                  />
                  <FeatureItem
                    icon={<BarChart3 className="w-6 h-6 text-red-600" />}
                    title="Generate summary reports"
                    description="Get quick overviews of VPC performance and status across your organization."
                  />
                  <FeatureItem
                    icon={<FileText className="w-6 h-6 text-red-600" />}
                    title="Produce detailed technical reports"
                    description="Access comprehensive data and analytics for in-depth analysis."
                  />
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Landing Page Actions:</h3>
                <ul className="space-y-4">
                  <FeatureItem
                    icon={<MousePointerClick className="w-6 h-6 text-red-600" />}
                    title="Card clicks → Full VPC details"
                    description="Click on any VPC card to view complete details and management options."
                  />
                  <FeatureItem
                    icon={<BarChart3 className="w-6 h-6 text-red-600" />}
                    title="'Generate Report' button → Summary reports"
                    description="Use the report button to quickly generate and view summary reports."
                  />
                </ul>
              </section>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className={cn(
                  "w-full py-3 px-4 rounded-lg font-medium",
                  "bg-red-600 text-white hover:bg-red-700",
                  "shadow-sm hover:shadow-md",
                  "hover:scale-[1.02] transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2",
                )}
              >
                Get Started
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface FeatureItemProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <li className="flex gap-3">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </li>
  )
}
