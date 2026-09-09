(function () {
  let lastHighlighted = null;

  // Element එකකට CSS selector එකක් හදනවා
  // උදා: "div.product > h3 > a"
  function buildSelector(el) {
    if (!el || el.nodeType !== 1) return '';

    const path = [];
    let current = el;

    while (current && current.nodeType === 1 && current !== document.body) {
      let part = current.tagName.toLowerCase();

      // ID එකක් තියෙනවා නම් ඒක unique - එතනින් නවත්තන්න පුළුවන්
      if (current.id) {
        path.unshift('#' + current.id);
        break;
      }

      // Classes තියෙනවා නම් දාගන්නවා
      const classes = Array.from(current.classList)
        .filter((c) => !c.startsWith('pp-'))  // අපේ classes අයින්
        .slice(0, 2);

      if (classes.length) {
        part += '.' + classes.join('.');
      }

      path.unshift(part);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  // Hover වෙද්දී outline එකක්
  document.addEventListener('mouseover', function (e) {
    if (lastHighlighted) {
      lastHighlighted.style.outline = '';
    }
    e.target.style.outline = '2px solid #4f46e5';
    lastHighlighted = e.target;
  });

  // Click කරද්දී selector එක parent window එකට යවනවා
  document.addEventListener(
    'click',
    function (e) {
      e.preventDefault();
      e.stopPropagation();

      const selector = buildSelector(e.target);
      const matchCount = document.querySelectorAll(selector).length;

      window.parent.postMessage(
        {
          type: 'PP_ELEMENT_SELECTED',
          selector: selector,
          text: (e.target.innerText || '').trim().slice(0, 100),
          tag: e.target.tagName.toLowerCase(),
          matchCount: matchCount,
        },
        '*'
      );
    },
    true  // capture phase - site එකේ handlers වලට කලින්
  );

  console.log('[PointPick] injector ready');
})();