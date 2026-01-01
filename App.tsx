
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { huntSignals } from './services/gemini';
import { ValidationReport, ProblemOpportunity, HistoryEntry, SavedProblemEntry } from './types';
import { LoadingScreen } from './components/LoadingScreen';
import { MatrixTable } from './components/MatrixTable';
import { ProblemDetails } from './components/ProblemDetails';
import { BoltIcon, ChartIcon, StarIcon } from './components/Icons';
import { Auth } from './components/Auth';

type View = 'search' | 'history' | 'saved';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_pro: boolean;
  credits: number;
}

const examples = [
  "Indie developers struggling with SEO",
  "Boutique hotel owners marketing pain",
  "SaaS churn in customer support tools",
  "Freelancer invoice collection issues",
  "E-commerce site speed complaints"
];

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<ProblemOpportunity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('search');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savedProblems, setSavedProblems] = useState<SavedProblemEntry[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchProfile();
      fetchHistory();
      fetchSavedProblems();
    }
  }, [session]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (data) setProfile(data);
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (data) setHistory(data.map(d => ({ ...d, report: d.report as ValidationReport })));
  };

  const fetchSavedProblems = async () => {
    const { data } = await supabase
      .from('saved_problems')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (data) setSavedProblems(data.map(d => ({ ...d, problem: d.problem as ProblemOpportunity })));
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim() || !profile) return;

    if (profile.credits <= 0 && !profile.is_pro) {
      setError("You've run out of credits. Upgrade to Pro for unlimited searches.");
      return;
    }

    setLoading(true);
    setReport(null);
    setSelectedProblem(null);
    setError(null);
    setCurrentView('search');

    try {
      const result = await huntSignals(topic);
      setReport(result);
      if (result.problems.length > 0) {
        setSelectedProblem(result.problems[0]);
      }
      
      await supabase.from('search_history').insert({
        user_id: session.user.id,
        topic: topic,
        report: result
      });

      if (!profile.is_pro) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - 1 })
          .eq('id', profile.id);
        
        setProfile(prev => prev ? { ...prev, credits: prev.credits - 1 } : null);
      }

      fetchHistory();
    } catch (err: any) {
      console.error(err);
      setError("Failed to analyze. Please try a different topic.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveProblem = async (p: ProblemOpportunity) => {
    const existing = savedProblems.find(s => s.problem.statement === p.statement);
    if (existing) {
      await supabase.from('saved_problems').delete().eq('id', existing.id);
    } else {
      await supabase.from('saved_problems').insert({
        user_id: session.user.id,
        topic: report?.meta.topic || 'Unknown',
        problem: p
      });
    }
    fetchSavedProblems();
  };

  const exportCSV = () => {
    if (!report) return;
    const headers = ['Problem Statement', 'Frequency', 'Urgency', 'Monetization', 'Overall Score', 'Status'];
    const rows = report.problems.map(p => [
      `"${p.statement.replace(/"/g, '""')}"`,
      p.scores.frequency,
      p.scores.urgency,
      p.scores.monetization,
      p.scores.overall.toFixed(2),
      p.scores.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `signalfinder_${report.meta.topic.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadHistoryItem = (entry: HistoryEntry) => {
    setReport(entry.report);
    setTopic(entry.topic);
    setSelectedProblem(entry.report.problems[0]);
    setCurrentView('search');
  };

  const generatePDF = () => {
    window.print();
  };

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      {/* Top Bar - No Print */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 sticky top-0 z-50 no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
            <BoltIcon className="w-5 h-5" />
          </div>
          <span className="font-black text-lg tracking-tight">SignalFinder<span className="text-purple-600">.ai</span></span>
        </div>
        
        {profile && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest tabular-nums">
                {profile.is_pro ? 'PRO MEMBER' : `${profile.credits} CREDITS LEFT`}
              </span>
            </div>
            
            <div className="relative group">
              <div className="flex items-center gap-3 cursor-pointer py-2">
                <div className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold text-zinc-300 border border-zinc-700 shadow-md group-hover:border-purple-500 transition-all">
                  {profile.first_name?.[0] || 'U'}
                </div>
              </div>
              
              {/* Profile Dropdown on Hover */}
              <div className="absolute right-0 mt-0 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right translate-y-1 group-hover:translate-y-0 p-1 z-[60]">
                <div className="px-4 py-4 border-b border-zinc-800">
                  <p className="text-sm font-bold text-white truncate">{profile.first_name} {profile.last_name}</p>
                  <p className="text-xs text-zinc-500 truncate mt-1">{profile.email}</p>
                </div>
                <div className="p-1">
                  <button 
                    onClick={() => supabase.auth.signOut()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        {/* Sidebar - No Print */}
        <nav className="fixed left-0 top-16 bottom-0 w-64 border-r border-zinc-800 bg-zinc-950 hidden lg:flex flex-col p-6 no-print z-40">
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3">Main Menu</div>
              <div className="space-y-1">
                <button 
                  onClick={() => setCurrentView('search')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all ${currentView === 'search' ? 'text-white bg-zinc-900 border border-zinc-800 shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                >
                  <ChartIcon className="w-4 h-4" />
                  Discovery Engine
                </button>
                <button 
                  onClick={() => setCurrentView('history')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all ${currentView === 'history' ? 'text-white bg-zinc-900 border border-zinc-800 shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  History
                </button>
                <button 
                  onClick={() => setCurrentView('saved')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all ${currentView === 'saved' ? 'text-white bg-zinc-900 border border-zinc-800 shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                >
                  <StarIcon className="w-4 h-4" />
                  Shortlist
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 p-4 md:p-8 lg:p-12 transition-all">
          {currentView === 'search' && (
            <>
              {!report && !loading ? (
                <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-3xl mx-auto space-y-12 no-print">
                  <div className="text-center space-y-6">
                    <h2 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[1.1] pb-2 bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent">
                      Validate before<br />you build.
                    </h2>
                    <p className="text-zinc-500 text-lg md:text-xl max-w-xl mx-auto font-medium">
                      Our AI hunts across Reddit and niche forums to find recurring, high-monetization pain points in minutes.
                    </p>
                  </div>
                  <form onSubmit={handleSearch} className="w-full relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-1000"></div>
                    <div className="relative flex flex-col md:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="e.g., 'help boutique hotel owners with marketing'"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="flex-1 px-6 py-5 rounded-2xl bg-zinc-900 border border-zinc-800 focus:ring-2 focus:ring-purple-500 text-white font-medium text-lg outline-none transition-all shadow-xl"
                      />
                      <button
                        type="submit"
                        disabled={!topic.trim() || loading}
                        className="px-8 py-5 bg-white text-zinc-950 font-black rounded-2xl hover:bg-zinc-200 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                      >
                        Search Signals
                      </button>
                    </div>
                  </form>
                  <div className="w-full space-y-4">
                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest text-center">Trending Segments</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {examples.map((ex) => (
                        <button
                          key={ex}
                          onClick={() => { setTopic(ex); }}
                          className="px-5 py-2.5 rounded-full border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-sm font-semibold text-zinc-500 hover:text-white transition-all"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : loading ? (
                <div className="no-print">
                  <LoadingScreen />
                </div>
              ) : report && (
                <div className="space-y-12 pb-24 animate-in fade-in duration-700">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-800">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-widest no-print">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                        Real-time Opportunity Report
                      </div>
                      <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-white">{report.meta.topic}</h2>
                      <div className="flex flex-wrap gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <span className="bg-zinc-900/50 border border-zinc-800 px-2 py-1 rounded">{report.meta.discussions_analyzed} Discussions Analyzed</span>
                        <span className="bg-zinc-900/50 border border-zinc-800 px-2 py-1 rounded">Sources Identified: {report.meta.sources.length}</span>
                        <span className="bg-zinc-900/50 border border-zinc-800 px-2 py-1 rounded">{report.meta.date_range}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 no-print">
                      <button onClick={exportCSV} className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold hover:bg-zinc-800 transition-all flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        CSV
                      </button>
                      <button onClick={generatePDF} className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold hover:bg-zinc-800 transition-all flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        Export PDF
                      </button>
                      <button onClick={() => { setReport(null); setTopic(''); }} className="px-5 py-2.5 rounded-xl bg-white text-black text-xs font-black hover:bg-zinc-200 transition-all">Reset</button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight text-white">Signal Matrix</h3>
                    <MatrixTable problems={report.problems} onSelectProblem={setSelectedProblem} selectedId={selectedProblem?.id} />
                  </div>

                  {selectedProblem && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-black uppercase tracking-tight text-white border-t border-zinc-800 pt-8">Pattern Deep Dive</h3>
                      <ProblemDetails 
                        problem={selectedProblem} 
                        isSaved={savedProblems.some(s => s.problem.statement === selectedProblem.statement)}
                        onToggleSave={() => toggleSaveProblem(selectedProblem)}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {currentView === 'history' && (
            <div className="space-y-8 max-w-5xl mx-auto no-print">
              <h2 className="text-4xl font-black tracking-tight">Search History</h2>
              {history.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 text-zinc-500 font-medium">No previous searches found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map(entry => (
                    <div key={entry.id} onClick={() => loadHistoryItem(entry)} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg group-hover:text-purple-400 transition-colors">{entry.topic}</h4>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{new Date(entry.timestamp || 0).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-zinc-500">Validation complete with {entry.report.problems.length} signals identified.</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'saved' && (
            <div className="space-y-8 max-w-5xl mx-auto no-print">
              <h2 className="text-4xl font-black tracking-tight">Shortlist</h2>
              {savedProblems.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 text-zinc-500 font-medium">You haven't shortlisted any problems yet.</div>
              ) : (
                <div className="space-y-4">
                  {savedProblems.map(entry => (
                    <div key={entry.id} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900 flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1">
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{entry.topic}</span>
                        <h4 className="text-xl font-bold leading-tight mt-1 text-white">{entry.problem.statement}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setReport({ meta: { topic: entry.topic, discussions_analyzed: 0, sources: [], date_range: '' }, problems: [entry.problem] }); setSelectedProblem(entry.problem); setCurrentView('search'); }} 
                          className="px-4 py-2 rounded-lg bg-zinc-800 text-xs font-bold hover:bg-zinc-700 transition-all"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => toggleSaveProblem(entry.problem)} 
                          className="px-3 py-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-bold transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="fixed bottom-8 right-8 z-50 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 max-w-md shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-4 duration-500 no-print">
              <p className="font-bold mb-4">{error}</p>
              <button onClick={() => setError(null)} className="px-6 py-2 bg-rose-500 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all">Close</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
