// pages/investigations/index.tsx
import { useState, useEffect } from 'react'
import { InvestigationsTable } from '@/components/Investigations/investigations-table'
import { Investigation } from '@/interfaces/investigation'

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvestigations = async () => {
      try {
        // Replace this with your actual API call
        const response = await fetch('/api/investigations')
        const data = await response.json()
        setInvestigations(data)
      } catch (error) {
        console.error('Failed to fetch investigations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvestigations()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Investigations</h1>
      <InvestigationsTable investigations={investigations} />
    </div>
  )
}