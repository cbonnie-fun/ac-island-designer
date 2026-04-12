import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const imageModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
    const imageResult = await imageModel.generateContent("A cute Animal Crossing beach.");
    const imageResponse = await imageResult.response;
    
    console.log("Response fields:", Object.keys(imageResponse));
    
    const candidate = imageResponse.candidates[0];
    const part = candidate.content.parts[0];
    
    if (part.inlineData) {
      console.log("Got inlineData!");
      await fs.writeFile("test-output.jpeg", Buffer.from(part.inlineData.data, 'base64'));
      console.log("Saved test-output.jpeg");
    } else if (part.text) {
      console.log("Got text part! Length:", part.text.length);
    } else {
      console.log("Unknown part:", part);
    }
  } catch(e) {
    console.error("FAILED:", e);
  }
}

test();
