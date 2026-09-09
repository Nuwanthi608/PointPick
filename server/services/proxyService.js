const axios = require('axios');
const cheerio = require('cheerio');

// Injector script එකේ absolute URL එක.
// <base> tag එක නිසා relative path එකක් දුන්නොත් target site
// එකෙන් හොයන්න යනවා - ඒ නිසා absolute URL එකක්ම ඕන.
const SERVER_URL = `http://localhost:${process.env.PORT || 5000}`;

/**
 * URL එකක් අරන් HTML එක fetch කරලා, iframe එකේ පෙන්නන්න
 * පුළුවන් විදියට rewrite කරලා දෙනවා.
 */
async function fetchAndRewrite(targetUrl) {
  // URL එක වලංගුද කියලා බලනවා
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are supported');
  }

  // HTML එක ගන්නවා. සැබෑ browser එකක් වගේ පෙනෙන්න
  // User-Agent එකක් යවනවා - නැත්නම් සමහර sites block කරනවා
  const response = await axios.get(targetUrl, {
    timeout: 15000,
    maxRedirects: 5,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  const $ = cheerio.load(response.data);
  const base = parsed.origin;

  // 1. Relative URLs → absolute
  //    "/css/main.css" → "https://site.com/css/main.css"
  //    නැත්නම් CSS, images load වෙන්නේ නෑ
  const urlAttributes = [
    ['link', 'href'],
    ['img', 'src'],
    ['source', 'src'],
    ['a', 'href'],
  ];

  urlAttributes.forEach(([tag, attr]) => {
    $(tag).each((_, el) => {
      const value = $(el).attr(attr);
      if (!value) return;
      if (value.startsWith('data:') || value.startsWith('#')) return;
      try {
        $(el).attr(attr, new URL(value, targetUrl).href);
      } catch {
        // වැඩක් නෑ, skip
      }
    });
  });

  // 2. Site එකේ scripts ඔක්කොම අයින් කරනවා
  //    ඒවා run වුණොත් අපේ selector එකට බාධා කරනවා,
  //    තව page එක navigate කරන්නත් පුළුවන්
  $('script').remove();
  $('noscript').remove();

  // 3. Links click කරද්දී navigate වෙන එක නවත්තනවා
  $('a').attr('href', 'javascript:void(0)');

  // 4. Forms submit වෙන එකත් නවත්තනවා
  $('form').removeAttr('action').attr('onsubmit', 'return false');

  // 5. <base> tag එකක් දානවා - ඉතුරු relative paths වලට
  if ($('base').length === 0) {
    $('head').prepend(`<base href="${base}">`);
  }

  // 6. අන්තිමට අපේ selector script එක inject කරනවා.
  //    මේක scripts remove කරාට පස්සේ දාන්න ඕන - නැත්නම්
  //    අපේ එකත් අයින් වෙනවා.
  $('body').append(`<script src="${SERVER_URL}/injector.js"></script>`);

  return $.html();
}

module.exports = { fetchAndRewrite }; 