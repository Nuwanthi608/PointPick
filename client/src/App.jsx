import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('https://books.toscrape.com');
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectors, setSelectors] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type !== 'PP_ELEMENT_SELECTED') return;

      setSelectors((prev) => {
        // එකම selector එක දෙපාරක් add වෙන එක වළක්වනවා
        if (prev.some((s) => s.selector === event.data.selector)) {
          return prev;
        }
        return [
          ...prev,
          {
            id: Date.now(),
            name: `field_${prev.length + 1}`,
            selector: event.data.selector,
            sample: event.data.text,
            matchCount: event.data.matchCount,
          },
        ];
      });
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function loadPreview() {
    if (!url.trim()) return;
    setPreviewUrl(`/api/proxy?url=${encodeURIComponent(url)}`);
    setSelectors([]);
    setResults(null);
  }

  function removeSelector(id) {
    setSelectors((prev) => prev.filter((s) => s.id !== id));
  }

  function renameSelector(id, name) {
    setSelectors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  }

  async function runExtraction() {
    if (selectors.length === 0) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          fields: selectors.map((s) => ({
            name: s.name,
            selector: s.selector,
          })),
        }),
      });
      const json = await res.json();
      if (json.error) {
        alert('Error: ' + json.error);
      } else {
        setResults(json);
      }
    } catch (err) {
      alert('Extraction failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>PointPick</h1>
        <div className="url-bar">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
          <button onClick={loadPreview}>Load</button>
        </div>
      </header>

      <div className="workspace">
        <div className="preview">
          {previewUrl ? (
            <iframe src={previewUrl} title="preview" />
          ) : (
            <div className="empty">URL එකක් දාලා Load කරන්න</div>
          )}
        </div>

        <aside className="panel">
          <h2>Selected Fields ({selectors.length})</h2>
          {selectors.length === 0 && (
            <p className="hint">Preview එකේ element එකක් click කරන්න</p>
          )}

          {selectors.map((s) => (
            <div key={s.id} className="field">
              <input
                value={s.name}
                onChange={(e) => renameSelector(s.id, e.target.value)}
              />
              <code>{s.selector}</code>
              <small>
                {s.matchCount} matches — "{s.sample}"
              </small>
              <button onClick={() => removeSelector(s.id)}>Remove</button>
            </div>
          ))}

          {selectors.length > 0 && (
            <button
              className="extract-btn"
              onClick={runExtraction}
              disabled={loading}
            >
              {loading ? 'Extracting...' : 'Extract Data'}
            </button>
          )}

          {results && (
            <div className="results">
              <h3>{results.rowCount} rows</h3>
              <pre>{JSON.stringify(results.data.slice(0, 5), null, 2)}</pre>
              {results.rowCount > 5 && (
                <small>...තව {results.rowCount - 5}ක්</small>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;