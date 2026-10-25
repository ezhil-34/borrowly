/**
 * Extract transparent keyword-based sentiment themes from reviews
 */
const THEMES = [
  ['Well maintained', 'pos', /clean|well maintained|good condition|like new|works? (great|perfectly)|mint/i],
  ['Easy pickup & return', 'pos', /easy (pick|return|hand)|smooth|on time|punctual|friendly|flexible/i],
  ['Good value', 'pos', /value|worth|affordable|cheap|saved/i],
  ['Description could be more accurate', 'neg', /not as described|different from|inaccurate|missing|description/i],
  ['Slow communication', 'neg', /slow (reply|response)|unresponsive|late reply/i],
  ['Wear or damage noted', 'neg', /scratch|damage|broken|dirty|worn/i]
];

function summarizeReviews(reviews, minReviews = 3) {
  if (!reviews || reviews.length < minReviews) return null;

  const themes = THEMES.map(([label, type, regex]) => {
    const matchingReviewIds = reviews
      .filter((r) => regex.test(r.text || ''))
      .map((r) => r.id);

    return {
      label,
      type,
      count: matchingReviewIds.length,
      reviewIds: matchingReviewIds
    };
  })
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    basedOn: reviews.length,
    themes
  };
}

module.exports = {
  summarizeReviews
};
