-- Run this script in the Supabase SQL Editor to add board and class fields to tests
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS exam_board text;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS target_class text;

-- Add question_type column to questions table to categorize question formats
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'MCQ';

-- Add text_response column to user_responses to store answers to subjective/objective questions
ALTER TABLE public.user_responses ADD COLUMN IF NOT EXISTS text_response text;
