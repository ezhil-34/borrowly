/**
 * Client for communicating with the Python ML & MLOps Microservice
 * Supports both HTTP (local Docker) and HTTPS (Azure App Service)
 */
const http = require('http');
const https = require('https');

const rawHost = process.env.ML_SERVICE_HOST || '127.0.0.1';
const isHttps = rawHost.startsWith('https://') || process.env.ML_SERVICE_PROTOCOL === 'https' || rawHost.includes('.onrender.com');
const ML_SERVICE_HOST = rawHost.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const ML_SERVICE_PORT = Number(process.env.ML_SERVICE_PORT || (isHttps ? 443 : 8000));
const transport = isHttps ? https : http;
const effectivePort = ML_SERVICE_PORT;

function postJson(path, payload, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = transport.request(
      {
        hostname: ML_SERVICE_HOST,
        port: effectivePort,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: timeoutMs
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`ML service responded with status ${res.statusCode}: ${body}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ML service request timed out'));
    });
    req.write(postData);
    req.end();
  });
}

function getJson(path, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        hostname: ML_SERVICE_HOST,
        port: effectivePort,
        path,
        method: 'GET',
        timeout: timeoutMs
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`ML service responded with status ${res.statusCode}: ${body}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ML service request timed out'));
    });
    req.end();
  });
}

/**
 * Intelligent fallback heuristic when Python microservice is cold-starting
 */
function calculateHeuristicPrice(listingData) {
  const category = (listingData.category || '').toLowerCase();
  const title = (listingData.title || '').toLowerCase();
  const brand = (listingData.brand || '').toLowerCase();
  const condition = (listingData.condition || '').toLowerCase();
  const area = (listingData.area || '').toLowerCase();
  const combined = `${category} ${title}`;

  // 1. Base category pricing
  let base = 300;
  if (/camera|dslr|lens|photo|tripod|canon|nikon|sony alpha/.test(combined)) {
    base = 650;
  } else if (/projector|screen|display|theater|monitor/.test(combined)) {
    base = 550;
  } else if (/game|gaming|playstation|xbox|ps5|ps4|console/.test(combined)) {
    base = 450;
  } else if (/speaker|audio|mic|music|sound|guitar|amplifier/.test(combined)) {
    base = 380;
  } else if (/tent|camp|trek|travel|backpack|sleeping/.test(combined)) {
    base = 350;
  } else if (/bike|cycle|bicycle|racket|sport|badminton|fitness/.test(combined)) {
    base = 240;
  } else if (/drill|tool|saw|hammer|washer|cleaner|diy/.test(combined)) {
    base = 220;
  } else if (/party|event|celebration|light/.test(combined)) {
    base = 550;
  } else if (category.includes('electronics')) {
    base = 480;
  } else if (category.includes('kitchen') || category.includes('home')) {
    base = 200;
  } else if (category.includes('book')) {
    base = 90;
  }

  // 2. Brand factor
  let brandFactor = 1.0;
  if (/sony|apple|canon|nikon|bosch|dji|gopro|bose|jbl|fuji|yamaha|sennheiser/.test(brand)) {
    brandFactor = 1.25;
  } else if (/dewalt|giant|epson|quechua|yonex|karcher|decathlon|samsung|philips/.test(brand)) {
    brandFactor = 1.05;
  } else if (/generic|local|unbranded|ambrane/.test(brand) || !brand) {
    brandFactor = 0.88;
  }

  // 3. Condition factor
  let condFactor = 1.0;
  if (condition.includes('like') || condition.includes('mint')) {
    condFactor = 1.15;
  } else if (condition.includes('new')) {
    condFactor = 1.25;
  } else if (condition.includes('fair') || condition.includes('worn')) {
    condFactor = 0.80;
  } else {
    condFactor = 0.95;
  }

  // 4. Area factor
  let areaFactor = 1.0;
  if (/t nagar|anna nagar|adyar/.test(area)) {
    areaFactor = 1.05;
  } else if (/tambaram/.test(area)) {
    areaFactor = 0.92;
  }

  const suggested = Math.round(base * brandFactor * condFactor * areaFactor);
  return {
    suggested_price: suggested,
    price_low: Math.round(suggested * 0.85),
    price_high: Math.round(suggested * 1.20),
    comparable_median: base,
    model_confidence: 'Heuristic Market Signal (Microservice standby)',
    model_version: 'v1-MarketRuleEngine'
  };
}

/**
 * Predict optimal rental price with confidence intervals using HistGradientBoosting
 */
async function predictPricing(listingData) {
  try {
    return await postJson('/predict/pricing', listingData);
  } catch (err) {
    // Dynamic fallback heuristic based on category, brand, condition and area
    return calculateHeuristicPrice(listingData);
  }
}

/**
 * Rank candidate items with the 2-stage ML funnel model
 */
async function predictRecommendations(userId, candidates) {
  try {
    return await postJson('/predict/recommend', {
      user_id: userId || 'anonymous',
      candidates: candidates.map((c) => ({
        id: c.id,
        category: c.category,
        area: c.area,
        price: c.price,
        distance_km: c.distanceKm || 3.0,
        is_available: c.available ? 1 : 0
      }))
    });
  } catch (err) {
    return null;
  }
}

/**
 * Get MLOps statistics & system telemetry
 */
async function getMLOpsStats() {
  try {
    return await getJson('/mlops/stats');
  } catch (err) {
    return {
      service: 'Borrowly MLOps Monitoring Dashboard',
      status: 'offline',
      error: err.message
    };
  }
}

module.exports = {
  predictPricing,
  predictRecommendations,
  getMLOpsStats
};
