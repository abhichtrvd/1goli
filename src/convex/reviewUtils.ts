// Review utility functions for spam detection, sentiment analysis, and duplicate detection

interface SpamResult {
  score: number;
  flags: string[];
}

interface SentimentResult {
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
}

/**
 * Detect spam in review text
 * Returns a score from 0-100 (higher = more suspicious) and list of flags
 */
export function detectSpam(text: string): SpamResult {
  let score = 0;
  const flags: string[] = [];

  if (!text || text.trim().length === 0) {
    return { score: 0, flags: [] };
  }

  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/);

  // Check for excessive caps (more than 50% uppercase)
  const upperCaseCount = (text.match(/[A-Z]/g) || []).length;
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 10 && upperCaseCount / letterCount > 0.5) {
    score += 25;
    flags.push("excessive_caps");
  }

  // Check for repeated words (same word used more than 5 times)
  const wordFrequency: Record<string, number> = {};
  words.forEach((word) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanWord.length > 3) {
      wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
    }
  });

  const maxFrequency = Math.max(...Object.values(wordFrequency), 0);
  if (maxFrequency > 5) {
    score += 20;
    flags.push("repeated_words");
  }

  // Check for URLs/links
  const urlRegex = /(https?:\/\/|www\.|\.com|\.net|\.org)/gi;
  if (urlRegex.test(text)) {
    score += 30;
    flags.push("contains_links");
  }

  // Check for email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailRegex.test(text)) {
    score += 25;
    flags.push("contains_email");
  }

  // Check for phone numbers
  const phoneRegex = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/g;
  if (phoneRegex.test(text)) {
    score += 20;
    flags.push("contains_phone");
  }

  // Check for very short reviews (less than 10 characters)
  if (text.trim().length < 10) {
    score += 15;
    flags.push("too_short");
  }

  // Check for excessive exclamation marks
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 5) {
    score += 10;
    flags.push("excessive_exclamation");
  }

  // Check for common spam phrases
  const spamPhrases = [
    "click here",
    "buy now",
    "limited offer",
    "act now",
    "free money",
    "earn cash",
    "work from home",
    "make money",
    "discount code",
    "promo code",
  ];

  for (const phrase of spamPhrases) {
    if (lowerText.includes(phrase)) {
      score += 15;
      flags.push("spam_phrase");
      break;
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return { score, flags };
}

/**
 * Analyze sentiment of review text
 * Returns sentiment classification and confidence score
 */
export function analyzeSentiment(
  text: string,
  rating: number
): SentimentResult {
  if (!text || text.trim().length === 0) {
    // Fallback to rating-based sentiment
    if (rating >= 4) return { sentiment: "positive", confidence: 0.7 };
    if (rating <= 2) return { sentiment: "negative", confidence: 0.7 };
    return { sentiment: "neutral", confidence: 0.5 };
  }

  const lowerText = text.toLowerCase();

  // Positive keywords
  const positiveWords = [
    "excellent",
    "amazing",
    "great",
    "wonderful",
    "fantastic",
    "love",
    "perfect",
    "best",
    "awesome",
    "good",
    "impressed",
    "satisfied",
    "recommend",
    "quality",
    "helpful",
    "effective",
    "works",
    "beautiful",
    "nice",
    "happy",
    "pleased",
    "glad",
    "superb",
    "outstanding",
    "brilliant",
  ];

  // Negative keywords
  const negativeWords = [
    "terrible",
    "awful",
    "bad",
    "horrible",
    "worst",
    "hate",
    "poor",
    "disappointing",
    "useless",
    "waste",
    "refund",
    "broken",
    "defective",
    "failed",
    "doesn't work",
    "not working",
    "problem",
    "issue",
    "unhappy",
    "dissatisfied",
    "regret",
    "avoid",
    "never",
    "garbage",
    "junk",
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  // Count positive words
  positiveWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });

  // Count negative words
  negativeWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });

  // Check for negations (not, never, don't, etc.)
  const negationRegex = /\b(not|never|no|don't|doesn't|didn't|won't|can't|couldn't|shouldn't)\b/gi;
  const hasNegation = negationRegex.test(lowerText);

  // Calculate sentiment score
  const sentimentScore = positiveCount - negativeCount;

  // Factor in rating
  const ratingWeight = 0.4;
  const textWeight = 0.6;
  let finalScore = sentimentScore * textWeight + (rating - 3) * ratingWeight;

  // Adjust for negations
  if (hasNegation && positiveCount > negativeCount) {
    finalScore -= 1;
  }

  // Determine sentiment
  let sentiment: "positive" | "neutral" | "negative";
  if (finalScore > 0.5) {
    sentiment = "positive";
  } else if (finalScore < -0.5) {
    sentiment = "negative";
  } else {
    sentiment = "neutral";
  }

  // Calculate confidence (0-1)
  const totalWords = positiveCount + negativeCount;
  const confidence = Math.min(totalWords / 5, 1) * 0.8 + 0.2;

  return { sentiment, confidence };
}

/**
 * Calculate similarity between two text strings (0-100)
 * Uses simple word overlap metric
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  // Normalize texts
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3); // Ignore short words

  const words1 = normalize(text1);
  const words2 = normalize(text2);

  if (words1.length === 0 || words2.length === 0) return 0;

  // Calculate word overlap
  const set1 = new Set(words1);
  const set2 = new Set(words2);

  let overlapCount = 0;
  set1.forEach((word) => {
    if (set2.has(word)) overlapCount++;
  });

  // Jaccard similarity
  const unionSize = set1.size + set2.size - overlapCount;
  const similarity = (overlapCount / unionSize) * 100;

  return Math.round(similarity);
}

/**
 * Check if a review is a potential duplicate
 * Compares with other reviews from the same user
 */
export function checkDuplicate(
  newReview: { userId: string; comment: string; title?: string },
  existingReviews: Array<{ userId: string; comment?: string; title?: string }>
): { isDuplicate: boolean; similarityScore: number; duplicateOf?: string } {
  const userReviews = existingReviews.filter(
    (r) => r.userId === newReview.userId
  );

  if (userReviews.length === 0) {
    return { isDuplicate: false, similarityScore: 0 };
  }

  let maxSimilarity = 0;
  let duplicateReview = null;

  const newText = `${newReview.title || ""} ${newReview.comment || ""}`.trim();

  for (const review of userReviews) {
    const existingText =
      `${review.title || ""} ${review.comment || ""}`.trim();
    const similarity = calculateTextSimilarity(newText, existingText);

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      duplicateReview = review;
    }
  }

  // Consider it a duplicate if similarity is > 70%
  const isDuplicate = maxSimilarity > 70;

  return {
    isDuplicate,
    similarityScore: maxSimilarity,
    duplicateOf: duplicateReview ? (duplicateReview as any)._id : undefined,
  };
}

/**
 * Validate review for purchase verification
 * In a real app, this would check against order history
 */
export function verifyPurchase(
  userId: string,
  productId: string,
  orders: Array<{ userId: string; items: Array<{ productId: string }> }>
): boolean {
  return orders.some(
    (order) =>
      order.userId === userId &&
      order.items.some((item) => item.productId === productId)
  );
}
