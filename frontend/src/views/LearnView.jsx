/**
 * LearnView - Learning modules view
 * 
 * Displays structured lessons about Ethereum concepts
 */

import { LESSONS, getLessonContent } from '../constants/content';

export function LearnView({ onBack, onNext }) {
  return (
    <div className="learn-view">
      <h2>📚 Forensics Fundamentals</h2>
      <p className="section-subtitle">
        Understand the building blocks of blockchain forensics before diving into investigations.
      </p>
      
      <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem'}}>
        {LESSONS.map(lesson => {
          const content = getLessonContent(lesson.contentType);
          if (!content) return null;
          
          return (
            <div 
              key={lesson.id}
              style={{
                background: '#1e293b',
                border: '2px solid #334155',
                borderRadius: '1rem',
                padding: '2rem'
              }}
            >
              <h3 style={{color: '#93c5fd', marginTop: 0}}>{lesson.title}</h3>
              
              <div className="lesson-slide">
                <h4 style={{color: '#f8fafc'}}>{content.title}</h4>
                <p style={{color: '#cbd5e1', fontSize: '1.05rem'}}>{content.description}</p>
                
                {content.points && (
                  <ul style={{color: '#e2e8f0'}}>
                    {content.points.map((point, idx) => (
                      <li key={idx}>
                        <strong>{point.label}:</strong> {point.text}
                      </li>
                    ))}
                  </ul>
                )}
                
                {content.concepts && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
                    {content.concepts.map((concept, idx) => (
                      <div key={idx} className="concept-box">
                        <p>
                          {concept.icon} <strong>{concept.label}:</strong> {concept.text}
                        </p>
                        {concept.example && (
                          <p style={{fontFamily: 'monospace', color: '#94a3b8'}}>{concept.example}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {content.note && (
                  <p style={{color: '#cbd5e1', marginTop: '1rem'}}>{content.note}</p>
                )}
                
                {content.methods && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem'}}>
                    {content.methods.map((method, idx) => (
                      <div 
                        key={idx}
                        className="concept-box"
                        style={{
                          marginTop: 0,
                          background: method.style === 'highlight' ? '#e6f7ed' : undefined
                        }}
                      >
                        <h4 style={{color: '#1e293b'}}>
                          {method.icon} {method.name} - {method.subtitle}
                        </h4>
                        <ul style={{color: '#334155'}}>
                          {method.points.map((point, pIdx) => (
                            <li key={pIdx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="concept-actions" style={{marginTop: '2rem'}}>
        <button onClick={onBack}>← Back to Investigations</button>
        <button className="primary-btn" onClick={onNext}>
          Continue to Practice →
        </button>
      </div>
    </div>
  );
}

export default LearnView;

