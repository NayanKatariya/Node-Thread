const fs = require("fs");
const pdfParse = require("pdf-parse");
const { Configuration, OpenAIApi, default: OpenAI } = require("openai");
const fileContentModel = require("../model/fileContent.model");
require("dotenv").config();

// OpenAI setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory store
let vectorStore = []; // [{ chunk, embedding }]

const uploadPDF = async (req, res) => {
  try {
    const { asin } = req.body;
    const buffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(buffer);
    const text = data.text;

    vectorStore = []; // reset store

    await fileContentModel.findOneAndUpdate(
      { asin: asin },
      {
        text: text,
        file: req?.file?.filename,
        asin: asin,
      },
      {
        upsert: true,
      }
    );

    // fs.unlinkSync(req.file.path); // Cleanup
    res.json({
      message: "PDF uploaded and indexed successfully.",
      isSuccess: true,
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    res.status(500).json({
      error: error?.message,
      isSuccess: true,
      message: "Failed to process PDF.",
    });
  }
};

const askQuestion = async (req, res) => {
  const { question, asin } = req.body;

  try {
    const answer = await generateAnswerFromManual(question, asin, res);

    res.json({
      data: { role: "assistant", message: answer },
      isSuccess: true,
      message: "Answered successfully.",
    });
  } catch (error) {
    res.status(500).json({
      error: error?.message,
      isSuccess: false,
      message: "Failed to answer the question.",
    });
  }
};

const generateAnswerFromManual = async (question, asin, res) => {
  try {
    const vectorStore = await fileContentModel
      .findOne({ asin: asin })
      .sort({ createdAt: -1 }); // Fetch all stored vectors

    if (!vectorStore) {
      if (res) {
        res.status(400).json({
          error: error?.message,
          isSuccess: false,
          message: "No manual found",
        });
      }
      console.error("No manual found !");
      // throw new Error("No manual found !");
    }
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Answer the question using the context provided.",
        },
        {
          role: "user",
          content: `${vectorStore?.text}\n\nQuestion: ${question}`,
        },
      ],
    });

    const answer = response?.choices?.[0]?.message?.content;
    return answer;
  } catch (error) {
    console.error(" generateAnswerFromManual ~ error:", error);
    // throw new Error(error?.message);
  }
};
module.exports = { uploadPDF, askQuestion, generateAnswerFromManual };
