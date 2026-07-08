-- Run this script in the Supabase SQL Editor to add board and class fields to tests
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS exam_board text;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS target_class text;

-- Add question_type column to questions table to categorize question formats
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'MCQ';

-- Add text_response column to user_responses to store answers to subjective/objective questions
ALTER TABLE public.user_responses ADD COLUMN IF NOT EXISTS text_response text;

-- Add answer_sheet_url and is_graded columns to test_results table to support PDF answer sheets and manual grading
ALTER TABLE public.test_results ADD COLUMN IF NOT EXISTS answer_sheet_url text;
ALTER TABLE public.test_results ADD COLUMN IF NOT EXISTS is_graded boolean DEFAULT true;

-- Update all existing questions with 'Other' subject to 'Physics'
UPDATE public.questions SET subject = 'Physics' WHERE subject = 'Other';
