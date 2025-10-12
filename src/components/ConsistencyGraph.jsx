import React, { useMemo } from 'react'
import { Flame } from 'lucide-react'

const ConsistencyGraph = ({ activityData = {} }) => {
  // Generate last 365 days
  const generateCalendarData = () => {
    const days = []
    const today = new Date()

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      days.push({
        date: dateStr,
        count: activityData[dateStr] || 0,
        day: date.getDay(),
        month: date.getMonth(),
        year: date.getFullYear()
      })
    }

    return days
  }

  const calendarData = useMemo(() => generateCalendarData(), [activityData])

  // Get color intensity based on activity count
  const getColorIntensity = (count) => {
    if (count === 0) return 'bg-gray-100 border-gray-200'
    if (count < 3) return 'bg-amber-200 border-amber-300'
    if (count < 6) return 'bg-amber-300 border-amber-400'
    if (count < 10) return 'bg-amber-400 border-amber-500'
    return 'bg-amber-500 border-amber-600'
  }

  // Group days by week
  const weeks = []
  let currentWeek = []

  calendarData.forEach((day, index) => {
    currentWeek.push(day)

    if (day.day === 6 || index === calendarData.length - 1) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })

  // Calculate stats
  const totalDays = calendarData.filter(d => d.count > 0).length
  const currentStreak = useMemo(() => {
    let streak = 0
    for (let i = calendarData.length - 1; i >= 0; i--) {
      if (calendarData[i].count > 0) {
        streak++
      } else {
        break
      }
    }
    return streak
  }, [calendarData])

  const longestStreak = useMemo(() => {
    let maxStreak = 0
    let currentStreak = 0

    calendarData.forEach(day => {
      if (day.count > 0) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })

    return maxStreak
  }, [calendarData])

  const totalWords = calendarData.reduce((sum, day) => sum + day.count, 0)

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Learning Activity</h3>
          <p className="text-sm text-gray-600">Your consistency over the past year</p>
        </div>
        <div className="flex items-center space-x-2 text-orange-600">
          <Flame className="w-5 h-5" />
          <span className="font-bold text-lg">{currentStreak} day streak</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalDays}</div>
          <div className="text-xs text-gray-600">Active Days</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{currentStreak}</div>
          <div className="text-xs text-gray-600">Current Streak</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{longestStreak}</div>
          <div className="text-xs text-gray-600">Longest Streak</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalWords}</div>
          <div className="text-xs text-gray-600">Total Words</div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1">
            <div className="w-8"></div>
            {weeks.map((week, weekIndex) => {
              const firstDay = week[0]
              if (firstDay && firstDay.day === 0 && weekIndex % 4 === 0) {
                return (
                  <div key={weekIndex} className="text-xs text-gray-600" style={{ width: '12px', marginRight: '2px' }}>
                    {monthLabels[firstDay.month].charAt(0)}
                  </div>
                )
              }
              return <div key={weekIndex} style={{ width: '12px', marginRight: '2px' }}></div>
            })}
          </div>

          {/* Calendar */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col justify-between mr-2 text-xs text-gray-600" style={{ height: '98px' }}>
              {['Mon', 'Wed', 'Fri'].map((day, i) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex space-x-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col space-y-[2px]">
                  {/* Fill empty days at start of first week */}
                  {weekIndex === 0 && week[0] && week[0].day > 0 && (
                    Array.from({ length: week[0].day }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="w-3 h-3 rounded-sm bg-transparent"
                      />
                    ))
                  )}

                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 rounded-sm border ${getColorIntensity(day.count)} transition-all hover:scale-125 cursor-pointer`}
                      title={`${day.date}: ${day.count} words learned`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end space-x-2 mt-4 text-xs text-gray-600">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
            <div className="w-3 h-3 rounded-sm bg-amber-200 border border-amber-300" />
            <div className="w-3 h-3 rounded-sm bg-amber-300 border border-amber-400" />
            <div className="w-3 h-3 rounded-sm bg-amber-400 border border-amber-500" />
            <div className="w-3 h-3 rounded-sm bg-amber-500 border border-amber-600" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsistencyGraph
