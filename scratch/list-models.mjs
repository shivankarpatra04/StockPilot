import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
  const genAI = new GoogleGenerativeAI("AIzaSyBOuBBKdqMcJ-EfQlP1zGbhX_vr9_4W7Ls");
  try {
    const result = await genAI.listModels();
    console.log("Models:");
    result.models.forEach(m => console.log(m.name));
  } catch (e) {
    console.error(e);
  }
}
listModels();
