'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart } from '@mui/x-charts/PieChart'
import { BarChart } from '@mui/x-charts/BarChart'
import confetti from 'canvas-confetti'

type ProfileData = {
  user: {
    auditRatio: number
    email: string
    firstName: string
    lastName: string
    login: string
    totalDown: number
    totalUp: number
  }[]
  audit: {
    auditorLogin: string
    closureType: string
    result?: { path?: string }
  }[]
  event_user: {
    level: string
    userId: number
    userLogin: string
    eventId: number
  }[]
  transaction: {
    amount: number
    path: string
    type: string
    userLogin: string
    eventId: number
  }[]
  transaction_aggregate: {
    aggregate: {
      sum: {
        amount: number
      } | null
    } | null
  } | null
}

function isJwtExpired(token: string): boolean {
  try {
    const [, payloadBase64] = token.split('.')
    const payload = JSON.parse(atob(payloadBase64))
    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp < currentTime
  } catch (err) {
    console.error('JWT decode failed:', err)
    return true
  }
}

const query = `
  query User {
    user {
      auditRatio
      email
      firstName
      lastName
      login
      totalDown
      totalUp
      groupsByCaptainid {
        campus
        captainId
        captainLogin
        createdAt
        eventId
        id
        objectId
        path
        status
        updatedAt
      }
    }
      audit {
        auditorLogin
        closureType
          result {

        path
   
    }
    }
    event_user(where: { eventId: { _in: [72, 20, 250, 763] } }) {
      level
      userId
      userLogin
      eventId
    }
    transaction {
      amount
      path
      type
      userLogin
      eventId
    }
    transaction_aggregate(
      where: {
        event: { path: { _eq: "/bahrain/bh-module" } }
        type: { _eq: "xp" }
      }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
  }
`

export default function ProfilePage() {
const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const router = useRouter()
  const user = profileData?.user?.[0]
  const totalModuleXP = profileData?.transaction_aggregate?.aggregate?.sum?.amount ?? 0
  const transactions = profileData?.transaction ?? []

  const eventUserList = profileData?.event_user ?? []
const userLevelEntry = eventUserList.find(
  (entry: { userLogin: string }) => entry.userLogin === user?.login
)
  const userLevel = userLevelEntry?.level ?? 'N/A'

  const auditEntries = profileData?.audit ?? []
  const currentLogin = user?.login
const filteredAudits = auditEntries.filter(
  (a: { auditorLogin: string }) => a.auditorLogin !== currentLogin
)
const uniquePassedPaths = new Set()
const uniqueFailedPaths = new Set()

filteredAudits.forEach((audit: { closureType: string; result?: { path?: string } }) => {
  const path = audit.result?.path
  if (!path) return // skip nulls

  if (audit.closureType === 'succeeded') {
    uniquePassedPaths.add(path)
  } else if (audit.closureType === 'failed') {
    uniqueFailedPaths.add(path)
  }
})

const passCount = uniquePassedPaths.size
const failCount = uniqueFailedPaths.size

  const auditChartData = [
    { id: 0, value: passCount, label: 'Pass', color: '#a78bfa' },
    { id: 1, value: failCount, label: 'Fail', color: '#fca5a5' }
  ]

  const xpByProject: { [key: string]: number } = {}
transactions.forEach((entry: { type: string; path: string; amount: number }) => {
    if (entry?.type === 'xp' && entry?.path) {
      const project = entry.path.split('/').pop() || entry.path
      xpByProject[project] = (xpByProject[project] || 0) + entry.amount
    }
  })
  const xpLineData = Object.entries(xpByProject)
    .sort((a, b) => b[1] - a[1])
    .map(([project, totalXP]) => ({
      x: project,
      y: totalXP
    }))

  useEffect(() => {
    const rawToken = localStorage.getItem('jwt')
    const token = rawToken?.replace(/^"|"$/g, '')

    if (!token || isJwtExpired(token)) {
      console.warn('JWT expired or missing. Redirecting to login...')
      localStorage.removeItem('jwt')
      router.push('/login')
      return
    }

    const fetchProfileData = async () => {
      const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_API as string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      })

      const raw = await response.json()
      if (raw.data) {
        setProfileData(raw.data)

        // 🎉 Confetti celebration for crossing XP milestone
        const xp = raw.data.transaction_aggregate?.aggregate?.sum?.amount ?? 0
        if (xp > 600000) {
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } })
        }
      } else {
        console.error('GraphQL Error:', raw.errors)
      }
    }

    fetchProfileData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('jwt')
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 px-6 py-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight mb-2">Hey {user?.firstName || 'there'} ✨</h1>
            <p className="text-gray-600 text-lg">You&apos;re shining through your progress!</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 sm:mt-0 px-6 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 hover:from-purple-600 hover:to-red-500 text-white font-semibold rounded-full shadow-lg transition-transform hover:scale-105"
          >
            Logout
          </button>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white/30 shadow-2xl p-6 backdrop-blur-lg border border-white/30">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">User Information</h2>
            {user ? (
              <ul className="space-y-2 text-gray-700">
                <li><strong>Name:</strong> {user.firstName} {user.lastName}</li>
                <li><strong>Email:</strong> {user.email}</li>
                <li><strong>Login:</strong> {user.login}</li>
                <li><strong>Audit Ratio:</strong> {user.auditRatio.toFixed(1)}</li>
                <li><strong>Total XP:</strong> {Math.round(totalModuleXP / 1000)}kB</li>
                <li><strong>Level:</strong> {userLevel}</li>
              </ul>
            ) : (
              <p>Loading profile...</p>
            )}
          </div>

          <div className="rounded-3xl bg-white/30 shadow-2xl p-6 backdrop-blur-lg border border-white/30">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Audit Stats</h2>
            <PieChart
              series={[{
                innerRadius: 50,
                outerRadius: 100,
                data: auditChartData,
                arcLabel: 'value'
              }]}
              width={400}
              height={250}
            />
            <div className="flex justify-around text-sm mt-4">
              <span className="text-purple-700 font-medium">✔️ Passed: {passCount}</span>
              <span className="text-red-600 font-medium">❌ Failed: {failCount}</span>
            </div>
          </div>
        </section>

{xpLineData.length > 0 && (
  <div className="rounded-3xl bg-white/30 shadow-2xl p-6 backdrop-blur-lg border border-white/30">
    <h2 className="text-xl font-semibold text-gray-700 mb-4">XP Earned per Project</h2>
    
    <div className="w-full h-[300px] sm:h-[350px] md:h-[400px]">
      <BarChart
        xAxis={[{
          id: 'project',
          data: xpLineData.map((item) => item.x),
          scaleType: 'band',
        }]}
        series={[{
          data: xpLineData.map((item) => item.y),
          label: 'XP',
          color: '#c084fc',
        }]}
        height={300} // Height is fixed; width is responsive to container
      />
    </div>
  </div>
)}

      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 1s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </main>
  )
}
