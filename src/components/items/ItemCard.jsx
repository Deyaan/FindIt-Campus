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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group hover:border-slate-300">
      {/* Thumbnail or Fallback Header */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
        {signedPhotoUrl && !imageError ? (
          <img
            src={signedPhotoUrl}
            alt={item.title}
            onError={() => setImageError(true)}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center mb-2 shadow-xs">
              <ImageIcon className="w-6 h-6 text-slate-300" />
            </div>
            <span className="text-xs font-medium text-slate-400">No photograph provided</span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs backdrop-blur-md ${
              isLost
                ? 'bg-rose-500/90 text-white'
                : 'bg-indigo-600/90 text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
        </div>

        {/* Category Pill */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/95 text-slate-700 shadow-xs backdrop-blur-xs border border-slate-200/50">
            <Tag className="w-3 h-3 text-slate-400" />
            {item.category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {item.title}
          </h3>
          <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Metadata Footer */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 truncate" title={item.location}>
              <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">{item.location}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <Link
            to={`/items/${item.id}`}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition-all group-hover:border-indigo-200"
          >
            <span>View Item Details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
