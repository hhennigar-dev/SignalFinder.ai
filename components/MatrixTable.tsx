
import React from 'react';
import { ProblemOpportunity, OpportunityStatus } from '../types';

interface MatrixTableProps {
  problems: ProblemOpportunity[];
  onSelectProblem: (problem: ProblemOpportunity) => void;
  selectedId?: number;
}

export const MatrixTable: React.FC<MatrixTableProps> = ({ problems, onSelectProblem, selectedId }) => {
  const getStatusStyles = (status: OpportunityStatus) => {
    switch (status) {
      case OpportunityStatus.STRONG: return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500' };
      case OpportunityStatus.MEDIUM: return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500' };
      case OpportunityStatus.WEAK: return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-500' };
      default: return { color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', dot: 'bg-zinc-500' };
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 font-medium">
          <tr>
            <th className="px-6 py-4">Problem Statement</th>
            <th className="px-6 py-4 text-center">Freq</th>
            <th className="px-6 py-4 text-center">Urgency</th>
            <th className="px-6 py-4 text-center">Monetization</th>
            <th className="px-6 py-4 text-center">Overall</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {problems.map((p) => {
            const styles = getStatusStyles(p.scores.status);
            return (
              <tr
                key={p.id}
                onClick={() => onSelectProblem(p)}
                className={`group cursor-pointer hover:bg-zinc-800/80 transition-all ${selectedId === p.id ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : ''}`}
              >
                <td className="px-6 py-5 font-medium text-zinc-100 max-w-md">
                  {p.statement}
                </td>
                <td className="px-6 py-5 text-center text-zinc-300">
                  <span className="tabular-nums font-semibold">{p.scores.frequency}</span>
                </td>
                <td className="px-6 py-5 text-center text-zinc-300">
                  <span className="tabular-nums font-semibold">{p.scores.urgency}</span>
                </td>
                <td className="px-6 py-5 text-center text-zinc-300">
                  <span className="tabular-nums font-semibold">{p.scores.monetization}</span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="font-bold text-white tabular-nums bg-zinc-800 px-2 py-1 rounded border border-zinc-700">{p.scores.overall.toFixed(1)}</span>
                </td>
                <td className="px-6 py-5">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${styles.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
                    {p.scores.status}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
