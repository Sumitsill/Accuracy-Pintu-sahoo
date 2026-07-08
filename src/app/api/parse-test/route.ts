import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, type, examType } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided to parse' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in .env.local' }, { status: 500 });
    }

    // Define response schema based on parsing type
    let responseSchema: any;
    let systemInstruction = "";

    if (type === 'questions') {
      if (examType === 'Boards') {
        systemInstruction = "You are a professional board exam question parser. Analyze the provided test text and extract all questions. For each question, extract its number, text, subject (group into 'Physics', 'Chemistry', 'Botany', 'Zoology', 'Mathematics', or 'Other'), marks, negative marks (default is 0), section (e.g. 'Section A', 'Section B', etc.), and questionType ('MCQ', 'AssertionReason', 'Objective', 'Subjective2M', 'Subjective3M', 'Subjective5M', or 'CaseStudy'). For MCQ and AssertionReason questions, extract their options (A, B, C, D) and correctOption (if specified/available). For AssertionReason, the options A, B, C, D must be the standard: A (both true/correct explanation), B (both true/not correct explanation), C (A true, R false), D (A false, R true). For Objective and Subjective types, options are not required and can be omitted. Keep formatting clean and maintain the original exam integrity.";

        responseSchema = {
          type: "object",
          properties: {
            testTitle: {
              type: "string",
              description: "The overall title of the test (e.g. 'CBSE Class 12 Physics Term Exam'). If not found, use a reasonable default."
            },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionNumber: {
                    type: "integer",
                    description: "Question number (e.g. 1, 2, 3, etc.)"
                  },
                  subject: {
                    type: "string",
                    enum: ["Physics", "Chemistry", "Botany", "Zoology", "Mathematics", "Other"],
                    description: "Subject area (Physics, Chemistry, Botany, Zoology, Mathematics, or Other)"
                  },
                  questionText: {
                    type: "string",
                    description: "The question text, excluding option choices."
                  },
                  questionType: {
                    type: "string",
                    enum: ["MCQ", "AssertionReason", "Objective", "Subjective2M", "Subjective3M", "Subjective5M", "CaseStudy"],
                    description: "The specific question type: MCQ, AssertionReason, Objective, Subjective2M, Subjective3M, Subjective5M, or CaseStudy"
                  },
                  section: {
                    type: "string",
                    description: "The section of the test (e.g. 'Section A', 'Section B', etc.)"
                  },
                  options: {
                    type: "object",
                    properties: {
                      A: { type: "string", description: "Option A text" },
                      B: { type: "string", description: "Option B text" },
                      C: { type: "string", description: "Option C text" },
                      D: { type: "string", description: "Option D text" }
                    }
                  },
                  correctOption: {
                    type: "string",
                    enum: ["A", "B", "C", "D"],
                    description: "The correct option (A, B, C, or D). Omit if not explicitly stated."
                  },
                  explanation: {
                    type: "string",
                    description: "The explanation or solution path, if available."
                  },
                  marks: {
                    type: "integer",
                    description: "Positive marks for correct answer."
                  },
                  negativeMarks: {
                    type: "integer",
                    description: "Negative marks for incorrect answer. Default is 0."
                  }
                },
                required: ["questionNumber", "subject", "questionText", "questionType", "marks", "negativeMarks"]
              }
            }
          },
          required: ["testTitle", "questions"]
        };
      } else {
        systemInstruction = "You are a professional NTA exam question parser. Analyze the provided test text and extract all multiple choice questions. For each question, extract its number, text, options (A, B, C, D), subject (group into 'Physics', 'Chemistry', 'Botany', 'Zoology', 'Mathematics', or 'Other'), marks (default is 4), negative marks (default is 1), correct option if present, and explanation if available. Keep formatting clean and maintain the original exam integrity.";
        
        responseSchema = {
          type: "object",
          properties: {
            testTitle: {
              type: "string",
              description: "The overall title of the test (e.g. 'NEET Mock Test 1'). If not found, use a reasonable default."
            },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionNumber: {
                    type: "integer",
                    description: "Question number (e.g. 1, 2, 3, etc.)"
                  },
                  subject: {
                    type: "string",
                    enum: ["Physics", "Chemistry", "Botany", "Zoology", "Mathematics", "Other"],
                    description: "Subject area (Physics, Chemistry, Botany, Zoology, Mathematics, or Other)"
                  },
                  questionText: {
                    type: "string",
                    description: "The question text, excluding option choices."
                  },
                  options: {
                    type: "object",
                    properties: {
                      A: { type: "string", description: "Option A text" },
                      B: { type: "string", description: "Option B text" },
                      C: { type: "string", description: "Option C text" },
                      D: { type: "string", description: "Option D text" }
                    },
                    required: ["A", "B", "C", "D"]
                  },
                  correctOption: {
                    type: "string",
                    enum: ["A", "B", "C", "D"],
                    description: "The correct option (A, B, C, or D). Omit if not explicitly stated in question text."
                  },
                  explanation: {
                    type: "string",
                    description: "The explanation or solution path for the question, if available. Otherwise, leave empty."
                  },
                  marks: {
                    type: "integer",
                    description: "Positive marks for correct answer. Default is 4."
                  },
                  negativeMarks: {
                    type: "integer",
                    description: "Negative marks for incorrect answer. Default is 1."
                  }
                },
                required: ["questionNumber", "subject", "questionText", "options", "marks", "negativeMarks"]
              }
            }
          },
          required: ["testTitle", "questions"]
        };
      }
    } else if (type === 'answers') {
      systemInstruction = "You are a professional exam answer key parser. Parse the provided text to extract the question numbers and their corresponding correct options (A, B, C, or D). The text may be in columns (e.g. 1. B, 2. A) or a table format.";
      
      responseSchema = {
        type: "object",
        properties: {
          answers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                questionNumber: {
                  type: "integer",
                  description: "The question number (e.g. 1, 2, etc.)"
                },
                correctOption: {
                  type: "string",
                  enum: ["A", "B", "C", "D"],
                  description: "The correct letter option (A, B, C, or D)"
                }
              },
              required: ["questionNumber", "correctOption"]
            }
          }
        },
        required: ["answers"]
      };
    } else {
      return NextResponse.json({ error: 'Invalid parsing type' }, { status: 400 });
    }


    // Call Gemini API using native fetch
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemInstruction}\n\nInput text to parse:\n${text}`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1, // Low temperature for factual parsing
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error details:", errorText);
      return NextResponse.json({ error: `Gemini API returned status ${response.status}: ${errorText}` }, { status: 500 });
    }

    const data = await response.json();
    const parsedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!parsedText) {
      console.error("Gemini Response structure:", JSON.stringify(data));
      return NextResponse.json({ error: 'Failed to extract parsed text from Gemini response' }, { status: 500 });
    }

    const parsedResult = JSON.parse(parsedText);
    return NextResponse.json(parsedResult);

  } catch (error: any) {
    console.error("Parse API Route Error:", error);
    return NextResponse.json({ error: error.message || 'Server processing error during parsing' }, { status: 500 });
  }
}
