"use client";

import React, { useState, useEffect } from "react";
import { 
  Trophy, Award, ShieldAlert, AlertTriangle, CheckCircle, 
  Loader2, Search, Target, ChevronDown, Zap
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LeaderboardProps {
  isAdminPortal?: boolean;
}

export default function LeaderboardView({ isAdminPortal = false }: LeaderboardProps) {
  const supabase = createClient();
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [testDetails, setTestDetails] = useState<any>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch all available tests/quizzes
  useEffect(() => {
    const fetchTestsList = async () => {
      setLoadingTests(true);
      try {
        const { data, error } = await supabase
          .from("tests")
          .select("id, title, exam_type, target_batch, status")
          .order("created_at", { ascending: false });

        if (data && !error) {
          setTests(data);
          if (data.length > 0) {
            setSelectedTestId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load tests for leaderboard:", err);
      } finally {
        setLoadingTests(false);
      }
    };
    fetchTestsList();
  }, []);

  // 2. Fetch all details for selected test and aggregate leaderboard data
  useEffect(() => {
    if (!selectedTestId) return;

    const fetchLeaderboardDetails = async () => {
      setLoadingData(true);
      try {
        // Fetch test details
        const { data: testData } = await supabase
          .from("tests")
          .select("*")
          .eq("id", selectedTestId)
          .single();

        setTestDetails(testData);

        // Fetch questions to identify subjects and totals
        const { data: questions } = await supabase
          .from("questions")
          .select("id, subject, marks, negative_marks")
          .eq("test_id", selectedTestId);

        const activeQuestions = questions || [];
        
        // Extract unique subjects
        const uniqueSubjects = Array.from(
          new Set(activeQuestions.map((q: any) => q.subject || "Physics"))
        ) as string[];
        
        // Sort subjects in standard order: Physics, Chemistry, Botany, Zoology, Mathematics
        const subjectOrder = ["Physics", "Chemistry", "Botany", "Zoology", "Mathematics"];
        uniqueSubjects.sort((a, b) => {
          const idxA = subjectOrder.indexOf(a);
          const idxB = subjectOrder.indexOf(b);
          if (idxA === -1 && idxB === -1) return a.localeCompare(b);
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
        
        setSubjects(uniqueSubjects);

        // Fetch all test results for this test
        const { data: results } = await supabase
          .from("test_results")
          .select("*")
          .eq("test_id", selectedTestId);

        // Fetch profiles of all students (to resolve display names and batches)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, class, batch, aspiration")
          .eq("role", "student");

        // Fetch all user responses for this test
        const { data: responses } = await supabase
          .from("user_responses")
          .select("user_id, question_id, selected_option_id, is_correct, attempt_number")
          .eq("test_id", selectedTestId);

        // Fetch integrity reports for this test
        const { data: integrity } = await supabase
          .from("exam_integrity_reports")
          .select("user_id, status, total_violations")
          .eq("test_id", selectedTestId);

        const activeResults = results || [];
        const activeProfiles = profiles || [];
        const activeResponses = responses || [];
        const activeIntegrity = integrity || [];

        // Aggregation logic
        // We group attempts by user_id and keep each student's highest scoring attempt
        const studentBestAttempt: Record<string, any> = {};

        activeResults.forEach((res: any) => {
          const existing = studentBestAttempt[res.user_id];
          if (!existing || res.score > existing.score) {
            studentBestAttempt[res.user_id] = res;
          }
        });

        // Map best attempts to student details and calculate subject breakdowns
        const entries = Object.entries(studentBestAttempt).map(([userId, res]: any) => {
          const profile = activeProfiles.find((p: any) => p.id === userId);
          const studentIntegrity = activeIntegrity.find((i: any) => i.user_id === userId);

          // Calculate subject-wise metrics for this specific attempt
          const attemptResponses = activeResponses.filter(
            (r: any) => r.user_id === userId && r.attempt_number === res.attempt_number
          );

          const subjectStats: Record<string, { score: number; correct: number; incorrect: number; attempted: number; total: number }> = {};

          // Initialize subject stats based on questions
          uniqueSubjects.forEach(sub => {
            const subjectQuestions = activeQuestions.filter((q: any) => (q.subject || "Physics") === sub);
            subjectStats[sub] = {
              score: 0,
              correct: 0,
              incorrect: 0,
              attempted: 0,
              total: subjectQuestions.length
            };
          });

          // Aggregate from responses
          attemptResponses.forEach((r: any) => {
            const q = activeQuestions.find((x: any) => x.id === r.question_id);
            if (q && r.selected_option_id) {
              const sub = q.subject || "Physics";
              if (subjectStats[sub]) {
                subjectStats[sub].attempted++;
                const qMarks = q.marks !== undefined && q.marks !== null ? q.marks : 4;
                const qNeg = q.negative_marks !== undefined && q.negative_marks !== null ? q.negative_marks : 1;
                
                if (r.is_correct) {
                  subjectStats[sub].score += qMarks;
                  subjectStats[sub].correct++;
                } else {
                  subjectStats[sub].score -= qNeg;
                  subjectStats[sub].incorrect++;
                }
              }
            }
          });

          return {
            userId,
            fullName: profile?.full_name || profile?.email?.split("@")[0] || "Student",
            email: profile?.email || "",
            class: profile?.class || "N/A",
            batch: profile?.batch || "Unassigned",
            aspiration: profile?.aspiration || "N/A",
            score: res.score,
            correctCount: res.correct_count,
            attemptNumber: res.attempt_number,
            securityStatus: studentIntegrity?.status || "normal",
            violationsCount: studentIntegrity?.total_violations || 0,
            subjectBreakdown: subjectStats
          };
        });

        // Sort descending by score
        entries.sort((a, b) => b.score - a.score);

        // Apply ranks handling ties
        let currentRank = 0;
        let lastScore = -9999;
        const rankedEntries = entries.map((entry, index) => {
          if (entry.score !== lastScore) {
            currentRank = index + 1;
            lastScore = entry.score;
          }
          return {
            ...entry,
            rank: currentRank
          };
        });

        setLeaderboardData(rankedEntries);
      } catch (err) {
        console.error("Failed to load leaderboard details:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchLeaderboardDetails();
  }, [selectedTestId]);

  const filteredData = leaderboardData.filter(entry => 
    entry.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    entry.batch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Configuration Header Card */}
      <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 bg-white/5 rounded-xl ${isAdminPortal ? 'text-orange-500' : 'text-cyan-400'}`}>
              <Trophy className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Live Leaderboard & Ranks</h2>
              <p className="text-white/50 text-sm">Real-time rank listings and subject score analysis per exam.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text"
                placeholder="Search student or batch..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all min-w-[200px]"
              />
            </div>

            {/* Test Selection Dropdown */}
            {loadingTests ? (
              <div className="flex items-center gap-2 text-xs text-white/40"><Loader2 className="w-4 h-4 animate-spin" /> Loading tests...</div>
            ) : (
              <div className="relative">
                <select
                  value={selectedTestId}
                  onChange={e => setSelectedTestId(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 pr-8 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all cursor-pointer shadow-inner max-w-[250px] appearance-none truncate"
                >
                  {tests.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.exam_type})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      {loadingData ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
      ) : filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
          <Trophy className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/50">No results found for this selection.</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Rank Title Label Banner */}
          <div className="flex justify-between items-center px-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span className="text-cyan-400">{testDetails?.title || "Exam"}</span>
              <span className="text-white/30">•</span>
              <span className="text-white/60 text-sm font-semibold">{testDetails?.exam_type} Rank List</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-bold font-mono">
              {filteredData.length} {filteredData.length === 1 ? 'Student' : 'Students'}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-white/50 text-xs font-bold uppercase tracking-widest">
                    <th className="p-4 w-20 text-center"># (Rank)</th>
                    <th className="p-4">Student</th>
                    <th className="p-4 text-center">Total</th>
                    {subjects.map(sub => (
                      <th key={sub} className="p-4 text-center">{sub}</th>
                    ))}
                    <th className="p-4 text-center w-36">Security</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((entry, idx) => {
                    const isTop3 = entry.rank <= 3;
                    const rankIcons = ["🥇", "🥈", "🥉"];
                    const rankColors = [
                      "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-black",
                      "bg-slate-300/20 text-slate-200 border-slate-300/30 font-black",
                      "bg-amber-600/20 text-amber-500 border-amber-600/30 font-black"
                    ];

                    return (
                      <tr 
                        key={entry.userId} 
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          entry.rank === 1 ? 'bg-yellow-500/[0.01]' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="p-4 text-center">
                          {isTop3 ? (
                            <span className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full border text-xs font-black ${rankColors[entry.rank - 1]}`}>
                              <span className="text-sm">{rankIcons[entry.rank - 1]}</span>
                              #{entry.rank}
                            </span>
                          ) : (
                            <span className="font-mono text-white/50 text-sm font-bold">#{entry.rank}</span>
                          )}
                        </td>

                        {/* Student Details */}
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{entry.fullName}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-bold uppercase tracking-wide">
                              Attempt {entry.attemptNumber}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-cyan-400/80">{entry.batch}</span>
                          </div>
                        </td>

                        {/* Total Score */}
                        <td className="p-4 text-center">
                          <span className={`text-lg font-black tracking-tight ${
                            entry.rank === 1 ? 'text-yellow-400' : 'text-cyan-400'
                          }`}>
                            {entry.score}
                          </span>
                          <div className="text-[9px] text-white/30 font-mono mt-0.5 font-bold uppercase">
                            {entry.correctCount} Correct
                          </div>
                        </td>

                        {/* Subject Scores breakdown */}
                        {subjects.map(sub => {
                          const subStat = entry.subjectBreakdown[sub];
                          const score = subStat?.score !== undefined ? subStat.score : 0;
                          const correct = subStat?.correct || 0;
                          const incorrect = subStat?.incorrect || 0;
                          const attempted = subStat?.attempted || 0;
                          const total = subStat?.total || 0;
                          const accuracy = attempted > 0 ? ((correct / attempted) * 100).toFixed(0) : "0";

                          return (
                            <td key={sub} className="p-4 text-center">
                              <span className={`text-sm font-bold ${
                                score > 0 ? 'text-white' : score < 0 ? 'text-red-400' : 'text-white/40'
                              }`}>
                                {score}
                              </span>
                              <div className="text-[10px] text-white/40 mt-0.5 font-medium">
                                {correct}C · {incorrect}W · {total - attempted}U
                              </div>
                              <div className="text-[9px] text-white/20 font-mono">
                                {attempted}/{total} att • {accuracy}% acc
                              </div>
                            </td>
                          );
                        })}

                        {/* Security Pill */}
                        <td className="p-4 text-center">
                          {entry.securityStatus === 'normal' && (
                            <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 w-max mx-auto shadow-sm">
                              <CheckCircle className="w-3 h-3" /> Normal
                            </span>
                          )}
                          {entry.securityStatus === 'warned' && (
                            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 w-max mx-auto shadow-sm animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Warned x{entry.violationsCount}
                            </span>
                          )}
                          {entry.securityStatus === 'submitted_due_to_violation' && (
                            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 w-max mx-auto shadow-sm">
                              <ShieldAlert className="w-3 h-3" /> Auto-sub
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Key/Legends */}
            <div className="p-4 bg-slate-950/40 border-t border-white/5 text-[10px] text-white/40 flex flex-wrap gap-x-6 gap-y-2 justify-center items-center">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Normal = Compliant browser</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Warned = Exited fullscreen / tab switch</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Auto-sub = Forced submission on breach limit</div>
              <div className="text-white/20 font-bold hidden sm:inline">•</div>
              <div>C = Correct · W = Wrong · U = Unattempted · att = Attempted · acc = Accuracy</div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
