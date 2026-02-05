/**
 * ExploreView - Deep dive exploration view
 * 
 * Provides interactive missions for exploring advanced Ethereum concepts
 */

import { useState } from 'react';
import { 
  BlockchainVisualizer, 
  AddressDecoder, 
  StakingRewards, 
  ValidatorProbability, 
  SlashingPenalty, 
  AttackCost 
} from '../components/mini-labs';

export function ExploreView({ missions, exploreProgress, setExploreProgress, onBack, onContinue }) {
  const [expandedMission, setExpandedMission] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});

  const toggleMission = (idx) => {
    setExpandedMission(expandedMission === idx ? null : idx);
  };

  const handleQuizAnswer = (missionIdx, answerIdx) => {
    const mission = missions[missionIdx];
    if (!mission.quiz) return;
    
    const isCorrect = answerIdx === mission.quiz.correct;
    setQuizAnswers({ ...quizAnswers, [missionIdx]: { selected: answerIdx, correct: isCorrect } });
    
    if (isCorrect) {
      const next = [...exploreProgress];
      next[missionIdx] = true;
      setExploreProgress(next);
    }
  };

  const completedCount = exploreProgress.filter(Boolean).length;
  const totalCount = missions.length;

  const renderMiniLab = (miniLabType) => {
    switch (miniLabType) {
      case 'blockchain-visualizer': return <BlockchainVisualizer />;
      case 'address-decoder': return <AddressDecoder />;
      case 'staking-rewards': return <StakingRewards />;
      case 'validator-probability': return <ValidatorProbability />;
      case 'slashing-penalty': return <SlashingPenalty />;
      case 'attack-cost': return <AttackCost />;
      default: return null;
    }
  };

  return (
    <div className="explore-view">
      <div className="explore-header">
        <h2>🔍 Blockchain Forensics Lab</h2>
        <p style={{fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '1rem'}}>
          Learn to analyze addresses, trace transactions, and follow the money on the blockchain
        </p>
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
          padding: '1rem',
          borderRadius: '0.75rem',
          marginTop: '1rem'
        }}>
          <strong style={{fontSize: '1.2rem'}}>Progress: {completedCount}/{totalCount} investigations completed</strong>
        </div>
        <div style={{
          background: 'rgba(251, 191, 36, 0.15)',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          padding: '1rem',
          borderRadius: '0.75rem',
          marginTop: '1rem',
          fontSize: '0.95rem'
        }}>
          <strong style={{color: '#fbbf24'}}>💡 Tip:</strong> Use the <strong>CLI Labs</strong> tab to open the Playground and run these commands. 
          Store variables with <code style={{background: '#1e293b', padding: '2px 6px', borderRadius: '4px'}}>ctx.varName = value</code>
        </div>
      </div>

      <div style={{marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
        {missions.map((mission, idx) => {
          const isExpanded = expandedMission === idx;
          const isCompleted = exploreProgress[idx];
          const quizState = quizAnswers[idx];

          return (
            <div 
              key={idx}
              style={{
                background: isCompleted ? 'rgba(34,197,94,0.1)' : '#1e293b',
                border: `2px solid ${isCompleted ? '#22c55e' : '#334155'}`,
                borderRadius: '1rem',
                overflow: 'hidden',
                transition: 'all 0.3s'
              }}
            >
              {/* Mission Header */}
              <div 
                onClick={() => toggleMission(idx)}
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isExpanded ? 'rgba(0,0,0,0.2)' : 'transparent'
                }}
              >
                <div style={{flex: 1}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem'}}>
                    <span style={{
                      background: isCompleted ? '#22c55e' : '#64748b',
                      color: 'white',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {isCompleted ? '✓' : idx + 1}
                    </span>
                    <h3 style={{margin: 0, fontSize: '1.3rem', color: '#f8fafc'}}>{mission.title}</h3>
                  </div>
                  {mission.category && (
                    <span style={{
                      fontSize: '0.75rem',
                      background: '#3b82f6',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      marginLeft: '48px'
                    }}>
                      {mission.category}
                    </span>
                  )}
                  <p style={{margin: '0.75rem 0 0 48px', color: '#94a3b8'}}>{mission.action}</p>
                </div>
                <span style={{fontSize: '1.5rem', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)'}}>
                  ▼
                </span>
              </div>

              {/* Mission Content (Expanded) */}
              {isExpanded && (
                <div style={{
                  padding: '1.5rem',
                  background: '#0f172a',
                  borderTop: '1px solid #334155',
                  animation: 'fadein 0.3s',
                  color: '#e2e8f0'
                }}>
                  {mission.miniLab && (
                    <div style={{marginBottom: '2rem'}}>
                      {renderMiniLab(mission.miniLab)}
                    </div>
                  )}
                  
                  {mission.details && (
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 1.5rem 0'
                    }}>
                      {mission.details.map((detail, dIdx) => (
                        <li key={dIdx} style={{
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          background: 'rgba(59,130,246,0.1)',
                          borderLeft: '3px solid #3b82f6',
                          borderRadius: '0.25rem',
                          color: '#e2e8f0',
                          fontSize: '1rem',
                          lineHeight: '1.6'
                        }}>
                          💡 {detail}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Instructions Section */}
                  {mission.instructions && (
                    <div style={{
                      background: '#1e293b',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                      border: '1px solid #334155'
                    }}>
                      <h4 style={{color: '#22c55e', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <span>📋</span> {mission.instructions.title}
                      </h4>
                      <p style={{color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem'}}>
                        Run these commands in the Playground (CLI Labs → option 8)
                      </p>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        {mission.instructions.steps.map((step, sIdx) => (
                          <div key={sIdx} style={{
                            background: '#0f172a',
                            borderRadius: '0.5rem',
                            overflow: 'hidden',
                            border: '1px solid #334155'
                          }}>
                            <div style={{
                              padding: '0.75rem 1rem',
                              background: 'rgba(34, 197, 94, 0.1)',
                              borderBottom: '1px solid #334155',
                              color: '#86efac',
                              fontWeight: '600',
                              fontSize: '0.9rem'
                            }}>
                              {step.label}
                            </div>
                            <pre style={{
                              margin: 0,
                              padding: '1rem',
                              background: '#0f172a',
                              color: '#fbbf24',
                              fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
                              fontSize: '0.85rem',
                              lineHeight: '1.6',
                              overflow: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}>
                              {step.code}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {mission.quiz && (
                    <div style={{
                      background: 'rgba(139,92,246,0.1)',
                      padding: '1.5rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(139,92,246,0.3)'
                    }}>
                      <h4 style={{color: '#a78bfa', marginTop: 0}}>🎯 Quick Quiz</h4>
                      <p style={{color: '#e2e8f0', fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '1rem'}}>
                        {mission.quiz.question}
                      </p>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                        {mission.quiz.options.map((option, oIdx) => {
                          const isSelected = quizState?.selected === oIdx;
                          const isCorrectAnswer = oIdx === mission.quiz.correct;
                          const showResult = quizState !== undefined;

                          let bgColor = '#1e293b';
                          let borderColor = '#475569';
                          let textColor = '#e2e8f0';

                          if (showResult) {
                            if (isCorrectAnswer) {
                              bgColor = 'rgba(34,197,94,0.2)';
                              borderColor = '#22c55e';
                              textColor = '#86efac';
                            } else if (isSelected && !isCorrectAnswer) {
                              bgColor = 'rgba(239,68,68,0.2)';
                              borderColor = '#ef4444';
                              textColor = '#fca5a5';
                            }
                          } else if (isSelected) {
                            bgColor = 'rgba(59,130,246,0.2)';
                            borderColor = '#3b82f6';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => !quizState && handleQuizAnswer(idx, oIdx)}
                              disabled={quizState !== undefined}
                              style={{
                                padding: '1rem',
                                background: bgColor,
                                border: `2px solid ${borderColor}`,
                                borderRadius: '0.5rem',
                                color: textColor,
                                cursor: quizState ? 'default' : 'pointer',
                                textAlign: 'left',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                              }}
                            >
                              <span style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                              }}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              {option}
                              {showResult && isCorrectAnswer && ' ✓'}
                            </button>
                          );
                        })}
                      </div>
                      {quizState && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '1rem',
                          background: quizState.correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                          borderRadius: '0.5rem',
                          color: quizState.correct ? '#86efac' : '#fca5a5',
                          fontWeight: 'bold'
                        }}>
                          {quizState.correct ? '✅ Correct! Mission completed.' : '❌ Not quite. Try again!'}
                        </div>
                      )}
                    </div>
                  )}

                  {!mission.quiz && (
                    <button
                      onClick={() => {
                        const next = [...exploreProgress];
                        next[idx] = !next[idx];
                        setExploreProgress(next);
                      }}
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        background: isCompleted ? '#64748b' : '#22c55e',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {isCompleted ? 'Mark Incomplete' : 'Mark Complete ✓'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="concept-actions" style={{marginTop: '2rem'}}>
        <button onClick={onBack}>← Back to Basics</button>
        <button
          className="primary-btn"
          onClick={onContinue}
        >
          Continue to CLI Playground →
        </button>
      </div>
    </div>
  );
}

export default ExploreView;

