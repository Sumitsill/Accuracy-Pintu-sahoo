"use client";

import React, { useState, useEffect } from "react";
import { 
  Target, Settings, CheckCircle2, ChevronRight,
  Clock, BarChart, PenTool, LayoutTemplate, ArrowLeft,
  Loader2, Plus, Trash2, FileText, Type
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id: string;
  text: string;
  imageUrl?: string;
  imageFile?: File | null;
  options: { text: string; isCorrect: boolean }[];
}

export default function TestCreationEngine() {
  const router = useRouter();
  const supabase = createClient();

  const [examType, setExamType] = useState<"NEET" | "JEE Main" | "JEE Advanced" | "">("");
  const [difficulty, setDifficulty] = useState<number>(3);
  const [testTitle, setTestTitle] = useState("");
  const [targetBatch, setTargetBatch] = useState("All Students");
  
  // Dynamic Rules State
  const [duration, setDuration] = useState(180);
  const [marksCorrect, setMarksCorrect] = useState(4);
  const [marksIncorrect, setMarksIncorrect] = useState(-1);
  const [numberOfQuestions, setNumberOfQuestions] = useState(30);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [slotsGenerated, setSlotsGenerated] = useState(false);

  // Rule Enforcement Logic (Auto-fill on type change)
  useEffect(() => {
    if (examType === "NEET") {
      setDuration(200);
      setMarksCorrect(4);
      setMarksIncorrect(-1);
      setNumberOfQuestions(200); // 200 questions in NEET
    } else if (examType === "JEE Main") {
      setDuration(180);
      setMarksCorrect(4);
      setMarksIncorrect(-1);
      setNumberOfQuestions(90); // 90 questions in JEE Main
    } else if (examType === "JEE Advanced") {
      setDuration(180);
      setMarksCorrect(3);
      setMarksIncorrect(-1);
      setNumberOfQuestions(54); // Just an example, varies
    }
  }, [examType]);

  const generateQuestionSlots = () => {
    if (numberOfQuestions <= 0) return;
    
    const newQuestions: Question[] = Array.from({ length: numberOfQuestions }).map((_, i) => ({
      id: Math.random().toString(),
      text: "",
      imageUrl: "",
      imageFile: null,
      options: [
        { text: "Option A", isCorrect: true },
        { text: "Option B", isCorrect: false },
        { text: "Option C", isCorrect: false },
        { text: "Option D", isCorrect: false },
      ]
    }));
    
    setQuestions(newQuestions);
    setSlotsGenerated(true);
  };

  const updateQuestionText = (id: string, newText: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text: newText } : q));
  };

  const handleImageUpload = (qId: string, file: File) => {
    const localUrl = URL.createObjectURL(file);
    setQuestions(questions.map(q => q.id === qId ? { ...q, imageUrl: localUrl, imageFile: file } : q));
  };

  const updateOptionText = (qId: string, optIdx: number, newText: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.options];
        newOpts[optIdx].text = newText;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const setCorrectOption = (qId: string, optIdx: number) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOpts = q.options.map((o, i) => ({ ...o, isCorrect: i === optIdx }));
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handlePublish = async () => {
    if (!testTitle) return alert("Please provide a Test Title.");
    if (questions.length === 0) return alert("Please generate and fill questions.");
    
    setIsPublishing(true);
    try {
      // 1. Create Test Record
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert([{ 
          title: testTitle, 
          exam_type: examType, 
          difficulty, 
          duration,
          target_batch: targetBatch,
          status: 'draft'
        }])
        .select()
        .single();
        
      if (testError) throw testError;

      // 2. Insert Questions & Options
      // To speed up insert, we could do it in bulk, but this is safer for linking IDs
      for (const q of questions) {
        let finalImageUrl = "";
        if (q.imageFile) {
          const fileExt = q.imageFile.name.split('.').pop();
          const fileName = `questions/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('resources').upload(fileName, q.imageFile);
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(fileName);
            finalImageUrl = publicUrl;
          }
        }

        const { data: qData, error: qError } = await supabase
          .from('questions')
          .insert([{ test_id: testData.id, text: q.text || "", image_url: finalImageUrl }])
          .select()
          .single();
          
        if (qError) throw qError;

        // Insert options for this question
        const optionsToInsert = q.options.map(opt => ({
          question_id: qData.id,
          text: opt.text,
          is_correct: opt.isCorrect
        }));

        const { error: optError } = await supabase.from('options').insert(optionsToInsert);
        if (optError) throw optError;
      }

      alert("Test finalized and published successfully to the database!");
      router.push("/admin");

    } catch (error: any) {
      alert("Error publishing test: " + error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-body p-6 md:p-12 relative overflow-hidden">
      
      {/* Background Fiery Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <Link href="/admin" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Target className="w-8 h-8 text-orange-500" />
              Dynamic Test Creation Engine
            </h1>
            <p className="text-white/50 mt-1">Configure NTA-style test parameters and manually author questions.</p>
          </div>
        </div>

        {/* Step 1: Exam Type Selection */}
        <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl space-y-5">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
            <Settings className="w-5 h-5 text-orange-500" /> Step 1: Select Target Exam
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["NEET", "JEE Main", "JEE Advanced", "DPP"].map((type) => (
              <button
                key={type}
                onClick={() => { setExamType(type as any); setSlotsGenerated(false); }}
                className={`p-6 rounded-2xl border transition-all duration-300 font-bold text-lg flex flex-col items-center justify-center gap-3 ${
                  examType === type 
                    ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)] scale-105" 
                    : "bg-slate-900/50 border-white/10 text-white/50 hover:bg-white/5 hover:border-orange-500/30"
                }`}
              >
                <Target className={`w-8 h-8 ${examType === type ? 'animate-pulse' : ''}`} />
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Configuration & Difficulty */}
        {examType && (
          <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl space-y-5 animate-in slide-in-from-top-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <BarChart className="w-5 h-5 text-orange-500" /> Step 2: Exam Filters & Rules
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-xs font-bold text-white/50 uppercase ml-1">Internal Test Title</label>
                <input 
                  type="text" 
                  value={testTitle}
                  onChange={e => setTestTitle(e.target.value)}
                  placeholder={`e.g. ${examType} Mock Test - Thermodynamics`}
                  className="w-full mt-2 bg-slate-900/50 border border-white/10 rounded-xl py-4 px-5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 uppercase ml-1">Total Questions</label>
                <input 
                  type="number" 
                  value={numberOfQuestions}
                  onChange={e => setNumberOfQuestions(Number(e.target.value))}
                  disabled={slotsGenerated}
                  className="w-full mt-2 bg-slate-900/50 border border-white/10 rounded-xl py-4 px-5 text-white focus:outline-none focus:border-orange-500 disabled:opacity-50 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 border-t border-white/5 pt-6">
              <div>
                <label className="text-xs font-bold text-white/50 uppercase ml-1 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Duration (Mins)</label>
                <input 
                  type="number" 
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full mt-2 bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 uppercase ml-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Marks for Correct</label>
                <input 
                  type="number" 
                  value={marksCorrect}
                  onChange={e => setMarksCorrect(Number(e.target.value))}
                  className="w-full mt-2 bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-green-400 focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 uppercase ml-1 flex items-center gap-2"><Trash2 className="w-4 h-4 text-red-500" /> Marks for Incorrect</label>
                <input 
                  type="number" 
                  value={marksIncorrect}
                  onChange={e => setMarksIncorrect(Number(e.target.value))}
                  className="w-full mt-2 bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-red-400 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-white/70">
                  <label className="font-bold">Overall Question Level</label>
                  <span className="font-bold text-orange-500">Level {difficulty}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 uppercase ml-1">Target Batch</label>
                <select 
                  value={targetBatch} 
                  onChange={e => setTargetBatch(e.target.value)} 
                  className="w-full mt-2 bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-orange-500 outline-none"
                >
                  <option>All Students</option>
                  <option>Class 11</option>
                  <option>Class 12</option>
                  <option>IIT JEE Batch</option>
                  <option>NEET Batch</option>
                </select>
              </div>
            </div>
            
            {!slotsGenerated && (
              <button 
                onClick={generateQuestionSlots}
                className="w-full py-4 mt-4 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/50 font-bold hover:bg-orange-500/30 transition-all flex items-center justify-center gap-2"
              >
                <LayoutTemplate className="w-5 h-5" /> Generate {numberOfQuestions} Question Slots
              </button>
            )}
          </div>
        )}

        {/* Step 3: Manual Question Entry */}
        {slotsGenerated && (
          <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl space-y-5 animate-in slide-in-from-top-4 delay-100">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Type className="w-5 h-5 text-orange-500" /> Step 3: Author Questions
              </h2>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-bold">{questions.length} Questions</span>
            </div>

            {/* Question Editor List */}
            <div className="space-y-8 mt-8">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-6 bg-slate-900 border border-white/10 rounded-2xl relative group">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-orange-400">Question {idx + 1}</h4>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <textarea 
                      value={q.text}
                      onChange={(e) => updateQuestionText(q.id, e.target.value)}
                      className="flex-1 h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none"
                      placeholder={`Enter Question ${idx + 1} text here...`}
                    />
                    <label className="w-full md:w-1/3 h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl cursor-pointer bg-slate-950/50 hover:bg-slate-950 hover:border-orange-500/50 transition-all overflow-hidden relative">
                      {q.imageUrl ? (
                        <img src={q.imageUrl} alt="preview" className="w-full h-full object-contain absolute inset-0" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center px-4">
                          <p className="text-xs text-white/50"><span className="text-orange-400 font-bold">Upload Image</span></p>
                          <p className="text-[10px] text-white/30 mt-1">(Optional)</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => e.target.files && handleImageUpload(q.id, e.target.files[0])} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-3">
                        <button 
                          onClick={() => setCorrectOption(q.id, oIdx)}
                          className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${opt.isCorrect ? 'border-green-500 bg-green-500/20' : 'border-white/20 hover:border-white/50'}`}
                          title="Mark as correct answer"
                        >
                          {opt.isCorrect && <div className="w-3 h-3 bg-green-500 rounded-full" />}
                        </button>
                        <input 
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateOptionText(q.id, oIdx, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          className={`w-full bg-slate-950 border rounded-lg py-2 px-3 text-sm focus:outline-none transition-colors ${opt.isCorrect ? 'border-green-500/50 text-white' : 'border-white/10 text-white/70'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publish Action */}
        {slotsGenerated && (
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full py-5 rounded-xl bg-orange-500 text-slate-950 font-bold text-lg hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2"
          >
            {isPublishing ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Finalize & Publish Exam <ChevronRight className="w-6 h-6" /></>}
          </button>
        )}

      </div>
    </div>
  );
}
