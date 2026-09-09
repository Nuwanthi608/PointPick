const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Selectors ටිකක් අරන් page එකෙන් data extract කරනවා.
 * fields: [{ name: 'title', selector: 'article.product_pod h3 a' }]
 */
async function extractData(targetUrl, fields) {
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error('At least one field is required');
  }

  const response = await axios.get(targetUrl, {
    timeout: 15000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  const $ = cheerio.load(response.data);

  // හැම field එකකටම matches ටික ගන්නවා
  const columns = fields.map((field) => {
    const values = [];
    $(field.selector).each((_, el) => {
      values.push(extractValue($, el));
    });
    return { name: field.name, values };
  });

  // වැඩිම matches ගාන = row count එක
  const rowCount = Math.max(...columns.map((c) => c.values.length), 0);

  // Columns → rows
  const rows = [];
  for (let i = 0; i < rowCount; i++) {
    const row = {};
    columns.forEach((col) => {
      row[col.name] = col.values[i] ?? null;
    });
    rows.push(row);
  }

  return {
    url: targetUrl,
    rowCount: rows.length,
    scrapedAt: new Date().toISOString(),
    data: rows,
  };
}

// Image නම් src, link නම් text, අනිත් ඒවා text
function extractValue($, el) {
  const tag = el.tagName?.toLowerCase();
  if (tag === 'img') return $(el).attr('src') || '';
  if (tag === 'a') {
    return $(el).text().trim() || $(el).attr('href') || '';
  }
  return $(el).text().trim().replace(/\s+/g, ' ');
}

module.exports = { extractData };