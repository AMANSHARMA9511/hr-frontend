'use client';

export default function StatsCard({ title, value, subtitle, color, icon, trend }) {
  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      light: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200'
    },
    yellow: {
      bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      light: 'bg-yellow-50',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      light: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-500 to-green-600',
      light: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-500 to-red-600',
      light: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200'
    }
  };

  const trendColors = {
    'Good': 'text-green-600 bg-green-100',
    'Low': 'text-red-600 bg-red-100',
    'High': 'text-orange-600 bg-orange-100',
    'Normal': 'text-blue-600 bg-blue-100',
    'Action Needed': 'text-yellow-600 bg-yellow-100',
    'All Clear': 'text-green-600 bg-green-100',
    'Excellent': 'text-green-600 bg-green-100',
    'Needs Improvement': 'text-red-600 bg-red-100'
  };

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden border ${colorClasses[color]?.border}`}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`w-12 h-12 ${colorClasses[color]?.light} rounded-xl flex items-center justify-center text-2xl`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-3">
            <span className={`text-xs px-2 py-1 rounded-full ${trendColors[trend] || 'bg-gray-100 text-gray-600'}`}>
              {trend}
            </span>
          </div>
        )}
      </div>
      <div className={`h-1 ${colorClasses[color]?.bg}`} />
    </div>
  );
}