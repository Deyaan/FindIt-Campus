import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, ArrowRight, Image as ImageIcon } from 'lucide-react';

export default function ItemCard({ item, signedPhotoUrl }) {
  const [imageError, setImageError] = useState(false);
  const isLost = item.type === 'lost';

  // Format incident date
  const formattedDate = item.date_incident
    ? new Date(item.date_incident + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown Date';

  return (
    <div className="bg-white dark:bg-[#151724] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-purple-950/20 transition-all duration-200 flex flex-col overflow-hidden group hover:border-slate-300 dark:hover:border-purple-600/50">
      {/* Thumbnail or Fallback Header */}
      <div className="relative h-48 w-full bg-slate-100 dark:bg-[#10111a] overflow-hidden flex items-center justify-center">
        {signedPhotoUrl && !imageError ? (
          <img
            src={signedPhotoUrl}
            alt={item.title}
            onError={() => setImageError(true)}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#10111a] dark:to-[#171927] text-slate-400 dark:text-slate-500 p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1e2030] border border-slate-200/60 dark:border-slate-800 flex items-center justify-center mb-2 shadow-xs">
              <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            </div>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">No photograph provided</span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs backdrop-blur-md ${
              isLost
                ? 'bg-rose-500/90 text-white'
                : 'bg-purple-600/90 text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
        </div>

        {/* Category Pill */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/95 dark:bg-[#181a29]/95 text-slate-700 dark:text-slate-300 shadow-xs backdrop-blur-xs border border-slate-200/50 dark:border-slate-700/60">
            <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            {item.category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
            {item.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Metadata Footer */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 truncate" title={item.location}>
              <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="truncate">{item.location}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <Link
            to={`/items/${item.id}`}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#1a1c2c] hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800/60 transition-all group-hover:border-purple-200 dark:group-hover:border-purple-800/60"
          >
            <span>View Item Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
