const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure GEMINI_API_KEY is loaded in environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a vector embedding for a given text using Gemini's text-embedding-004 model.
 * @param {string} text The text to embed.
 * @returns {Promise<number[]>} An array of numbers representing the vector, or empty array on failure.
 */
async function generateEmbedding(text) {
  if (!text || text.trim() === '') return [];
  
  try {
    // Output dimensions: 768
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" }); 
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error.message);
    return [];
  }
}

module.exports = { generateEmbedding };
