const Discussion = require("../models/discussionModel");
const { exec } = require("child_process");
const path = require("path");

// --- Internal Discussions (DB) ---

// Get all discussions
const getDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .populate("author", "name")
      .populate("replies.author", "name")
      .sort({ createdAt: -1 });
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Create a new discussion
const createDiscussion = async (req, res) => {
  try {
    const { propertyTitle, locality, rating, text } = req.body;

    const discussion = await Discussion.create({
      propertyTitle,
      locality,
      rating,
      text,
      author: req.user._id,
    });

    res.status(201).json(discussion);
  } catch (error) {
    res.status(400).json({ message: "Invalid data", error: error.message });
  }
};

// Add a reply
const addReply = async (req, res) => {
  try {
    const { text } = req.body;
    const discussion = await Discussion.findById(req.params.discussionId);

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    discussion.replies.push({
      author: req.user._id,
      text,
    });

    await discussion.save();
    res.json(discussion);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Like a discussion
const likeDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId);
    if (!discussion) return res.status(404).json({ message: "Discussion not found" });

    discussion.likes += 1;
    await discussion.save();
    res.json(discussion);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Like a reply
const likeReply = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId);
    if (!discussion) return res.status(404).json({ message: "Discussion not found" });

    const reply = discussion.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    reply.likes += 1;
    await discussion.save();
    res.json(discussion);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// --- External Discussions (Reddit Scraper) ---

const scrapeRedditDiscussions = (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: "Query parameter is required" });
  }

  const scriptPath = path.join(__dirname, "../../Scrapper/search_discussions.py");
  const command = `python3 "${scriptPath}" "${query}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error}`);
      // Don't fail hard, just return empty
      return res.json([]);
    }

    try {
      const results = JSON.parse(stdout);
      res.json(results);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      res.json([]);
    }
  });
};

// --- AI Generation ---

const { GoogleGenerativeAI } = require("@google/generative-ai");
const Property = require("../models/propertyModel");

const generateFakeDiscussion = async (req, res) => {
  try {
    // 1. Get a random property
    const count = await Property.countDocuments();
    const random = Math.floor(Math.random() * count);
    const property = await Property.findOne().skip(random);

    if (!property) {
      return res.status(404).json({ message: "No properties found to discuss" });
    }

    // 2. Generate content with Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Generate a realistic, casual, and detailed user review/discussion for a real estate property named "${property.title}" located in "${property.city}".
      
      The review should:
      - Be around 50-80 words.
      - Mention specific amenities or issues (e.g., "The gym is great but parking is a mess", "Security is tight", "Water quality is poor").
      - Have a sentiment (Positive, Negative, or Mixed).
      - Include a rating from 1 to 5.
      
      Output strictly in JSON format:
      {
        "text": "The review text...",
        "rating": 4
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean up markdown
    if (text.startsWith("```json")) text = text.slice(7);
    if (text.endsWith("```")) text = text.slice(0, -3);

    const data = JSON.parse(text);

    // 3. Create Discussion
    const discussion = await Discussion.create({
      propertyTitle: property.title,
      locality: property.address || property.city,
      rating: data.rating,
      text: data.text,
      author: req.user._id, // Assign to current user
    });

    res.status(201).json(discussion);

  } catch (error) {
    console.error("Error generating discussion:", error);
    res.status(500).json({ message: "Generation failed", error: error.message });
  }
};

module.exports = {
  getDiscussions,
  createDiscussion,
  addReply,
  likeDiscussion,
  likeReply,
  scrapeRedditDiscussions,
  generateFakeDiscussion,
};
