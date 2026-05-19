import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ title, value, icon: Icon, color, subtitle, trend }) {
  const colorMap = {
    green: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    teal: 'from-teal-500 to-teal-600',
  };

  const bgLight = {
    green: 'bg-emerald-50',
    blue: 'bg-blue-50',
    amber: 'bg-amber-50',
    red: 'bg-red-50',
    purple: 'bg-purple-50',
    teal: 'bg-teal-50',
  };

  const iconColor = {
    green: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    teal: 'text-teal-600',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${bgLight[color] || bgLight.green}`}>
          <Icon className={`w-5 h-5 ${iconColor[color] || iconColor.green}`} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
      <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </motion.div>
  );
}