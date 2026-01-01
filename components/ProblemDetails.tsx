
import React from 'react';
import { ProblemOpportunity } from '../types';
import { ChartIcon, RocketIcon, QuoteIcon, StarIcon } from './Icons';

interface ProblemDetailsProps {
  problem: ProblemOpportunity;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export const ProblemDetails: React.FC<ProblemDetailsProps> = ({ problem, isSaved, onToggleSave }) => {
  const { quotes, sentiment, next_steps } = problem;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sentiment */}
        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
                <ChartIcon />
              </span>
              Sentiment Breakdown
            </h3>
            {onToggleSave && (
              <button 
                onClick={onToggleSave}
                className={`p-2 rounded-lg border transition-colors ${isSaved ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}
              >
                <StarIcon className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {[
              { label: 'Frustration', value: sentiment.frustration, color: 'bg-rose-500' },
              { label: 'Desperation', value: sentiment.desperation, color: 'bg-amber-500' },
              { label: 'Cost Pain', value: sentiment.cost_pain, color: 'bg-emerald-500' }
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className={`${item.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-4 p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
              <p className="text-xs italic text-zinc-400 leading-relaxed uppercase tracking-wide mb-1 font-bold">Key Insight</p>
              <p className="text-sm text-zinc-200">{sentiment.insight}</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <RocketIcon />
            </span>
            Action Roadmap
          </h3>
          <ul className="space-y-4">
            {next_steps.map((step, i) => (
              <li key={i} className="flex gap-4 text-sm text-zinc-300">
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-purple-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="leading-tight">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Evidence Quotes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <QuoteIcon />
          </span>
          Evidence Repository
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quotes.map((quote, i) => (
            <div key={i} className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between group">
              <p className="text-zinc-200 leading-relaxed mb-6 italic text-sm">"{quote.text}"</p>
              <div className="flex justify-between items-end border-t border-zinc-800 pt-4">
                <div>
                  <p className="text-sm font-bold text-white">{quote.author}</p>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 mt-0.5 uppercase tracking-wider">
                    <span className="text-purple-400">{quote.source}</span>
                    <span>•</span>
                    <span>{quote.date}</span>
                  </div>
                </div>
                {quote.url && (
                  <a
                    href={quote.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  >
                    LINK 
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 22 3 22 10"/><line x1="10" y1="14" x2="22" y2="2"/></svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
