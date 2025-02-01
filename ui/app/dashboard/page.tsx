import React from 'react'
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

// Dummy API call function
const fetchDashboardData = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    recentIncidents: [
      { id: 1, title: 'Machine malfunction in sector B', severity: 'High', date: '2023-05-15' },
      { id: 2, title: 'Chemical spill in lab 3', severity: 'Medium', date: '2023-05-14' },
      { id: 3, title: 'Slip and fall in cafeteria', severity: 'Low', date: '2023-05-13' },
    ],
    safetyMetrics: {
      totalIncidents: 27,
      resolvedIncidents: 22,
      openIncidents: 5,
      safetyScore: 92,
    },
    urgentTasks: [
      { id: 1, title: 'Review incident report #1234', dueDate: '2023-05-18' },
      { id: 2, title: 'Approve safety training for new employees', dueDate: '2023-05-20' },
    ],
  }
}

const Dashboard = async () => {
  const dashboardData = await fetchDashboardData()

  return (

      <><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                  <div className="flex items-center">
                      <div className="flex-shrink-0">
                          <ChartBarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                          <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Safety Score</dt>
                              <dd>
                                  <div className="text-lg font-medium text-gray-900">{dashboardData.safetyMetrics.safetyScore}%</div>
                              </dd>
                          </dl>
                      </div>
                  </div>
              </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                  <div className="flex items-center">
                      <div className="flex-shrink-0">
                          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" aria-hidden="true" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                          <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Open Incidents</dt>
                              <dd>
                                  <div className="text-lg font-medium text-gray-900">{dashboardData.safetyMetrics.openIncidents}</div>
                              </dd>
                          </dl>
                      </div>
                  </div>
              </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                  <div className="flex items-center">
                      <div className="flex-shrink-0">
                          <CheckCircleIcon className="h-6 w-6 text-green-400" aria-hidden="true" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                          <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Resolved Incidents</dt>
                              <dd>
                                  <div className="text-lg font-medium text-gray-900">{dashboardData.safetyMetrics.resolvedIncidents}</div>
                              </dd>
                          </dl>
                      </div>
                  </div>
              </div>
          </div>
      </div><div className="mt-8">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Incidents</h2>
              <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
                  <ul role="list" className="divide-y divide-gray-200">
                      {dashboardData.recentIncidents.map((incident) => (
                          <li key={incident.id}>
                              <a href="#" className="block hover:bg-gray-50">
                                  <div className="px-4 py-4 sm:px-6">
                                      <div className="flex items-center justify-between">
                                          <p className="text-sm font-medium text-indigo-600 truncate">{incident.title}</p>
                                          <div className="ml-2 flex-shrink-0 flex">
                                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                  {incident.severity}
                                              </p>
                                          </div>
                                      </div>
                                      <div className="mt-2 sm:flex sm:justify-between">
                                          <div className="sm:flex">
                                              <p className="flex items-center text-sm text-gray-500">
                                                  <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                                  {incident.date}
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                              </a>
                          </li>
                      ))}
                  </ul>
              </div>
          </div><div className="mt-8">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Urgent Tasks</h2>
              <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
                  <ul role="list" className="divide-y divide-gray-200">
                      {dashboardData.urgentTasks.map((task) => (
                          <li key={task.id}>
                              <a href="#" className="block hover:bg-gray-50">
                                  <div className="px-4 py-4 sm:px-6">
                                      <div className="flex items-center justify-between">
                                          <p className="text-sm font-medium text-indigo-600 truncate">{task.title}</p>
                                          <div className="ml-2 flex-shrink-0 flex">
                                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                  Due {task.dueDate}
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                              </a>
                          </li>
                      ))}
                  </ul>
              </div>
          </div></>
    
  )
}

export default Dashboard