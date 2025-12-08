/**
 * ConceptsView - Core concepts/basics view
 * 
 * Displays the fundamental Ethereum concepts using card layout
 */

import { CONCEPT_CARDS } from '../constants/content';

export function ConceptsView({ onBack, onNext }) {
  return (
    <div className="concepts-view">
      <h2>🔍 Core Concepts</h2>
      <p className="section-subtitle">Skim each card and hover to expand the mental models you'll need later.</p>
      <div className="concepts-grid">
        {CONCEPT_CARDS.map(card => (
          <div 
            className="concept-card" 
            key={card.title}
            style={card.fullWidth ? {gridColumn: '1 / -1'} : {}}
          >
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <ul>
              {card.highlight.map(point => <li key={point}>{point}</li>)}
            </ul>
            {card.diagram && (
              <div style={{marginTop: '1.5rem', padding: '1.5rem', background: 'white', borderRadius: '0.75rem', border: '2px solid #e2e8f0'}}>
                <h4 style={{marginTop: 0, marginBottom: '1rem', color: '#1e293b', textAlign: 'center', fontSize: '1.3rem'}}>
                  📊 The Validation Cycle
                </h4>
                <div style={{maxWidth: '900px', margin: '0 auto'}}>
                  <img 
                    src="/pos-diagram.svg" 
                    alt="Proof of Stake Validation Flow" 
                    style={{width: '100%', display: 'block', height: 'auto'}}
                  />
                </div>
                <div style={{marginTop: '1.5rem', padding: '1rem', background: '#f1f5f9', borderRadius: '0.5rem', maxWidth: '900px', margin: '1.5rem auto 0'}}>
                  <p style={{margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: '1.7'}}>
                    <strong style={{color: '#1e293b', display: 'block', marginBottom: '0.5rem'}}>How it works:</strong>
                    <span style={{color: '#1e293b'}}>①</span> Validator stakes ETH → 
                    <span style={{color: '#1e293b'}}> ②</span> Algorithm selects validator → 
                    <span style={{color: '#1e293b'}}> ③</span> Selected validator proposes block → 
                    <span style={{color: '#1e293b'}}> ④</span> Others verify → 
                    <span style={{color: '#1e293b'}}> ⑤</span> Block added to chain → 
                    <span style={{color: '#1e293b'}}> ⑥</span> Validator earns rewards
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="concept-actions">
        <button onClick={onBack}>← Back to Orientation</button>
        <button className="primary-btn" onClick={onNext}>I'm ready to explore →</button>
      </div>
    </div>
  );
}

export default ConceptsView;

