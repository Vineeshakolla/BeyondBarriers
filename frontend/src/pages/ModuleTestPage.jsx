import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGetModuleTest, apiSubmitTestAttempt } from '../services/api';
import { useVoiceAgent } from '../context/VoiceContext';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Send, 
  RotateCcw, ArrowRight, Award, HelpCircle, Check, X, ShieldAlert, Volume2
} from 'lucide-react';

export const ModuleTestPage = () => {
  const { moduleId } = useParams();
  const { registerPageSummary, speakText, readCurrentPage } = useVoiceAgent();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [qId]: { selected_option: 'A', confidence: 'Sure' } }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      setError('');
      setResult(null);
      try {
        const res = await apiGetModuleTest(moduleId);
        if (res.ok && res.data) {
          const t = res.data.test;
          const qList = res.data.questions || [];
          setTest(t);
          setQuestions(qList);
          // Initialize empty answers
          const initial = {};
          qList.forEach(q => {
            initial[q.id] = { selected_option: '', confidence: 'Sure' };
          });
          setAnswers(initial);

          // Build accessible test summary
          const q1 = qList[0];
          const q1Summary = q1
            ? `Question 1: ${q1.question_text}. Option A: ${q1.option_a}. Option B: ${q1.option_b}. Option C: ${q1.option_c}. Option D: ${q1.option_d}. Say Option A, Option B, Option C, or Option D to answer.`
            : '';

          const testSummary = `Starting the test for ${t.title}. Passing score is ${t.passing_score} percent across ${qList.length} questions. ${q1Summary}`;

          registerPageSummary(`/student/learning/module/${moduleId}/test`, testSummary);
        } else {
          setError(res.error || 'Failed to load test questions.');
        }
      } catch (err) {
        setError('Failed to connect to test service.');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [moduleId, registerPageSummary]);

  const handleSelectOption = useCallback((questionId, optionKey) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selected_option: optionKey
      }
    }));
    setError('');
  }, []);

  const handleSelectConfidence = useCallback((questionId, confidenceVal) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        confidence: confidenceVal
      }
    }));
  }, []);

  const handleReadActiveQuestion = useCallback((idx = activeQuestionIdx) => {
    if (questions.length === 0 || !questions[idx]) return;
    const q = questions[idx];
    const text = `Question ${q.question_number} of ${questions.length}: ${q.question_text}. Option A: ${q.option_a}. Option B: ${q.option_b}. Option C: ${q.option_c}. Option D: ${q.option_d}.`;
    speakText(text, { interrupt: true });
  }, [questions, activeQuestionIdx, speakText]);

  useEffect(() => {
    const handleVoiceTestEvent = (e) => {
      const { option, confidence, command } = e.detail || {};
      if (option && questions.length > 0) {
        const targetQ = questions[activeQuestionIdx] || questions[0];
        if (targetQ) {
          handleSelectOption(targetQ.id, option.toUpperCase());
          speakText(`Selected Option ${option.toUpperCase()} for question ${targetQ.question_number}.`, { interrupt: true, isAcknowledgement: true });
          if (activeQuestionIdx < questions.length - 1) {
            setActiveQuestionIdx(prev => prev + 1);
          }
        }
      } else if (confidence && questions.length > 0) {
        const targetQ = questions[activeQuestionIdx] || questions[0];
        if (targetQ) {
          handleSelectConfidence(targetQ.id, confidence);
          speakText(`Confidence marked as ${confidence}.`, { interrupt: true, isAcknowledgement: true });
        }
      } else if (command === 'submit') {
        handleSubmit();
      } else if (command === 'read-question' || command === 'repeat-question') {
        handleReadActiveQuestion();
      }
    };

    window.addEventListener('voice-test-command', handleVoiceTestEvent);
    return () => window.removeEventListener('voice-test-command', handleVoiceTestEvent);
  }, [questions, activeQuestionIdx, handleSelectOption, handleSelectConfidence, handleReadActiveQuestion, speakText, handleSubmit]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    // Validation: Ensure all questions have an option selected
    const unselected = questions.filter(q => !answers[q.id]?.selected_option);
    if (unselected.length > 0) {
      setError(`Please answer all questions before submitting. (Unanswered: #${unselected.map(q => q.question_number).join(', #')})`);
      return;
    }

    setSubmitting(true);
    const payload = questions.map(q => ({
      question_id: q.id,
      selected_option: answers[q.id].selected_option,
      confidence: answers[q.id].confidence || 'Sure'
    }));

    try {
      const res = await apiSubmitTestAttempt(test.id, payload);
      if (res.ok && res.data && res.data.result) {
        const resData = res.data.result;
        setResult(resData);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Speak test result summary
        const resultSpeech = `Test submitted. Your score is ${Math.round(resData.score)} percent. You ${resData.passed ? 'passed' : 'did not pass'}. Result breakdown: ${resData.confidence_analysis.sure_correct} mastery concepts, ${resData.confidence_analysis.sure_incorrect} misconceptions identified. Next module recommendation: ${resData.next_module_adaptive.level}.`;
        speakText(resultSpeech, { interrupt: true });
      } else {
        setError(res.error || 'Failed to submit test attempt.');
      }
    } catch (err) {
      setError('An unexpected error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    const initial = {};
    questions.forEach(q => {
      initial[q.id] = { selected_option: '', confidence: 'Sure' };
    });
    setAnswers(initial);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', margin: '0 auto', padding: '2.5rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '1rem' }}>
            <Sparkles size={14} /> Loading Diagnostic Check
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Preparing test questions...</p>
        </div>
      </div>
    );
  }

  if (error && !test && !result) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <div className="card" style={{ maxWidth: '540px', margin: '0 auto', borderLeft: '4px solid var(--danger-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={20} color="var(--danger-500)" />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--danger-600)' }}>
              {error}
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Link to={`/student/learning/module/${moduleId}`} className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} /> Back to Module Content
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* Back Link */}
        <div style={{ marginBottom: '1rem' }}>
          <Link to={`/student/learning/module/${moduleId}`} className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back to Module
          </Link>
        </div>

        {/* Header Banner */}
        <div className="card" style={{ marginBottom: '1.75rem', background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-50) 100%)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-neutral">{test?.subject_name}</span>
                <span className="badge badge-info">{test?.module_title}</span>
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{test?.title}</h1>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="badge badge-neutral" style={{ padding: '0.4rem 0.75rem' }}>
                Pass Criteria: <strong>{test?.passing_score}%</strong>
              </span>
              <span className="badge badge-info" style={{ padding: '0.4rem 0.75rem' }}>
                Questions: <strong>{questions.length}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--danger-500)', backgroundColor: 'var(--danger-50)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertCircle size={20} color="var(--danger-500)" />
              <div style={{ fontSize: '0.9rem', color: 'var(--danger-600)', fontWeight: 600 }}>{error}</div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RESULTS SCREEN (Displayed upon submission)                                */}
        {/* ========================================================================= */}
        {result ? (
          <div>
            {/* Score Banner */}
            <div className="card" style={{ 
              marginBottom: '1.5rem', 
              borderLeft: result.passed ? '4px solid var(--accent-500)' : '4px solid var(--danger-500)',
              backgroundColor: result.passed ? 'var(--accent-50)' : 'var(--danger-50)',
              padding: '1.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${result.passed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.8rem' }}>
                      {result.passed ? 'Module Passed' : 'Needs Review'}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.8rem' }}>
                      Attempt #{result.attempt_number}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--text-main)' }}>
                    Your Score: {result.score}%
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {result.correct_count} of {result.total_questions} questions correct • Passing threshold: {result.passing_score}%
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={handleRetake} className="btn btn-secondary">
                    <RotateCcw size={15} /> Retake Test
                  </button>
                  <Link to={`/student/learning/module/${moduleId}`} className="btn btn-primary">
                    Continue <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>

            {/* ADAPTIVE NEXT-MODULE RECOMMENDATION */}
            {result.next_module_adaptive && (
              <div className="card" style={{ 
                marginBottom: '1.5rem', 
                border: '1px solid var(--primary-500)', 
                backgroundColor: 'var(--primary-50)',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Sparkles size={18} color="var(--primary-600)" />
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-700)' }}>
                    Adaptive Learning Pipeline: <span style={{ textTransform: 'uppercase' }}>{result.next_module_adaptive.level} MODE</span> Recommended
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--primary-700)', lineHeight: 1.4 }}>
                  {result.next_module_adaptive.reason}
                </p>
              </div>
            )}

            {/* CONFIDENCE ANALYSIS QUADRANT MATRIX */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={18} color="var(--primary-500)" />
                  <h3 className="card-title">Confidence & Mastery Analysis</h3>
                </div>
                <span className="badge badge-neutral">Cognitive Signal</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                
                {/* Mastery */}
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-50)', border: '1px solid var(--accent-500)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-600)', textTransform: 'uppercase' }}>
                    True Mastery
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--accent-600)' }}>
                    {result.confidence_analysis?.sure_correct || 0}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Correct + Sure
                  </div>
                </div>

                {/* Misconception */}
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--warning-50)', border: '1px solid var(--warning-500)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning-600)', textTransform: 'uppercase' }}>
                    Misconceptions
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--warning-600)' }}>
                    {result.confidence_analysis?.sure_incorrect || 0}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Wrong + Sure
                  </div>
                </div>

                {/* Lucky Guess */}
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-50)', border: '1px solid var(--primary-500)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase' }}>
                    Lucky Guesses
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--primary-600)' }}>
                    {result.confidence_analysis?.guessing_correct || 0}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Correct + Guessing
                  </div>
                </div>

                {/* Knowledge Gap */}
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-300)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                    Recognized Gaps
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--text-main)' }}>
                    {result.confidence_analysis?.guessing_incorrect || 0}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Wrong + Guessing
                  </div>
                </div>

              </div>
            </div>

            {/* DETAILED QUESTION REVIEW */}
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>Question-by-Question Review</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {result.answers?.map((ans, idx) => (
                <div 
                  key={ans.question_id}
                  className="card"
                  style={{ 
                    borderLeft: ans.is_correct ? '4px solid var(--accent-500)' : '4px solid var(--danger-500)' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-faint)' }}>
                      Question {idx + 1}
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <span className={`badge ${ans.is_correct ? 'badge-success' : 'badge-danger'}`}>
                        {ans.is_correct ? <Check size={12} /> : <X size={12} />}
                        {ans.is_correct ? 'Correct' : 'Incorrect'}
                      </span>
                      <span className="badge badge-neutral">
                        Confidence: {ans.confidence}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                    {ans.question_text}
                  </p>

                  <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Your choice: <strong>Option {ans.selected_option}</strong> {!ans.is_correct && <span style={{ color: 'var(--danger-500)' }}>(Incorrect)</span>}
                  </div>
                  {!ans.is_correct && (
                    <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--accent-600)' }}>
                      Correct answer: <strong>Option {ans.correct_option}</strong>
                    </div>
                  )}

                  {/* Pedagogical Explanation */}
                  <div style={{ 
                    padding: '0.65rem 0.85rem', 
                    borderRadius: 'var(--radius-sm)', 
                    backgroundColor: 'var(--slate-50)', 
                    fontSize: '0.825rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                    border: '1px solid var(--border-color)'
                  }}>
                    <strong>Explanation:</strong> {ans.explanation}
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* TEST TAKING FORM                                                          */
          /* ========================================================================= */
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
              {questions.map((q, idx) => {
                const currentAnswer = answers[q.id] || { selected_option: '', confidence: 'Sure' };
                const isAnswered = Boolean(currentAnswer.selected_option);

                return (
                  <div 
                    key={q.id}
                    className="card"
                    style={{ border: isAnswered ? '1px solid var(--primary-500)' : '1px solid var(--border-color)' }}
                  >
                    {/* Question Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                        Question {idx + 1} of {questions.length}
                      </span>
                      {isAnswered && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-600)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                          <Check size={14} /> Answered
                        </span>
                      )}
                    </div>

                    {/* Question Text */}
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', lineHeight: 1.45 }}>
                      {q.question_text}
                    </h3>

                    {/* Multiple Choice Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                      {['A', 'B', 'C', 'D'].map(optKey => {
                        const optText = q[`option_${optKey.toLowerCase()}`];
                        if (!optText) return null;
                        const isSelected = currentAnswer.selected_option === optKey;

                        return (
                          <div
                            key={optKey}
                            onClick={() => handleSelectOption(q.id, optKey)}
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: 'var(--radius-sm)',
                              border: `2px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-color)'}`,
                              backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-surface)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: isSelected ? 'var(--primary-500)' : 'var(--slate-100)',
                              color: isSelected ? '#ffffff' : 'var(--text-main)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.8rem'
                            }}>
                              {optKey}
                            </div>
                            <span style={{ fontSize: '0.9rem', color: isSelected ? 'var(--primary-700)' : 'var(--text-main)', fontWeight: isSelected ? 600 : 400 }}>
                              {optText}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* CONFIDENCE CAPTURE CONTROL */}
                    <div style={{ 
                      padding: '0.85rem 1rem', 
                      backgroundColor: 'var(--slate-50)', 
                      borderRadius: 'var(--radius-sm)',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          How confident are you in this answer?
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          Helps us adapt your upcoming modules.
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleSelectConfidence(q.id, 'Sure')}
                          style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            border: `2px solid ${currentAnswer.confidence === 'Sure' ? 'var(--accent-500)' : 'var(--border-color)'}`,
                            backgroundColor: currentAnswer.confidence === 'Sure' ? 'var(--accent-50)' : 'var(--bg-surface)',
                            color: currentAnswer.confidence === 'Sure' ? 'var(--accent-600)' : 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          ○ Sure
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectConfidence(q.id, 'Guessing')}
                          style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            border: `2px solid ${currentAnswer.confidence === 'Guessing' ? 'var(--warning-500)' : 'var(--border-color)'}`,
                            backgroundColor: currentAnswer.confidence === 'Guessing' ? 'var(--warning-50)' : 'var(--bg-surface)',
                            color: currentAnswer.confidence === 'Guessing' ? 'var(--warning-600)' : 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          ○ Guessing
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Submit Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
              <Link to={`/student/learning/module/${moduleId}`} className="btn btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ minWidth: '180px' }}
              >
                {submitting ? 'Evaluating...' : 'Submit Test Attempt'}
                <Send size={16} />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ModuleTestPage;
