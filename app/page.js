"use client";
import { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [image, setImage] = useState(null);
  const [keywordsInput, setKeywordsInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [resultImage, setResultImage] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const generateDesign = async () => {
    if (!image) return;
    setLoading(true);
    setResultText('');
    setResultImage('');

    try {
      const response = await fetch('/api/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: image,
          keywords: keywordsInput.split(',').map(k => k.trim()).filter(k => k !== '').slice(0, 3)
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setResultText(data.text);
      setResultImage(data.imageUrl);
    } catch (err) {
      console.error(err);
      setResultText("An error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>ACNH island design generator</h1>
        <p className={styles.subtitle}>Upload a photo of an area on your island and get suggested layouts and items!</p>
      </header>

      <div className={styles.formGrid}>
        <div className={styles.uploadSection}>
          <label className={styles.dropzone}>
            {image ? (
              <img src={image} alt="Preview" className={styles.previewImage} />
            ) : (
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--acnh-leaf-dark)', marginBottom: '1rem' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>Click to upload a photo</span>
              </span>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          </label>
        </div>

        <div className={styles.keywordSection}>
          <div className={styles.keywordRow}>
            <label>Keywords (up to 3, comma separated)</label>
            <input type="text" className={styles.inputField} placeholder='e.g., "starry, cottagecore, pink"' value={keywordsInput} onChange={e => setKeywordsInput(e.target.value)} />
          </div>

          <button
            className={styles.submitBtn}
            onClick={generateDesign}
            disabled={!image || loading}
          >
            {loading ? "Designing..." : "Generate ideas"}
          </button>
        </div>
      </div>

      {(loading || resultText || resultImage) && (
        <section className={styles.resultsSection}>
          <h2 className={styles.resultsTitle}>Generated design</h2>

          {loading && (
            <div className={styles.loading}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Consulting with Tom Nook...
            </div>
          )}

          {!loading && resultImage && (
            <div className={styles.imageResult}>
              <img src={resultImage} alt="Generated island area design" />
            </div>
          )}

          {!loading && resultText && (
            <div className={styles.textContent}>
              {resultText}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
