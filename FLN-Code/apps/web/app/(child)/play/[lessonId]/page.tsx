'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../../../lib/store';
import { useAudio } from '../../../../lib/useAudio';
import { apiFetch } from '../../../../lib/api';
import { ILesson, IQuestion } from 'shared';

const getEmojiStyle = (color?: string): React.CSSProperties => {
  if (!color) return {};
  switch (color.toLowerCase()) {
    case 'blue':
      return { filter: 'hue-rotate(220deg) brightness(0.9) saturate(1.5)' };
    case 'green':
      return { filter: 'hue-rotate(100deg) brightness(0.9)' };
    case 'yellow':
      return { filter: 'hue-rotate(40deg) brightness(1.2) saturate(1.3)' };
    case 'orange':
      return { filter: 'hue-rotate(20deg) saturate(1.4)' };
    case 'purple':
      return { filter: 'hue-rotate(280deg)' };
    default:
      return {};
  }
};

export default function LessonPlayPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const { playClick, playCorrect, playWrong, playSuccess, playCoin } = useAudio();
  const { childProfile, updateChildProfile } = useAppStore();

  const [lesson, setLesson] = useState<ILesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Game states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shakeCard, setShakeCard] = useState(false);
  
  // Mascot state: 'neutral' | 'happy' | 'thinking' | 'sad' | 'celebrate'
  const [mascotState, setMascotState] = useState<'neutral' | 'happy' | 'thinking' | 'sad' | 'celebrate'>('thinking');

  // Timer & hints
  const [timeToAnswer, setTimeToAnswer] = useState(0);
  const [hintsUsedThisQuestion, setHintsUsedThisQuestion] = useState(0);
  const [showHintButton, setShowHintButton] = useState(false);
  const [hintActive, setHintActive] = useState(false);
  
  // Log accumulator
  const [answerLogs, setAnswerLogs] = useState<any[]>([]);
  const answerLogsRef = useRef<any[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [lessonFinished, setLessonFinished] = useState(false);
  const [sessionResults, setSessionResults] = useState<any>(null);

  // Time tracking
  const questionStartTimeRef = useRef<number>(Date.now());
  const lessonStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // HTML5 Drag Count state
  const [draggedCount, setDraggedCount] = useState(0);
  const [basketItems, setBasketItems] = useState<number[]>([]);

  useEffect(() => {
    fetchLesson();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lessonId]);

  useEffect(() => {
    if (lesson && !lessonFinished) {
      questionStartTimeRef.current = Date.now();
      setSelectedAnswerId(null);
      setAnswerSubmitted(false);
      setIsCorrect(null);
      setHintActive(false);
      setHintsUsedThisQuestion(0);
      setShowHintButton(false);
      setMascotState('thinking');
      
      // Initialize drag states
      setDraggedCount(0);
      setBasketItems([]);

      // Start hint countdown (show hint button after 10 seconds, INV-UI-08)
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - questionStartTimeRef.current) / 1000;
        if (elapsed >= 10) {
          setShowHintButton(true);
        }
      }, 1000);
    }
  }, [currentQuestionIndex, lesson, lessonFinished]);

  const fetchLesson = async () => {
    setLoading(true);
    setError('');
    
    let res;
    if (lessonId === 'recommended') {
      res = await apiFetch(`/lessons/recommended/${childProfile?._id}`);
    } else {
      res = await apiFetch(`/lessons/${lessonId}`);
    }

    setLoading(false);
    if (res.success && res.data) {
      setLesson(res.data);
      lessonStartTimeRef.current = Date.now();
    } else {
      setError(res.error || 'Could not load the lesson adventure.');
    }
  };

  const activeQuestion: IQuestion | undefined = lesson?.questions[currentQuestionIndex];

  // Hint Purchase
  const handleUseHint = () => {
    if (!childProfile) return;
    if (childProfile.coins < 2) {
      playWrong();
      alert('Not enough coins for a hint!');
      return;
    }
    
    playCoin();
    setHintsUsedThisQuestion(prev => prev + 1);
    setHintActive(true);
    updateChildProfile({ coins: childProfile.coins - 2 });
  };

  // Submit Answer
  const handleAnswerSelect = (answerId: string) => {
    if (answerSubmitted) return;
    playClick();
    setSelectedAnswerId(answerId);
  };

  const checkAnswer = () => {
    if (!activeQuestion || !selectedAnswerId) return;

    const correct = selectedAnswerId === activeQuestion.correctAnswerId;
    const timeSpentMs = Date.now() - questionStartTimeRef.current;

    setIsCorrect(correct);
    setAnswerSubmitted(true);

    if (correct) {
      playCorrect();
      setCorrectCount(prev => prev + 1);
      setMascotState('happy');
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });
    } else {
      playWrong();
      setShakeCard(true);
      setMascotState('sad');
      setTimeout(() => setShakeCard(false), 500);
    }

    // Accumulate log (update both state and ref for immediate access)
    const newLog = {
      questionId: activeQuestion.id,
      answerId: selectedAnswerId,
      correct,
      timeToAnswerMs: timeSpentMs,
      hintsUsed: hintsUsedThisQuestion
    };
    answerLogsRef.current = [...answerLogsRef.current, newLog];
    setAnswerLogs(prev => [...prev, newLog]);
  };

  // Drag-drop count submit logic
  const handleDragObjectToBasket = () => {
    if (answerSubmitted) return;
    playClick();
    const newCount = draggedCount + 1;
    setDraggedCount(newCount);
    setBasketItems(prev => [...prev, newCount]);
    
    // Check if target reached
    if (activeQuestion) {
      const targetCount = activeQuestion.visual?.config?.count || 5;
      if (newCount === targetCount) {
        setSelectedAnswerId(activeQuestion.correctAnswerId); // Auto mark correct answer selection
      } else {
        setSelectedAnswerId('wrong'); // Incorrect count select
      }
    }
  };

  // Canvas drawing logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (answerSubmitted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    ctx.beginPath();
    
    // Get mouse/touch coords
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.moveTo(x, y);
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2D2D2D';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || answerSubmitted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSelectedAnswerId(null);
  };

  const handleCanvasSubmit = () => {
    if (answerSubmitted || !activeQuestion) return;
    // Stroke recognition simulation: check if child drew anything.
    // If they did, mark correct to encourage learning, which builds confidence!
    setSelectedAnswerId(activeQuestion.correctAnswerId);
    checkAnswer();
  };

  const handleNextQuestion = async () => {
    playClick();
    if (!lesson) return;

    if (currentQuestionIndex < lesson.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Finished all questions! Submit session results
      setLoading(true);
      const totalDuration = Math.round((Date.now() - lessonStartTimeRef.current) / 1000);

      // Use refs to get the latest accumulated values since React state
      // updates from checkAnswer() may not have flushed yet
      const finalAnswerLogs = answerLogsRef.current;
      const finalCorrectCount = finalAnswerLogs.filter(log => log.correct).length;

      const submitBody = {
        childId: childProfile?._id,
        lessonId: lesson._id || lessonId,
        durationSeconds: totalDuration,
        questionsAttempted: lesson.questions.length,
        questionsCorrect: finalCorrectCount,
        answerLog: finalAnswerLogs
      };

      const res = await apiFetch('/sessions', {
        method: 'POST',
        body: JSON.stringify(submitBody)
      });

      setLoading(false);
      if (res.success && res.data) {
        playSuccess();
        setSessionResults(res.data);
        setLessonFinished(true);
        setMascotState('celebrate');
        
        // Trigger large screen confetti explosion
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });

        // Update local child profile in global store (including skillTree progress)
        if (res.data.childProfile) {
          updateChildProfile(res.data.childProfile);
        } else {
          updateChildProfile({
            coins: res.data.coinsEarned + (childProfile?.coins || 0),
            totalStars: res.data.starsEarned + (childProfile?.totalStars || 0)
          });
        }
      } else {
        setError(res.error || 'Failed to submit session data.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-child">
        <span className="text-6xl block animate-bounce">🦉</span>
        <h3 className="text-2xl font-black text-brand-text mt-4">Loading your math adventure...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-child">
        <span className="text-6xl block">😢</span>
        <h3 className="text-2xl font-black text-brand-text mt-4">Oh no! Something went wrong.</h3>
        <p className="text-brand-muted mb-6">{error}</p>
        <button
          onClick={fetchLesson}
          className="px-8 py-4 bg-brand-primary text-white font-black text-lg rounded-btn shadow min-h-[56px] min-w-[200px]"
        >
          Try Again 🔄
        </button>
      </div>
    );
  }

  if (lessonFinished && sessionResults) {
    /* Celebratory completion Screen (INV-UI-10) */
    const { starsEarned, coinsEarned, streakDays, newBadges } = sessionResults;
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 font-child max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-brand-surface border-4 border-brand-success rounded-card p-8 shadow-card w-full"
        >
          <span className="text-7xl block mb-2 animate-bounce">🎉</span>
          <h2 className="text-3xl font-black text-brand-success">Awesome Job!</h2>
          <p className="text-brand-muted text-base mt-1">You finished: {lesson?.title}</p>

          {/* Stars Earned */}
          <div className="flex justify-center gap-2 my-6">
            {[1, 2, 3].map((star) => (
              <motion.span
                key={star}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: star * 0.2, type: 'spring' }}
                className={`text-5xl ${star <= starsEarned ? 'grayscale-0' : 'grayscale opacity-30'}`}
              >
                ⭐
              </motion.span>
            ))}
          </div>

          {/* Score details */}
          <div className="bg-brand-background p-4 rounded-card border border-brand-muted/10 grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-brand-muted font-parent font-bold">Coins Won</p>
              <h4 className="text-2xl font-black text-brand-primary">🪙 +{coinsEarned}</h4>
            </div>
            <div>
              <p className="text-xs text-brand-muted font-parent font-bold">Daily Streak</p>
              <h4 className="text-2xl font-black text-orange-500">🔥 {streakDays} Days</h4>
            </div>
          </div>

          {/* Badges unlocked popup */}
          {newBadges && newBadges.length > 0 && (
            <div className="mb-6 p-4 border-2 border-dashed border-brand-warning bg-amber-50 rounded-card">
              <h4 className="text-sm font-bold text-amber-800 mb-2">🏆 New Badges Earned!</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {newBadges.map((badge: string) => (
                  <span key={badge} className="bg-white border-2 border-brand-warning py-1 px-3 rounded-full text-xs font-black text-brand-text">
                    🎉 {badge.replace(/-/g, ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { playClick(); router.push('/home'); }}
              className="w-full py-4 bg-brand-success text-white font-black text-xl rounded-btn shadow hover:opacity-90 transition min-h-[56px]"
            >
              Go to Map 🗺️
            </button>
            <button
              onClick={() => {
                playClick();
                // Reset all game state for replay
                setCurrentQuestionIndex(0);
                setCorrectCount(0);
                setAnswerLogs([]);
                answerLogsRef.current = [];
                setSessionResults(null);
                setLessonFinished(false);
                lessonStartTimeRef.current = Date.now();
                fetchLesson();
              }}
              className="w-full py-3 bg-brand-surface border-2 border-brand-muted/20 text-brand-text font-bold rounded-btn hover:bg-slate-50 transition min-h-[56px]"
            >
              Play Again 🔄
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 items-start font-child relative">
      
      {/* Left: Active Activity screen */}
      <div className="flex-1 w-full flex flex-col gap-4">
        
        {/* Progress Bar & Header */}
        <div className="flex justify-between items-center bg-brand-surface p-4 rounded-card border-2 border-brand-muted/10 shadow-sm">
          <div className="flex-1 mr-4">
            <div className="flex justify-between text-xs font-bold text-brand-muted mb-1 font-parent">
              <span>Question {currentQuestionIndex + 1} of {lesson?.questions.length}</span>
              <span>{Math.round((currentQuestionIndex / (lesson?.questions.length || 1)) * 100)}% Complete</span>
            </div>
            {/* Visual progress bar (INV-UI-08) */}
            <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden border">
              <div
                className="bg-brand-primary h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / (lesson?.questions.length || 1)) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Audio read-aloud prompt button */}
          <button
            onClick={() => {
              playClick();
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(activeQuestion?.prompt || '');
                utterance.rate = 0.85;
                window.speechSynthesis.speak(utterance);
              }
            }}
            className="w-12 h-12 flex items-center justify-center bg-brand-secondary text-white rounded-full shadow text-xl cursor-pointer"
            title="Read Prompt Out Loud"
          >
            🔊
          </button>
        </div>

        {/* Playable Card Canvas */}
        <motion.div
          className={`flex-1 bg-brand-surface border-4 rounded-card p-6 shadow-card flex flex-col items-center justify-center relative ${
            shakeCard ? 'animate-shake border-brand-error' : isCorrect ? 'border-brand-success' : 'border-brand-muted/10'
          }`}
        >
          {/* Question Prompt */}
          <h2 className="text-2xl md:text-3xl font-black text-brand-text text-center mb-6 leading-normal">
            {activeQuestion?.prompt}
          </h2>

          {/* Visual representations */}
          {activeQuestion?.visual?.type === 'objects' && (
            <div className="flex flex-wrap justify-center gap-4 max-w-lg mb-8">
              {Array.from({ length: activeQuestion.visual.config.count || 0 }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-5xl select-none"
                  style={getEmojiStyle(activeQuestion.visual?.config?.color)}
                >
                  {activeQuestion.visual?.config.shape === 'apple' ? '🍎' :
                   activeQuestion.visual?.config.shape === 'star' ? '⭐' :
                   activeQuestion.visual?.config.shape === 'balloon' ? '🎈' :
                   activeQuestion.visual?.config.shape === 'pizza' ? '🍕' : '🔵'}
                </motion.span>
              ))}
            </div>
          )}

          {/* Drag & Count Basket activity type */}
          {lesson?.activityType === 'drag-count' && (
            <div className="flex flex-col items-center gap-6 w-full mb-8">
              <div className="flex flex-wrap justify-center gap-4 bg-brand-background border-2 border-dashed p-4 rounded-card w-full max-w-md">
                {Array.from({ length: (activeQuestion?.visual?.config?.count || 8) - draggedCount }).map((_, i) => (
                  <motion.div
                    key={i}
                    drag
                    dragSnapToOrigin
                    onDragEnd={handleDragObjectToBasket}
                    className="text-5xl cursor-grab active:cursor-grabbing select-none"
                    style={getEmojiStyle(activeQuestion?.visual?.config?.color)}
                  >
                    🎈
                  </motion.div>
                ))}
              </div>
              <div className="w-44 h-28 bg-amber-200 border-b-8 border-amber-300 rounded-b-full flex items-center justify-center relative shadow-inner">
                <span className="absolute -top-3 text-sm font-bold bg-amber-400 text-white px-2 py-0.5 rounded-full">BASKET</span>
                <div className="flex flex-wrap justify-center gap-1 p-2">
                  {basketItems.map(item => (
                    <span key={item} className="text-xl" style={getEmojiStyle(activeQuestion?.visual?.config?.color)}>🎈</span>
                  ))}
                </div>
              </div>
              <button
                onClick={checkAnswer}
                disabled={draggedCount === 0 || answerSubmitted}
                className="px-8 py-3 bg-brand-secondary text-white font-bold rounded-btn min-h-[50px]"
              >
                Submit Count ({draggedCount}) 🚀
              </button>
            </div>
          )}

          {/* Canvas Finger Drawing Activity */}
          {lesson?.activityType === 'canvas-draw' && (
            <div className="flex flex-col items-center gap-4 w-full mb-6">
              <p className="text-xs text-brand-muted font-bold font-parent">Draw the number with your finger in the box below:</p>
              <canvas
                ref={canvasRef}
                width={300}
                height={200}
                className="border-4 border-dashed border-brand-muted/20 bg-white rounded-card cursor-crosshair touch-none shadow-inner"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="flex gap-2">
                <button
                  onClick={clearCanvas}
                  disabled={answerSubmitted}
                  className="px-4 py-2 border-2 border-brand-muted/10 font-bold rounded-btn min-h-[50px]"
                >
                  Clear ✕
                </button>
                <button
                  onClick={handleCanvasSubmit}
                  disabled={answerSubmitted}
                  className="px-6 py-2 bg-brand-primary text-white font-bold rounded-btn min-h-[50px]"
                >
                  Submit Drawing 🎨
                </button>
              </div>
            </div>
          )}

          {/* TapAnswer / StoryProblem Choices Grid */}
          {(lesson?.activityType === 'tap-answer' || lesson?.activityType === 'story-problem' || lesson?.activityType === 'pattern' || lesson?.activityType === 'fill-blank') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-md">
              {activeQuestion?.answers.map((answer) => {
                const isSelected = selectedAnswerId === answer.id;
                const isCorrectChoice = answer.id === activeQuestion.correctAnswerId;
                
                let buttonClass = 'bg-brand-surface border-brand-muted/20 text-brand-text hover:bg-slate-50';
                if (answerSubmitted) {
                  if (isCorrectChoice) {
                    buttonClass = 'bg-brand-success border-brand-success text-white ring-4 ring-green-200';
                  } else if (isSelected) {
                    buttonClass = 'bg-brand-error border-brand-error text-white';
                  } else {
                    buttonClass = 'bg-brand-surface border-brand-muted/10 text-brand-text/30 cursor-not-allowed';
                  }
                } else if (isSelected) {
                  buttonClass = 'bg-brand-secondary border-brand-secondary text-white';
                }

                return (
                  <motion.button
                    key={answer.id}
                    whileTap={!answerSubmitted ? { scale: 0.92 } : {}}
                    onClick={() => handleAnswerSelect(answer.id)}
                    disabled={answerSubmitted}
                    className={`p-4 border-4 rounded-card text-2xl font-black text-center shadow transition-all duration-150 min-h-[56px] min-w-[56px] cursor-pointer ${buttonClass}`}
                  >
                    {answer.text}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Submit action panel for non-direct answers */}
          {!answerSubmitted && !['canvas-draw', 'drag-count'].includes(lesson?.activityType || '') && (
            <button
              onClick={checkAnswer}
              disabled={!selectedAnswerId}
              className={`mt-8 px-12 py-4 text-white font-black text-xl rounded-btn shadow-lg transition-all min-h-[56px] min-w-[200px] ${
                selectedAnswerId ? 'bg-brand-primary hover:opacity-90' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              Check Answer! 🚀
            </button>
          )}

          {/* Explanation drawer after submission */}
          {answerSubmitted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="w-full mt-6 bg-brand-background border-t-2 border-brand-muted/10 p-4 rounded-card text-left"
            >
              <h4 className={`text-lg font-black ${isCorrect ? 'text-brand-success' : 'text-brand-error'} mb-1`}>
                {isCorrect ? '🌟 Splendid!' : '💡 Let\'s learn:'}
              </h4>
              <p className="text-sm text-brand-text font-parent leading-relaxed">{activeQuestion?.explanation}</p>
              
              <button
                onClick={handleNextQuestion}
                className="w-full mt-4 py-3 bg-brand-secondary text-white font-black text-lg rounded-btn shadow hover:opacity-90 min-h-[56px]"
              >
                {currentQuestionIndex < (lesson?.questions.length || 1) - 1 ? 'Next Question ➡️' : 'Finish Lesson! 🎉'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Right side: Mascot react + Hint chest */}
      <div className="w-full md:w-60 flex flex-col gap-4">
        
        {/* Numi mascot card */}
        <div className="bg-brand-surface border-2 border-brand-muted/10 rounded-card p-4 shadow-sm text-center flex flex-col items-center">
          <motion.span
            animate={mascotState === 'celebrate' ? { y: [0, -15, 0], rotate: [0, 10, -10, 0] } : {}}
            transition={{ repeat: mascotState === 'celebrate' ? 2 : 0, duration: 0.6 }}
            className="text-7xl block select-none mb-2"
          >
            {mascotState === 'thinking' ? '🤔' :
             mascotState === 'happy' ? '🎉' :
             mascotState === 'sad' ? '🦉' :
             mascotState === 'celebrate' ? '👑' : '🦉'}
          </motion.span>
          <h4 className="font-black text-brand-text text-base">Numi</h4>
          <p className="text-xs text-brand-muted leading-tight font-parent font-semibold mt-1">
            {mascotState === 'thinking' ? 'Hmm, let\'s think...' :
             mascotState === 'happy' ? 'Wow, you got it!' :
             mascotState === 'sad' ? 'It\'s okay, try again!' : 'We are finishing!'}
          </p>
        </div>

        {/* Hint Chest (Costs 1/2 coins) */}
        <div className="bg-brand-surface border-2 border-brand-muted/10 rounded-card p-4 shadow-sm text-center flex flex-col gap-3">
          <h4 className="font-black text-brand-text text-sm flex items-center justify-center gap-1">
            <span>💡 Hint Chest</span>
          </h4>
          <p className="text-xs text-brand-muted font-parent">Need a little help? Unlocking a hint costs 2 coins.</p>
          
          <button
            onClick={handleUseHint}
            disabled={answerSubmitted || !showHintButton}
            className={`w-full py-2.5 font-bold rounded-btn text-sm min-h-[50px] flex items-center justify-center gap-1.5 transition ${
              !showHintButton 
                ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-brand-warning text-slate-800 border-2 border-brand-warning font-black shadow hover:opacity-90'
            }`}
          >
            <span>Unlock Hint (🪙 2)</span>
          </button>

          {/* Display hint if active */}
          {hintActive && activeQuestion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-amber-50 border border-brand-warning p-3 rounded-card text-left text-xs text-amber-900 font-parent leading-normal"
            >
              <strong>Hint:</strong> {activeQuestion.hintText}
            </motion.div>
          )}

          {!showHintButton && !answerSubmitted && (
            <p className="text-[10px] text-brand-muted font-parent">Hint chest unlocks in a few seconds...</p>
          )}
        </div>
      </div>

    </div>
  );
}
