import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize APIs (Fallback if no key is provided yet, to allow the UI to compile without crashing)
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Next.js config parameter
export const maxDuration = 300; 

export async function POST(request) {
  try {
    const { image, keywords } = await request.json();
    
    if (!genAI) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY in .env.local" }, { status: 500 });
    }

    // Strip the data:image/xyz;base64, part
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: "You are an expert Animal Crossing: New Horizons island designer. You MUST conclude every response with the exact string '---PROMPT---' on its own line, followed by a 2-3 sentence visual description of the final island space."
    });

    const joinedKeywords = keywords.length > 0 ? keywords.join(', ') : 'no specific keywords';
    
    const promptText = `
      You are an expert Animal Crossing: New Horizons island designer. 
      Analyze this upload of an island space. 
      
      1. Identify the items already present (if any) and the layout context.
      2. Recommend 5-10 specific items from Nookipedia (Animal Crossing items) that match the vibe: ${joinedKeywords}.
      3. Give placement advice on how to arrange them.
      
      IMPORTANT: End your response with a section marked "---PROMPT---". Underneath it, write an extremely detailed, 2-3 sentence visual prompt describing what this final space will look like as a beautiful 3D image in an Animal Crossing core aesthetic.
    `;

    const result = await model.generateContent([
      promptText,
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      }
    ]);

    const targetResponse = await result.response;
    const textOutput = targetResponse.text();

    // Parse the image prompt out of the text output
    let userVisibleText = textOutput;
    let imagePrompt = "A beautiful Animal Crossing new horizons styled island space.";
    
    if (textOutput.includes("---PROMPT---")) {
      const parts = textOutput.split("---PROMPT---");
      userVisibleText = parts[0].trim();
      imagePrompt = parts[1].trim() + " Rendered in cozy, miniature 3D diorama style, cute, nintendo animal crossing aesthetics, highly detailed lighting.";
    } else if (textOutput.includes("--- PROMPT ---")) {
      const parts = textOutput.split("--- PROMPT ---");
      userVisibleText = parts[0].trim();
      imagePrompt = parts[1].trim() + " Rendered in cozy, miniature 3D diorama style, cute, nintendo animal crossing aesthetics, highly detailed lighting.";
    }

    let finalImageUrl = "";
    
    try {
      const imageModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
      const imageResult = await imageModel.generateContent(imagePrompt);
      const imageResponse = await imageResult.response;
      
      const candidate = imageResponse.candidates[0];
      const part = candidate.content.parts[0];
      
      let base64String = "";
      let extension = "jpeg";
      
      if (part.inlineData) {
        base64String = part.inlineData.data;
        if (part.inlineData.mimeType) {
          extension = part.inlineData.mimeType.split('/')[1] || 'jpeg';
        }
      } else if (part.text) {
        base64String = part.text;
      } else {
        throw new Error("Could not parse image response");
      }

      const imageBuffer = Buffer.from(base64String, 'base64');
      const fs = require('fs/promises');
      const path = require('path');
      
      const publicDir = path.join(process.cwd(), 'public');
      // Ensure the public directory exists (Next.js usually has it, but just in case)
      await fs.mkdir(publicDir, { recursive: true });
      
      const fileName = `generated-${Date.now()}.${extension}`;
      const filePath = path.join(publicDir, fileName);
      
      await fs.writeFile(filePath, imageBuffer);
      
      finalImageUrl = `/${fileName}`;
      
    } catch (e) {
      console.error("Gemini Image Error:", e);
      finalImageUrl = "https://placehold.co/1024x1024/E8F5E9/4CAF50?text=" + encodeURIComponent(e.message || "Error");
    }

    return NextResponse.json({ 
      text: userVisibleText,
      imageUrl: finalImageUrl 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
