const express = require("express");
const { scrapeProperties, scrapeUrl } = require('../controllers/scrapeController');
const { scrapeRedditDiscussions } = require('../controllers/discussionController');
const router = express.Router();

router.post('/', scrapeProperties);
router.post('/url', scrapeUrl);
router.get('/discussions', scrapeRedditDiscussions);

module.exports = router;
