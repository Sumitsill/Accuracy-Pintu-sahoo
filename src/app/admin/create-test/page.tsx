"use client";

import React, { useState, useEffect } from "react";
import { 
  Target, Settings, CheckCircle2, ChevronRight,
  Clock, BarChart, PenTool, ArrowLeft,
  Loader2, Plus, Trash2, FileText, Type,
  Upload, AlertTriangle, Edit3, Save, Sparkles,
  HelpCircle, Eye, EyeOff
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Script from "next/script";

interface ParsedQuestion {
  questionNumber: number;
  subject: "Physics" | "Chemistry" | "Botany" | "Zoology" | "Mathematics" | "Other";
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctOption: "A" | "B" | "C" | "D" | "";
  explanation?: string;
  marks: number;
  negativeMarks: number;
  imageUrl?: string;
  imageFile?: File | null;
  section?: string;
  finalImageUrl?: string;
  questionType?: "MCQ" | "AssertionReason" | "Objective" | "Subjective2M" | "Subjective3M" | "Subjective5M" | "CaseStudy";
}


export default function TestCreationEngine() {
  const router = useRouter();
  const supabase = createClient();

  const [examType, setExamType] = useState<"NEET" | "JEE Main" | "JEE Advanced" | "DPP Quiz" | "Boards" | "">("NEET");
  const [difficulty, setDifficulty] = useState<number>(3);
  const [testTitle, setTestTitle] = useState("");
  const [targetBatch, setTargetBatch] = useState("All Students");
  const [duration, setDuration] = useState(200); // 200 minutes for NEET

  const [selectedBoard, setSelectedBoard] = useState<"WB" | "CBSE_ISC" | null>(null);
  const [selectedClass, setSelectedClass] = useState<"11" | "12" | null>(null);
  const [selectedSetType, setSelectedSetType] = useState<"35" | "70">("35");
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  // Manual Question Distributions
  const [count1Mark, setCount1Mark] = useState(0);
  const [count2Mark, setCount2Mark] = useState(0);
  const [count3Mark, setCount3Mark] = useState(0);
  const [count5Mark, setCount5Mark] = useState(0);


  const [creationMode, setCreationMode] = useState<"upload" | "manual">("upload");

  // Manual Mode States
  const [numberOfQuestions, setNumberOfQuestions] = useState(200);
  const [manualQuestions, setManualQuestions] = useState<ParsedQuestion[]>([]);
  const [manualGenerated, setManualGenerated] = useState(false);

  // PDF Upload & Parse States
  const [questionPdf, setQuestionPdf] = useState<File | null>(null);
  const [answerPdf, setAnswerPdf] = useState<File | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);

  // Parsing execution states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressLogs, setProgressLogs] = useState<string[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);

  // Parsed Data Results
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [unmatchedAnswers, setUnmatchedAnswers] = useState<{ questionNumber: number; correctOption: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Edit Question Modal / Form State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ParsedQuestion | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);

  // Rule Enforcement for NEET / JEE / Boards
  useEffect(() => {
    if (examType === "NEET") {
      setDuration(200);
      setNumberOfQuestions(200);
      setSelectedBoard(null);
      setSelectedClass(null);
    } else if (examType === "JEE Main") {
      setDuration(180);
      setNumberOfQuestions(90);
      setSelectedBoard(null);
      setSelectedClass(null);
    } else if (examType === "JEE Advanced") {
      setDuration(180);
      setNumberOfQuestions(54);
      setSelectedBoard(null);
      setSelectedClass(null);
    } else if (examType === "DPP Quiz") {
      setDuration(45);
      setNumberOfQuestions(15);
      setSelectedBoard(null);
      setSelectedClass(null);
    } else if (examType === "Boards") {
      setDuration(180);
    }
  }, [examType]);

  // Adjust question distribution when board selection changes
  useEffect(() => {
    if (examType === "Boards") {
      if (selectedBoard === "WB") {
        if (selectedSetType === "35") {
          setNumberOfQuestions(22);
        } else {
          setNumberOfQuestions(35);
        }
      } else if (selectedBoard === "CBSE_ISC") {
        if (selectedSetType === "35") {
          setNumberOfQuestions(21);
        } else {
          setNumberOfQuestions(33);
        }
      }
    }
  }, [examType, selectedBoard, selectedSetType]);


  // Handle Class dropdown animation trigger
  useEffect(() => {
    if (selectedBoard) {
      const timer = setTimeout(() => setShowClassDropdown(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowClassDropdown(false);
    }
  }, [selectedBoard]);

  // Log message helper
  const addLog = (message: string) => {
    setProgressLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Setup pdfjs worker
  const initPdfjs = () => {
    try {
      // @ts-ignore
      if (window.pdfjsLib) {
        // @ts-ignore
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        setPdfjsLoaded(true);
      }
    } catch (e) {
      console.error("Error setting PDFJS worker:", e);
    }
  };

  // Helper: Extract text from PDF file (and use server-side OCR if no text)
  const extractTextFromPdf = async (file: File, fileTypeLabel: string): Promise<string> => {
    // @ts-ignore
    if (!window.pdfjsLib) {
      throw new Error("PDF.js library is not loaded yet.");
    }
    
    addLog(`Reading ${fileTypeLabel} file...`);
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    addLog(`${fileTypeLabel} has ${pdf.numPages} pages.`);

    let extractedText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      addLog(`Extracting text from ${fileTypeLabel} (Page ${pageNum}/${pdf.numPages})...`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      let pageText = textContent.items.map((item: any) => item.str).join(" ");
      
      // If page text is empty/extremely short, fallback to OCR
      if (pageText.trim().length < 50) {
        addLog(`Page ${pageNum} has no selectable text. Converting page to image and running OCR...`);
        
        // Render PDF page to canvas
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for higher OCR quality
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          const imageBase64 = canvas.toDataURL("image/jpeg", 0.85);

          // Call the server OCR endpoint
          const ocrResponse = await fetch("/api/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64 })
          });

          if (ocrResponse.ok) {
            const ocrResult = await ocrResponse.json();
            pageText = ocrResult.text || "";
            addLog(`OCR page ${pageNum} completed successfully.`);
          } else {
            addLog(`⚠️ OCR page ${pageNum} failed. Skipping OCR for this page.`);
          }
        }
      }

      extractedText += pageText + "\n\n";
      setCurrentProgress(Math.floor((pageNum / pdf.numPages) * 50)); // Scale PDF loading to 50%
    }

    return extractedText;
  };

  // Run PDF & Answer Key Processing
  const handleProcessDocuments = async () => {
    if (!questionPdf) return alert("Please upload a Question Booklet PDF.");
    if (!answerPdf && !answerText) return alert("Please upload an Answer Key PDF or enter answer text.");
    if (!testTitle) return alert("Please provide a Test Title first.");

    setIsProcessing(true);
    setProgressLogs([]);
    setCurrentProgress(5);
    setParsedQuestions([]);
    setUnmatchedAnswers([]);

    try {
      // 1. Extract text from Question Booklet PDF
      const questionText = await extractTextFromPdf(questionPdf, "Question Booklet PDF");
      addLog("Successfully extracted text from Question Booklet.");
      
      // 2. Extract text from Answer Key
      let keyText = answerText;
      if (answerPdf) {
        keyText = await extractTextFromPdf(answerPdf, "Answer Key PDF");
        addLog("Successfully extracted text from Answer Key PDF.");
      }

      // 3. Batch Parse Questions text with Gemini
      addLog("Preparing questions text for Gemini AI parsing...");
      // Split questionText into lines and batch by around 6000 words (or split into chunks)
      // For safety, let's split the text into batches of page separators if available, or roughly by length
      const textChunks: string[] = [];
      const lines = questionText.split("\n");
      let currentChunk = "";
      
      for (const line of lines) {
        if (currentChunk.length + line.length > 12000) {
          textChunks.push(currentChunk);
          currentChunk = "";
        }
        currentChunk += line + "\n";
      }
      if (currentChunk.trim()) {
        textChunks.push(currentChunk);
      }

      addLog(`Splitting questions text into ${textChunks.length} batches to parse in parallel.`);
      
      const parsePromises = textChunks.map(async (chunk, index) => {
        addLog(`Sending questions batch ${index + 1}/${textChunks.length} to Gemini AI...`);
        const response = await fetch("/api/parse-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunk, type: "questions", examType })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Batch ${index + 1} parsing failed: ${errData.error}`);
        }

        const data = await response.json();
        addLog(`Received parsed questions from batch ${index + 1}.`);
        return data.questions || [];
      });

      const results = await Promise.all(parsePromises);
      let allQuestions: ParsedQuestion[] = [];
      results.forEach(qs => {
        allQuestions = [...allQuestions, ...qs];
      });
      setCurrentProgress(80);

      // 4. Parse Answer Key text with Gemini
      addLog("Parsing Answer Key text with Gemini AI...");
      const aResponse = await fetch("/api/parse-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: keyText, type: "answers" })
      });

      if (!aResponse.ok) {
        const errData = await aResponse.json();
        throw new Error(`Failed parsing answer key: ${errData.error}`);
      }

      const aResult = await aResponse.json();
      const parsedAnswersList: { questionNumber: number; correctOption: string }[] = aResult.answers || [];
      addLog(`Parsed ${parsedAnswersList.length} answers from key.`);

      setCurrentProgress(90);

      // 5. Match answers with questions by questionNumber
      addLog("Matching questions with correct options...");
      const finalMatchedQuestions: ParsedQuestion[] = allQuestions.map(q => {
        const matchingAns = parsedAnswersList.find(a => a.questionNumber === q.questionNumber);
        
        return {
          ...q,
          // override correctOption if found in key, otherwise keep parsed option or empty
          correctOption: (matchingAns?.correctOption as any) || q.correctOption || ""
        };
      });

      // Find unmatched items
      const unmatchedQuestionsList = finalMatchedQuestions.filter(q => !q.correctOption);
      const unmatchedAnswersList = parsedAnswersList.filter(a => 
        !finalMatchedQuestions.some(q => q.questionNumber === a.questionNumber)
      );

      if (unmatchedQuestionsList.length > 0) {
        addLog(`⚠️ Warning: Questions ${unmatchedQuestionsList.map(q => q.questionNumber).join(", ")} have no matching answers.`);
      }
      if (unmatchedAnswersList.length > 0) {
        addLog(`⚠️ Warning: Answer key contains answers for questions that were not extracted: ${unmatchedAnswersList.map(a => a.questionNumber).join(", ")}`);
      }

      // Sort questions by number
      finalMatchedQuestions.sort((a, b) => a.questionNumber - b.questionNumber);

      setParsedQuestions(finalMatchedQuestions);
      setUnmatchedAnswers(unmatchedAnswersList);
      setCurrentProgress(100);
      addLog("🎉 Document parsing and matching completed!");
      setShowPreview(true);

    } catch (error: any) {
      console.error(error);
      addLog(`❌ Error processing: ${error.message}`);
      alert("Error processing documents: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual Mode Generation
  const generateManualSlots = () => {
    if (examType === "Boards") {
      let slots: ParsedQuestion[] = [];
      let qNum = 1;

      const addBoardSlots = (count: number, marksVal: number, typeVal: ParsedQuestion["questionType"], sectionVal: string) => {
        for (let i = 0; i < count; i++) {
          slots.push({
            questionNumber: qNum++,
            subject: "Other",
            section: sectionVal,
            questionText: "",
            options: {
              A: "",
              B: "",
              C: "",
              D: ""
            },
            correctOption: "",
            marks: marksVal,
            negativeMarks: 0,
            questionType: typeVal
          });
        }
      };

      if (selectedBoard === "CBSE_ISC") {
        if (selectedSetType === "35") {
          addBoardSlots(10, 1, "MCQ", "Section A (MCQ)");
          addBoardSlots(4, 1, "AssertionReason", "Section A (Assertion-Reason)");
          addBoardSlots(3, 2, "Subjective2M", "Section B (Very Short)");
          addBoardSlots(2, 3, "Subjective3M", "Section C (Short Answer)");
          addBoardSlots(1, 4, "CaseStudy", "Section D (Case Study)");
          addBoardSlots(1, 5, "Subjective5M", "Section E (Long Answer)");
        } else {
          addBoardSlots(12, 1, "MCQ", "Section A (MCQ)");
          addBoardSlots(4, 1, "AssertionReason", "Section A (Assertion-Reason)");
          addBoardSlots(5, 2, "Subjective2M", "Section B (Very Short)");
          addBoardSlots(7, 3, "Subjective3M", "Section C (Short Answer)");
          addBoardSlots(2, 4, "CaseStudy", "Section D (Case Study)");
          addBoardSlots(3, 5, "Subjective5M", "Section E (Long Answer)");
        }
      } else {
        if (selectedSetType === "35") {
          addBoardSlots(10, 1, "MCQ", "Section I (MCQ)");
          addBoardSlots(5, 1, "Objective", "Section II (Very Short / Objective)");
          addBoardSlots(3, 2, "Subjective2M", "Section III (Short Answer I)");
          addBoardSlots(3, 3, "Subjective3M", "Section IV (Short Answer II)");
          addBoardSlots(1, 5, "Subjective5M", "Section V (Long Answer)");
        } else {
          addBoardSlots(14, 1, "MCQ", "Section I (MCQ)");
          addBoardSlots(4, 1, "Objective", "Section II (Very Short / Objective)");
          addBoardSlots(5, 2, "Subjective2M", "Section III (Short Answer I)");
          addBoardSlots(9, 3, "Subjective3M", "Section IV (Short Answer II)");
          addBoardSlots(3, 5, "Subjective5M", "Section V (Long Answer)");
        }
      }

      if (slots.length > 0) {
        setParsedQuestions(slots);
        setManualGenerated(true);
        setShowPreview(true);
        return;
      }
    }

    if (numberOfQuestions <= 0) return;
    
    const slots: ParsedQuestion[] = Array.from({ length: numberOfQuestions }).map((_, i) => {
      const qNum = i + 1;
      let subject: "Physics" | "Chemistry" | "Botany" | "Zoology" | "Mathematics" | "Other" = "Physics";
      let section: "Section A" | "Section B" = "Section A";
      
      if (examType === "NEET") {
        if (qNum <= 50) {
          subject = "Physics";
          section = qNum <= 35 ? "Section A" : "Section B";
        } else if (qNum <= 100) {
          subject = "Chemistry";
          section = qNum <= 85 ? "Section A" : "Section B";
        } else if (qNum <= 150) {
          subject = "Botany";
          section = qNum <= 135 ? "Section A" : "Section B";
        } else {
          subject = "Zoology";
          section = qNum <= 185 ? "Section A" : "Section B";
        }
      } else if (examType === "JEE Main") {
        if (qNum <= 30) {
          subject = "Physics";
          section = qNum <= 20 ? "Section A" : "Section B";
        } else if (qNum <= 60) {
          subject = "Chemistry";
          section = qNum <= 50 ? "Section A" : "Section B";
        } else {
          subject = "Mathematics";
          section = qNum <= 80 ? "Section A" : "Section B";
        }
      } else if (examType === "JEE Advanced") {
        if (qNum <= 18) {
          subject = "Physics";
        } else if (qNum <= 36) {
          subject = "Chemistry";
        } else {
          subject = "Mathematics";
        }
        section = "Section A";
      }
      
      return {
        questionNumber: qNum,
        subject,
        section,
        questionText: "",
        options: {
          A: "",
          B: "",
          C: "",
          D: ""
        },
        correctOption: "",
        marks: 4,
        negativeMarks: 1
      };
    });
    
    setParsedQuestions(slots);
    setManualGenerated(true);
    setShowPreview(true);
  };

  // Edit Handlers
  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...parsedQuestions[index] });
  };

  const handleEditSave = () => {
    if (!editForm || editingIndex === null) return;
    const updated = [...parsedQuestions];
    updated[editingIndex] = editForm;
    setParsedQuestions(updated);
    setEditingIndex(null);
    setEditForm(null);
  };

  const handleDeleteQuestion = (index: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      const updated = parsedQuestions.filter((_, i) => i !== index);
      setParsedQuestions(updated);
    }
  };

  const handleAddQuestionManually = () => {
    const nextNum = parsedQuestions.length > 0 
      ? Math.max(...parsedQuestions.map(q => q.questionNumber)) + 1 
      : 1;
      
    const newQ: ParsedQuestion = {
      questionNumber: nextNum,
      subject: "Physics",
      questionText: "",
      options: {
        A: "",
        B: "",
        C: "",
        D: ""
      },
      correctOption: "",
      marks: 4,
      negativeMarks: 1
    };

    setParsedQuestions([...parsedQuestions, newQ]);
    handleEditClick(parsedQuestions.length); // edit the newly added question immediately
  };

  // Image upload handler inside editing modal
  const handleImageUpload = (file: File) => {
    if (!editForm) return;
    const localUrl = URL.createObjectURL(file);
    setEditForm({
      ...editForm,
      imageUrl: localUrl,
      imageFile: file
    });
  };

  const assignSections = (qs: ParsedQuestion[], type: string): ParsedQuestion[] => {
    const sorted = [...qs].sort((a, b) => a.questionNumber - b.questionNumber);
    const subjectGroups: Record<string, ParsedQuestion[]> = {};
    
    sorted.forEach(q => {
      const sub = q.subject || "Physics";
      if (!subjectGroups[sub]) {
        subjectGroups[sub] = [];
      }
      subjectGroups[sub].push(q);
    });

    Object.keys(subjectGroups).forEach(sub => {
      const group = subjectGroups[sub];
      group.sort((a, b) => a.questionNumber - b.questionNumber);
      group.forEach((q, idx) => {
        // Respect manually assigned Section B if present, else apply default bounds
        if (q.section === "Section B") return;
        
        if (type === "JEE Main") {
          q.section = idx < 20 ? "Section A" : "Section B";
        } else if (type === "NEET") {
          q.section = idx < 35 ? "Section A" : "Section B";
        } else {
          q.section = "Section A";
        }
      });
    });

    return sorted;
  };

  // Publish to Database
  const handlePublishTest = async () => {
    if (!testTitle) return alert("Please provide a Test Title.");
    if (examType === "Boards") {
      if (!selectedBoard) return alert("Please select an Exam Board.");
      if (!selectedClass) return alert("Please select a Class.");
    }
    if (parsedQuestions.length === 0) return alert("No questions to publish.");
    
    // Check if any question has no correct option
    const emptyAnswers = parsedQuestions.filter(q => !q.correctOption);
    if (emptyAnswers.length > 0) {
      const confirmPublish = confirm(`⚠️ Warning: Questions ${emptyAnswers.map(q => q.questionNumber).join(", ")} do not have a correct option selected. Do you still want to publish?`);
      if (!confirmPublish) return;
    }

    setIsPublishing(true);
    try {
      // 1. Create Test record in 'tests' table
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert([{
          title: testTitle,
          exam_type: examType,
          difficulty,
          duration,
          target_batch: targetBatch,
          status: 'live', // Publish it as live directly
          exam_board: selectedBoard,
          target_class: selectedClass
        }])
        .select()
        .single();

      if (testError) throw testError;

      // 2. Upload question images in parallel (if any)
      const uploadPromises = parsedQuestions.map(async (q) => {
        let finalImageUrl = "";
        
        if (q.imageFile) {
          const fileExt = q.imageFile.name.split('.').pop();
          const fileName = `questions/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('resources').upload(fileName, q.imageFile);
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(fileName);
            finalImageUrl = publicUrl;
          }
        } else if (q.imageUrl && q.imageUrl.startsWith("http")) {
          finalImageUrl = q.imageUrl;
        }
        return { ...q, finalImageUrl };
      });

      const questionsWithImages = await Promise.all(uploadPromises);

      // Assign sections dynamically based on the exam pattern rules
      const questionsWithSections = assignSections(questionsWithImages, examType);

      // 3. Insert all questions in bulk
      const questionsToInsert = questionsWithSections.map(q => ({
        test_id: testData.id,
        text: q.questionText || "Question text details",
        subject: q.subject,
        explanation: q.explanation || "",
        marks: q.marks,
        negative_marks: q.negativeMarks,
        question_number: q.questionNumber,
        image_url: q.finalImageUrl || "",
        section: q.section || "Section A",
        question_type: q.questionType || "MCQ"
      }));

      const { data: qRows, error: qError } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select('id, question_number');

      if (qError) throw qError;

      // 4. Map options and insert them in bulk
      const optionsToInsert: any[] = [];
      questionsWithSections.forEach(q => {
        const matchingInsertedQuestion = qRows.find(row => row.question_number === q.questionNumber);
        if (!matchingInsertedQuestion) return;

        const qType = q.questionType || "MCQ";
        if (qType === "MCQ") {
          Object.entries(q.options || { A: "", B: "", C: "", D: "" }).forEach(([letter, text]) => {
            optionsToInsert.push({
              question_id: matchingInsertedQuestion.id,
              text: text || `Option ${letter}`,
              is_correct: q.correctOption === letter,
              option_letter: letter
            });
          });
        } else if (qType === "AssertionReason") {
          const standardAROptions = {
            A: "Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.",
            B: "Both Assertion and Reason are true, but Reason is NOT the correct explanation of Assertion.",
            C: "Assertion is true, but Reason is false.",
            D: "Assertion is false, but Reason is true."
          };
          Object.entries(standardAROptions).forEach(([letter, text]) => {
            optionsToInsert.push({
              question_id: matchingInsertedQuestion.id,
              text: text,
              is_correct: q.correctOption === letter,
              option_letter: letter
            });
          });
        }
      });

      if (optionsToInsert.length > 0) {
        const { error: optError } = await supabase.from('options').insert(optionsToInsert);
        if (optError) throw optError;
      }

      // 5. Create notification for students
      const testNotificationTitle = examType === "DPP Quiz" ? "New DPP Quiz Live" : "New Test Live";
      const testNotificationMessage = `A new ${examType === "DPP Quiz" ? "DPP Quiz" : `${examType} Mock Test`} titled "${testTitle}" is now live for ${targetBatch}.`;
      await supabase.from('notifications').insert([
        {
          recipient_role: 'student',
          title: testNotificationTitle,
          message: testNotificationMessage,
          type: 'new_test',
          target_batch: targetBatch
        }
      ]);

      alert("🎉 Test and questions successfully saved & published!");
      router.push("/admin");

    } catch (error: any) {
      alert("Error publishing test: " + error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle JSON Import
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Find the questions array
        const questionsList = Array.isArray(json) ? json : json.questions;
        if (!Array.isArray(questionsList)) {
          alert("Invalid JSON format. Expected an array of questions or an object with a 'questions' array.");
          return;
        }

        // Map and validate questions
        const validatedQuestions: ParsedQuestion[] = questionsList.map((q: any, index: number) => {
          return {
            questionNumber: q.questionNumber || index + 1,
            subject: q.subject || "Physics",
            questionText: q.questionText || "",
            options: {
              A: q.options?.A || "",
              B: q.options?.B || "",
              C: q.options?.C || "",
              D: q.options?.D || ""
            },
            correctOption: q.correctOption || "",
            explanation: q.explanation || "",
            marks: q.marks || 4,
            negativeMarks: q.negativeMarks || 1,
            imageUrl: q.imageUrl || "",
            imageFile: null,
            section: q.section || "Section A",
            questionType: q.questionType || "MCQ"
          };
        });

        if (json.testTitle) {
          setTestTitle(json.testTitle);
        }

        setParsedQuestions(validatedQuestions);
        setShowPreview(true);
        alert(`Successfully imported ${validatedQuestions.length} questions!`);
      } catch (err: any) {
        alert("Error parsing JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="min-h-screen bg-slate-950 text-white font-body p-4 md:p-12 relative overflow-hidden">
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        onLoad={initPdfjs}
      />
      
      {/* Background Neon Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <Link href="/admin" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Target className="w-8 h-8 text-orange-500" />
              Mock Test Creator
            </h1>
            <p className="text-white/50 mt-1">Deploy automated exams from PDF question booklets & answer sheets.</p>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2 border-b border-white/5 pb-3">
            <Settings className="w-5 h-5 text-orange-500" /> Basic Details & Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase ml-1">Mock Test Title</label>
              <input 
                type="text" 
                value={testTitle}
                onChange={e => setTestTitle(e.target.value)}
                placeholder="e.g. NEET Mock Test 1 - Full Syllabus"
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase ml-1">Target Batch</label>
                <select 
                  value={targetBatch} 
                  onChange={e => setTargetBatch(e.target.value)} 
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-orange-500 outline-none cursor-pointer"
                >
                  <option>All Students</option>
                  <option>Class 11</option>
                  <option>Class 12</option>
                  <option>IIT JEE Batch</option>
                  <option>NEET Batch</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase ml-1">Duration (Mins)</label>
                <input 
                  type="number" 
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-orange-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-white/70">
                <label className="text-xs font-bold uppercase tracking-wider">Difficulty Level</label>
                <span className="font-bold text-orange-500 text-sm">Level {difficulty}</span>
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase ml-1">Target Exam Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {["NEET", "JEE Main", "JEE Advanced", "DPP Quiz", "Boards"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setExamType(type as any)}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs transition-all ${
                      examType === type 
                        ? "bg-orange-500/20 border-orange-500 text-orange-400 font-extrabold"
                        : "bg-slate-900/50 border-white/10 text-white/50 hover:bg-white/5"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {examType === "Boards" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5 animate-in fade-in duration-200">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase ml-1">BOARD</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "WB", label: "West Bengal Board" },
                    { id: "CBSE_ISC", label: "CBSE / ISC" }
                  ].map((boardOption) => (
                    <button
                      key={boardOption.id}
                      type="button"
                      onClick={() => setSelectedBoard(boardOption.id as any)}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-xs transition-all ${
                        selectedBoard === boardOption.id
                          ? "bg-orange-500/20 border-orange-500 text-orange-400 font-extrabold"
                          : "bg-slate-900/50 border-white/10 text-white/50 hover:bg-white/5"
                      }`}
                    >
                      {boardOption.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase ml-1">SET TYPE</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "35", label: "35 Marks Set" },
                    { id: "70", label: "70 Marks Set" }
                  ].map((setOption) => (
                    <button
                      key={setOption.id}
                      type="button"
                      onClick={() => setSelectedSetType(setOption.id as any)}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-xs transition-all ${
                        selectedSetType === setOption.id
                          ? "bg-orange-500/20 border-orange-500 text-orange-400 font-extrabold"
                          : "bg-slate-900/50 border-white/10 text-white/50 hover:bg-white/5"
                      }`}
                    >
                      {setOption.label}
                    </button>
                  ))}
                </div>
              </div>

              <div 
                className={`space-y-2 transition-all duration-200 ease-out transform ${
                  showClassDropdown 
                    ? "opacity-100 translate-y-0 max-h-24" 
                    : "opacity-0 -translate-y-2 max-h-0 overflow-hidden pointer-events-none"
                }`}
              >
                <label className="text-xs font-bold text-white/50 uppercase ml-1">CLASS</label>
                <select
                  value={selectedClass || ""}
                  onChange={(e) => setSelectedClass(e.target.value as any)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-orange-500 outline-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Select Class</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Dual Mode Switcher */}
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 max-w-md mx-auto">
          <button
            onClick={() => { setCreationMode("upload"); setShowPreview(parsedQuestions.length > 0); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              creationMode === "upload" 
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg" 
                : "text-white/60 hover:text-white"
            }`}
          >
            <Upload className="w-4 h-4" /> PDF Auto-Parse
          </button>
          <button
            onClick={() => { setCreationMode("manual"); setShowPreview(manualGenerated); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              creationMode === "manual" 
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg" 
                : "text-white/60 hover:text-white"
            }`}
          >
            <PenTool className="w-4 h-4" /> Manual Entry
          </button>
        </div>

        {/* Upload Mode UI */}
        {creationMode === "upload" && !showPreview && (
          <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-400 flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-orange-400 animate-pulse" />
                AI-Powered {examType || "Mock Test"} Parser Engine
              </h2>
              <p className="text-white/50 text-sm max-w-lg mx-auto">Upload the question sheet and the correct answer key. The system will automatically construct the test, map questions, correct choices, marks, and negative markings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Question booklet PDF dropzone */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white/50 uppercase ml-1 flex items-center gap-1.5"><FileText className="w-4 h-4 text-cyan-400" /> 1. Question Booklet PDF</span>
                <label className="h-44 border-2 border-dashed border-white/20 hover:border-cyan-500/50 rounded-2xl cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all flex flex-col items-center justify-center p-6 text-center group">
                  <Upload className="w-8 h-8 text-white/40 group-hover:text-cyan-400 transition-colors mb-3 group-hover:scale-110 transform duration-300" />
                  {questionPdf ? (
                    <span className="text-sm text-cyan-400 font-bold max-w-full truncate">{questionPdf.name}</span>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-white/80">Select Question PDF</span>
                      <span className="text-[10px] text-white/30 mt-1">Select file to parse questions</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={e => e.target.files && setQuestionPdf(e.target.files[0])} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Answer sheet PDF or manual entry */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white/50 uppercase ml-1 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> 2. Answer Key (PDF or Paste)</span>
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-900/40">
                  <div className="flex border-b border-white/10 bg-slate-950/60 p-1">
                    <button 
                      type="button" 
                      onClick={() => setAnswerText("")} 
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${!answerText ? 'bg-white/10 text-white' : 'text-white/40'}`}
                    >
                      Upload PDF Key
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setAnswerText("1. A\n2. B\n3. D\n4. C")} 
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${answerText ? 'bg-white/10 text-white' : 'text-white/40'}`}
                    >
                      Paste Text Key
                    </button>
                  </div>
                  {answerText ? (
                    <textarea
                      value={answerText}
                      onChange={e => setAnswerText(e.target.value)}
                      placeholder={`e.g.\n1. A\n2. B\n3. C\n4. D`}
                      className="w-full h-32 bg-transparent text-sm p-4 text-white placeholder-white/20 focus:outline-none font-mono resize-none"
                    />
                  ) : (
                    <label className="h-32 cursor-pointer transition-all flex flex-col items-center justify-center p-4 text-center group">
                      <Upload className="w-6 h-6 text-white/40 group-hover:text-green-400 transition-colors mb-2 group-hover:scale-110 transform duration-300" />
                      {answerPdf ? (
                        <span className="text-xs text-green-400 font-bold max-w-full truncate">{answerPdf.name}</span>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-white/80">Select Answer Key PDF</span>
                          <span className="text-[10px] text-white/30 mt-0.5">Will extract answer letters</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={e => e.target.files && setAnswerPdf(e.target.files[0])} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>

            </div>

            {/* Run process button */}
            <button
              type="button"
              disabled={isProcessing || !pdfjsLoaded}
              onClick={handleProcessDocuments}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-slate-950 hover:text-white font-extrabold text-lg transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" /> Extracting & Processing PDF (using Gemini)...
                </>
              ) : (
                <>
                  {!pdfjsLoaded ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-slate-950 group-hover:text-white transition-colors" />}
                  Process & Auto-Build {examType === "DPP Quiz" ? "DPP Quiz" : `${examType} Exam`}
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="h-[1px] flex-1 bg-white/10"></div>
              <span className="text-xs font-bold text-white/30 uppercase tracking-wider">OR</span>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>

            {/* JSON Import Section */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white/95">Import pre-compiled JSON test data</h3>
                <p className="text-xs text-white/40">Select a pre-compiled JSON file containing questions and options.</p>
              </div>
              <label className="py-2.5 px-6 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-all font-bold text-xs cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Select JSON File
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportJson} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        )}

        {/* Manual Mode Selection UI */}
        {creationMode === "manual" && !showPreview && (
          <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl space-y-6 text-center animate-in fade-in duration-300">
            <div className="max-w-md mx-auto space-y-4">
              <Type className="w-12 h-12 text-orange-500 mx-auto animate-bounce" />
              <h3 className="text-xl font-bold">Manual Test Creator</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Generate empty question slots matching your requirements, then fill in details manually.
              </p>
              
              {examType === "Boards" ? (
                <div className="space-y-4 text-left border-t border-white/5 pt-4">
                  <span className="text-xs font-bold text-white/50 uppercase ml-1 block">Template Summary</span>
                  
                  {!selectedBoard ? (
                    <div className="p-4 rounded-xl bg-slate-900 border border-white/5 text-xs text-white/40 text-center">
                      Please select a Board in the settings above to view the template details.
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-900/50">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-white/50">
                            <th className="p-3 font-semibold uppercase">Question Type</th>
                            <th className="p-3 font-semibold uppercase">Marks Each</th>
                            <th className="p-3 font-semibold uppercase text-right">No. of Qs</th>
                            <th className="p-3 font-semibold uppercase text-right">Total Marks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/70">
                          {selectedBoard === "CBSE_ISC" ? (
                            selectedSetType === "35" ? (
                              <>
                                <tr><td className="p-3 font-medium">MCQ</td><td className="p-3">1 Mark</td><td className="p-3 text-right">10</td><td className="p-3 text-right font-bold text-cyan-400">10</td></tr>
                                <tr><td className="p-3 font-medium">Assertion-Reason</td><td className="p-3">1 Mark</td><td className="p-3 text-right">4</td><td className="p-3 text-right font-bold text-cyan-400">4</td></tr>
                                <tr><td className="p-3 font-medium">Very Short Answer</td><td className="p-3">2 Marks</td><td className="p-3 text-right">3</td><td className="p-3 text-right font-bold text-cyan-400">6</td></tr>
                                <tr><td className="p-3 font-medium">Short Answer</td><td className="p-3">3 Marks</td><td className="p-3 text-right">2</td><td className="p-3 text-right font-bold text-cyan-400">6</td></tr>
                                <tr><td className="p-3 font-medium">Case Study</td><td className="p-3">4 Marks</td><td className="p-3 text-right">1</td><td className="p-3 text-right font-bold text-cyan-400">4</td></tr>
                                <tr><td className="p-3 font-medium">Long Answer</td><td className="p-3">5 Marks</td><td className="p-3 text-right">1</td><td className="p-3 text-right font-bold text-cyan-400">5</td></tr>
                                <tr className="bg-white/5 text-white border-t border-white/10 font-bold">
                                  <td className="p-3" colSpan={2}>Grand Total</td>
                                  <td className="p-3 text-right">21</td>
                                  <td className="p-3 text-right text-orange-500">35 Marks</td>
                                </tr>
                              </>
                            ) : (
                              <>
                                <tr><td className="p-3 font-medium">MCQ</td><td className="p-3">1 Mark</td><td className="p-3 text-right">12</td><td className="p-3 text-right font-bold text-cyan-400">12</td></tr>
                                <tr><td className="p-3 font-medium">Assertion-Reason</td><td className="p-3">1 Mark</td><td className="p-3 text-right">4</td><td className="p-3 text-right font-bold text-cyan-400">4</td></tr>
                                <tr><td className="p-3 font-medium">Very Short Answer</td><td className="p-3">2 Marks</td><td className="p-3 text-right">5</td><td className="p-3 text-right font-bold text-cyan-400">10</td></tr>
                                <tr><td className="p-3 font-medium">Short Answer</td><td className="p-3">3 Marks</td><td className="p-3 text-right">7</td><td className="p-3 text-right font-bold text-cyan-400">21</td></tr>
                                <tr><td className="p-3 font-medium">Case Study</td><td className="p-3">4 Marks</td><td className="p-3 text-right">2</td><td className="p-3 text-right font-bold text-cyan-400">8</td></tr>
                                <tr><td className="p-3 font-medium">Long Answer</td><td className="p-3">5 Marks</td><td className="p-3 text-right">3</td><td className="p-3 text-right font-bold text-cyan-400">15</td></tr>
                                <tr className="bg-white/5 text-white border-t border-white/10 font-bold">
                                  <td className="p-3" colSpan={2}>Grand Total</td>
                                  <td className="p-3 text-right">33</td>
                                  <td className="p-3 text-right text-orange-500">70 Marks</td>
                                </tr>
                              </>
                            )
                          ) : (
                            selectedSetType === "35" ? (
                              <>
                                <tr><td className="p-3 font-medium">MCQ</td><td className="p-3">1 Mark</td><td className="p-3 text-right">10</td><td className="p-3 text-right font-bold text-cyan-400">10</td></tr>
                                <tr><td className="p-3 font-medium">Very Short / Objective</td><td className="p-3">1 Mark</td><td className="p-3 text-right">5</td><td className="p-3 text-right font-bold text-cyan-400">5</td></tr>
                                <tr><td className="p-3 font-medium">Short Answer I</td><td className="p-3">2 Marks</td><td className="p-3 text-right">3</td><td className="p-3 text-right font-bold text-cyan-400">6</td></tr>
                                <tr><td className="p-3 font-medium">Short Answer II</td><td className="p-3">3 Marks</td><td className="p-3 text-right">3</td><td className="p-3 text-right font-bold text-cyan-400">9</td></tr>
                                <tr><td className="p-3 font-medium">Long Answer</td><td className="p-3">5 Marks</td><td className="p-3 text-right">1</td><td className="p-3 text-right font-bold text-cyan-400">5</td></tr>
                                <tr className="bg-white/5 text-white border-t border-white/10 font-bold">
                                  <td className="p-3" colSpan={2}>Grand Total</td>
                                  <td className="p-3 text-right">22</td>
                                  <td className="p-3 text-right text-orange-500">35 Marks</td>
                                </tr>
                              </>
                            ) : (
                              <>
                                <tr><td className="p-3 font-medium">MCQ</td><td className="p-3">1 Mark</td><td className="p-3 text-right">14</td><td className="p-3 text-right font-bold text-cyan-400">14</td></tr>
                                <tr><td className="p-3 font-medium">Very Short / Objective</td><td className="p-3">1 Mark</td><td className="p-3 text-right">4</td><td className="p-3 text-right font-bold text-cyan-400">4</td></tr>
                                <tr><td className="p-3 font-medium">Short Answer I</td><td className="p-3">2 Marks</td><td className="p-3 text-right">5</td><td className="p-3 text-right font-bold text-cyan-400">10</td></tr>
                                <tr><td className="p-3 font-medium">Short Answer II</td><td className="p-3">3 Marks</td><td className="p-3 text-right">9</td><td className="p-3 text-right font-bold text-cyan-400">27</td></tr>
                                <tr><td className="p-3 font-medium">Long Answer</td><td className="p-3">5 Marks</td><td className="p-3 text-right">3</td><td className="p-3 text-right font-bold text-cyan-400">15</td></tr>
                                <tr className="bg-white/5 text-white border-t border-white/10 font-bold">
                                  <td className="p-3" colSpan={2}>Grand Total</td>
                                  <td className="p-3 text-right">35</td>
                                  <td className="p-3 text-right text-orange-500">70 Marks</td>
                                </tr>
                              </>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-white/50 uppercase ml-1">Number of Question Slots</label>
                  <input 
                    type="number" 
                    value={numberOfQuestions} 
                    onChange={e => setNumberOfQuestions(Number(e.target.value))}
                    placeholder="e.g. 180" 
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none"
                  />
                </div>
              )}

              <button
                onClick={generateManualSlots}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl transition-all shadow-md"
              >
                Generate {numberOfQuestions} Empty Slots
              </button>
            </div>
          </div>
        )}

        {/* Processing Logs Console */}
        {isProcessing && (
          <div className="p-6 rounded-2xl bg-black border border-white/10 font-mono text-xs space-y-3">
            <div className="flex justify-between items-center text-white/50 border-b border-white/5 pb-2">
              <span>EXTRACTION LOG CONSOLE</span>
              <span className="text-orange-400 font-bold">{currentProgress}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div className="bg-orange-500 h-1.5 transition-all duration-300" style={{ width: `${currentProgress}%` }} />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 scrollbar-hide">
              {progressLogs.map((log, index) => (
                <div key={index} className={log.includes("❌") ? "text-red-400" : log.includes("⚠️") ? "text-yellow-400" : "text-white/70"}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parsed Result Preview List */}
        {showPreview && (
          <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            
            {/* Preview Banner Header */}
            <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  Review {examType === "DPP Quiz" ? "DPP Quiz" : `${examType} Mock Test`} Structure
                </h2>
                <p className="text-white/50 text-xs mt-1">
                  Double check, filter, or edit the extracted question contents before publishing to student portals.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { 
                    setCreationMode("upload"); 
                    setShowPreview(false); 
                    setParsedQuestions([]); 
                  }}
                  className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs transition-all"
                >
                  Start Over
                </button>
                <button
                  onClick={handlePublishTest}
                  disabled={isPublishing}
                  className="py-2.5 px-5 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center gap-1.5"
                >
                  {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Publish {examType === "DPP Quiz" ? "DPP Quiz" : `${examType} Test`} Live
                </button>
              </div>
            </div>

            {/* Warnings Alerts for Unmatched data */}
            {(unmatchedAnswers.length > 0 || parsedQuestions.some(q => !q.correctOption)) && (
              <div className="p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" /> Warning: Unmatched items detected during parsing
                </div>
                <ul className="text-xs space-y-1 ml-1 leading-relaxed">
                  {parsedQuestions.some(q => !q.correctOption) && (
                    <li>• Missing answers: Questions <strong>{parsedQuestions.filter(q => !q.correctOption).map(q => q.questionNumber).join(", ")}</strong> do not have a correct answer marked.</li>
                  )}
                  {unmatchedAnswers.length > 0 && (
                    <li>• Unused key answers: Key has answers for Qs <strong>{unmatchedAnswers.map(u => u.questionNumber).join(", ")}</strong> which were not parsed from the question booklet.</li>
                  )}
                </ul>
              </div>
            )}

            {/* Questions Checklist & Editor container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Question list (Left 2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-white/80">Parsed Test Questions ({parsedQuestions.length})</h3>
                  <button
                    onClick={handleAddQuestionManually}
                    className="flex items-center gap-1 bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question Manually
                  </button>
                </div>

                <div className="space-y-4">
                  {parsedQuestions.map((q, idx) => {
                    const isSubjectiveOrObjective = q.questionType && ["Objective", "Subjective2M", "Subjective3M", "Subjective5M", "CaseStudy"].includes(q.questionType);
                    const hasCorrectOption = isSubjectiveOrObjective || !!q.correctOption;
                    const subjectColors = {
                      Physics: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                      Chemistry: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                      Botany: "bg-green-500/10 text-green-400 border-green-500/20",
                      Zoology: "bg-orange-500/10 text-orange-400 border-orange-500/20",
                      Mathematics: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                      Other: "bg-slate-500/10 text-slate-400 border-slate-500/20",
                    };

                    const typeLabels: Record<string, string> = {
                      MCQ: "MCQ",
                      AssertionReason: "Assertion-Reason",
                      Objective: "Objective / VSA",
                      Subjective2M: "Subjective (2M)",
                      Subjective3M: "Subjective (3M)",
                      Subjective5M: "Subjective (5M)",
                      CaseStudy: "Case Study (4M)"
                    };

                    return (
                      <div 
                        key={idx} 
                        className={`p-6 rounded-2xl bg-slate-900 border transition-all ${
                          !hasCorrectOption ? 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-extrabold text-orange-400 text-lg">Q.{q.questionNumber}</span>
                            <span className={`px-2.5 py-0.5 rounded-md border text-xs font-bold ${subjectColors[q.subject] || subjectColors.Other}`}>
                              {q.subject}
                            </span>
                            {q.questionType && (
                              <span className="px-2.5 py-0.5 rounded-md border border-cyan-500/30 bg-cyan-500/5 text-xs text-cyan-400 font-bold">
                                {typeLabels[q.questionType] || q.questionType}
                              </span>
                            )}
                            {q.section && (
                              <span className="px-2.5 py-0.5 rounded-md border border-white/10 bg-white/5 text-xs text-white/60 font-medium">
                                {q.section}
                              </span>
                            )}
                            <span className="text-[10px] text-white/40 font-mono">
                              +{q.marks} / -{q.negativeMarks} Marks
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(idx)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors border border-white/5"
                              title="Edit question details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(idx)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-red-500/10"
                              title="Delete question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Image Preview */}
                        {q.imageUrl && (
                          <div className="mb-4 max-w-sm rounded-xl overflow-hidden border border-white/5 bg-slate-950">
                            <img src={q.imageUrl} alt="Diagram" className="w-full h-auto object-contain max-h-48" />
                          </div>
                        )}

                        <p className="text-white/90 text-sm whitespace-pre-wrap leading-relaxed mb-5 font-medium">
                          {q.questionText || <span className="text-red-400 italic">Empty question text</span>}
                        </p>

                        {/* Options */}
                        {!isSubjectiveOrObjective ? (
                          <div className={`grid gap-3 mb-4 ${q.questionType === "AssertionReason" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                            {Object.entries(
                              q.questionType === "AssertionReason" 
                              ? {
                                  A: "Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.",
                                  B: "Both Assertion and Reason are true, but Reason is NOT the correct explanation of Assertion.",
                                  C: "Assertion is true, but Reason is false.",
                                  D: "Assertion is false, but Reason is true."
                                }
                              : (q.options || { A: "", B: "", C: "", D: "" })
                            ).map(([letter, text]) => {
                              const isCorrect = q.correctOption === letter;
                              return (
                                <div 
                                  key={letter} 
                                  className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                                    isCorrect 
                                      ? "bg-green-500/10 border-green-500/30 text-green-400" 
                                      : "bg-slate-950/40 border-white/5 text-white/70"
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border ${
                                    isCorrect 
                                      ? "bg-green-500 text-slate-950 border-green-400" 
                                      : "bg-white/5 border-white/10 text-white/50"
                                  }`}>
                                    {letter}
                                  </span>
                                  <span className="break-words whitespace-normal leading-relaxed text-left flex-1">{text || <span className="text-red-400 italic">Empty option</span>}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 text-xs text-white/40 italic mb-4">
                            Subjective/Objective written question (answers submitted via text responses)
                          </div>
                        )}

                        {/* Explanation block */}
                        {q.explanation && (
                          <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/40 leading-relaxed whitespace-pre-wrap">
                            <span className="font-bold text-white/60 block mb-1">Explanation:</span>
                            {q.explanation}
                          </div>
                        )}
                        
                        {!hasCorrectOption && (
                          <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> No correct answer is marked for this question.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar editing drawer / warnings checklist (Right 1 col) */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-xl space-y-4 sticky top-6">
                  <h3 className="font-bold text-base border-b border-white/5 pb-2">Questions Checklist</h3>
                  <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
                    {parsedQuestions.map((q, idx) => {
                      const hasText = !!q.questionText;
                      const hasAns = !!q.correctOption;
                      
                      let statusStyle = "bg-white/5 border border-white/10 text-white/40";
                      if (hasText && hasAns) statusStyle = "bg-green-500/20 border-green-500/30 text-green-400";
                      if (!hasAns) statusStyle = "bg-red-500/20 border-red-500/30 text-red-400";

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            const element = document.getElementById(`question-${idx}`);
                            handleEditClick(idx);
                          }}
                          className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${statusStyle} hover:scale-105`}
                        >
                          {q.questionNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="text-xs text-white/40 border-t border-white/5 pt-3 leading-relaxed">
                    Click any checklist number to view and edit that question slot.
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Edit Question Dialog Modal */}
      {editingIndex !== null && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 md:p-8 space-y-6">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-500" />
                Edit Question Slot {editForm.questionNumber}
              </h3>
              <button 
                onClick={() => { setEditingIndex(null); setEditForm(null); }}
                className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase block mb-1">Subject</label>
                <select
                  value={editForm.subject}
                  onChange={e => setEditForm({ ...editForm, subject: e.target.value as any })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none cursor-pointer"
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Botany">Botany</option>
                  <option value="Zoology">Zoology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-white/40 uppercase block mb-1">Question Type</label>
                <select
                  value={editForm.questionType || "MCQ"}
                  onChange={e => {
                    const qType = e.target.value as any;
                    let m = editForm.marks;
                    if (qType === "MCQ" || qType === "AssertionReason" || qType === "Objective") m = 1;
                    else if (qType === "Subjective2M") m = 2;
                    else if (qType === "Subjective3M") m = 3;
                    else if (qType === "CaseStudy") m = 4;
                    else if (qType === "Subjective5M") m = 5;
                    setEditForm({ ...editForm, questionType: qType, marks: m });
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none cursor-pointer"
                >
                  <option value="MCQ">MCQ</option>
                  <option value="AssertionReason">Assertion-Reason</option>
                  <option value="Objective">Objective / VSA (1M)</option>
                  <option value="Subjective2M">Subjective (2M)</option>
                  <option value="Subjective3M">Subjective (3M)</option>
                  <option value="CaseStudy">Case Study (4M)</option>
                  <option value="Subjective5M">Subjective (5M)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-white/40 uppercase block mb-1">Section</label>
                {examType === "Boards" ? (
                  <input
                    type="text"
                    value={editForm.section || ""}
                    onChange={e => setEditForm({ ...editForm, section: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none"
                    placeholder="e.g. Section A"
                  />
                ) : (
                  <select
                    value={editForm.section || "Section A"}
                    onChange={e => setEditForm({ ...editForm, section: e.target.value as any })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none cursor-pointer"
                  >
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                  </select>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase block mb-1">Marks</label>
                  <input
                    type="number"
                    value={editForm.marks}
                    onChange={e => setEditForm({ ...editForm, marks: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase block mb-1">Neg Marks</label>
                  <input
                    type="number"
                    value={editForm.negativeMarks}
                    onChange={e => setEditForm({ ...editForm, negativeMarks: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-sm focus:border-orange-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-white/40 uppercase block">Question Text</label>
              <textarea
                value={editForm.questionText}
                onChange={e => setEditForm({ ...editForm, questionText: e.target.value })}
                className="w-full h-28 bg-slate-950 border border-white/10 rounded-xl p-4 text-sm focus:border-orange-500 outline-none"
                placeholder="Enter question content..."
              />
            </div>

            {/* Image attachment */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-white/40 uppercase block">Question Diagram / Image (Optional)</label>
              <div className="flex gap-4 items-center">
                {editForm.imageUrl && (
                  <div className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden shrink-0 bg-slate-950">
                    <img src={editForm.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
                <label className="flex-1 py-3 border border-dashed border-white/20 hover:border-orange-500/50 rounded-xl cursor-pointer bg-slate-950 text-center text-xs text-white/50 hover:text-white transition-colors">
                  Upload image file
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => e.target.files && handleImageUpload(e.target.files[0])} 
                    className="hidden" 
                  />
                </label>
                {editForm.imageUrl && (
                  <button 
                    type="button"
                    onClick={() => setEditForm({ ...editForm, imageUrl: "", imageFile: null })}
                    className="text-xs text-red-400 hover:text-red-300 font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Options Input and correct radio selection */}
            {!(editForm.questionType && ["Objective", "Subjective2M", "Subjective3M", "Subjective5M", "CaseStudy"].includes(editForm.questionType)) ? (
              <div className="space-y-3">
                <label className="text-xs font-bold text-white/40 uppercase block">Options & Correct Answer Choice</label>
                
                {editForm.questionType === "AssertionReason" && (
                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-xs text-white/60 space-y-1 mb-2">
                    <span className="font-bold text-cyan-400 block">Standard Assertion-Reason Choices:</span>
                    <p><strong>A.</strong> Both Assertion & Reason are true, and Reason is the correct explanation.</p>
                    <p><strong>B.</strong> Both Assertion & Reason are true, but Reason is NOT the correct explanation.</p>
                    <p><strong>C.</strong> Assertion is true, but Reason is false.</p>
                    <p><strong>D.</strong> Assertion is false, but Reason is true.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["A", "B", "C", "D"].map((letter) => {
                    const isCorrect = editForm.correctOption === letter;
                    return (
                      <div key={letter} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, correctOption: letter as any })}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isCorrect ? 'border-green-500 bg-green-500/20' : 'border-white/10 hover:border-white/30'
                          }`}
                          title={`Mark option ${letter} as correct`}
                        >
                          {isCorrect && <div className="w-3 h-3 bg-green-500 rounded-full" />}
                        </button>
                        
                        <div className="flex-1 flex gap-2">
                          <span className="text-xs font-bold text-white/40 shrink-0 self-center">{letter}</span>
                          {editForm.questionType === "AssertionReason" ? (
                            <span className="text-xs text-white/60 self-center py-2 truncate">
                              {letter === "A" && "Both Assertion & Reason are true, and Reason is correct..."}
                              {letter === "B" && "Both Assertion & Reason are true, but Reason is not correct..."}
                              {letter === "C" && "Assertion is true, but Reason is false."}
                              {letter === "D" && "Assertion is false, but Reason is true."}
                            </span>
                          ) : (
                            <input
                              type="text"
                              // @ts-ignore
                              value={editForm.options?.[letter] || ""}
                              // @ts-ignore
                              onChange={e => setEditForm({
                                ...editForm,
                                options: {
                                  ...(editForm.options || { A: "", B: "", C: "", D: "" }),
                                  [letter]: e.target.value
                                }
                              })}
                              placeholder={`Option ${letter} details...`}
                              className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs text-white/80 focus:border-orange-500 outline-none"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 text-xs text-white/50 italic">
                ℹ️ This question is configured as <strong>written subjective / short answer</strong>. Students will write their responses in a text block in the Exam Hall. No multiple choice options are required.
              </div>
            )}

            {/* Explanation */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-white/40 uppercase block">Explanation / solution details</label>
              <textarea
                value={editForm.explanation || ""}
                onChange={e => setEditForm({ ...editForm, explanation: e.target.value })}
                className="w-full h-20 bg-slate-950 border border-white/10 rounded-xl p-3 text-xs focus:border-orange-500 outline-none"
                placeholder="Write step-by-step calculation or core logic explanation..."
              />
            </div>

            {/* Save / Close buttons */}
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => { setEditingIndex(null); setEditForm(null); }}
                className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                className="py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
