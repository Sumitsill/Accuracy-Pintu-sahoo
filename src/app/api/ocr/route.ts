import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    
    // Run OCR using Tesseract on the server side
    const result = await Tesseract.recognize(imageBase64, 'eng', {
      logger: m => console.log(m)
    });
    
    const text = result.data.text;
    
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("OCR Error:", error);
    return NextResponse.json({ error: error.message || 'OCR Processing failed' }, { status: 500 });
  }
}
