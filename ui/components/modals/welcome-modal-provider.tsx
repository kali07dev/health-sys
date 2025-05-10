"use client"

import { useState, useEffect } from "react"
import WelcomeModal from "./welcome-modal"

const STORAGE_KEY = "vpc_welcome_modal_seen"

export default function WelcomeModalProvider() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if this is the first visit
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY)

    if (!hasSeenWelcome) {
      // Show the modal on first visit
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    // Mark as seen in localStorage
    localStorage.setItem(STORAGE_KEY, "true")
  }

  return <WelcomeModal isOpen={isOpen} onClose={handleClose} />
}
