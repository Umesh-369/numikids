'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../../../lib/store';
import { useAudio } from '../../../lib/useAudio';
import { apiFetch } from '../../../lib/api';

export default function GamesArcade() {
  const { playClick, playCorrect, playSuccess, playWrong, playCoin } = useAudio();
  const { childProfile, updateChildProfile } = useAppStore();

  const [activeGame, setActiveGame] = useState<'balloon' | 'pizza' | 'grocery' | 'bingo' | null>(null);

  // -------------------------------------------------------------
  // GAME 1: Number Balloon Pop State & Config
  // -------------------------------------------------------------
  const [balloonScore, setBalloonScore] = useState(0);
  const [balloonLives, setBalloonLives] = useState(3);
  const [balloons, setBalloons] = useState<{ id: number; num: number; x: number; color: string }[]>([]);
  const [balloonGameOver, setBalloonGameOver] = useState(false);
  const [balloonDifficulty, setBalloonDifficulty] = useState(5); // pop numbers < 5
  const balloonIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const balloonSpawnCountRef = useRef(0);

  const startBalloonGame = () => {
    playClick();
    setBalloonScore(0);
    setBalloonLives(3);
    setBalloonGameOver(false);
    setBalloons([]);
    balloonSpawnCountRef.current = 0;
    setActiveGame('balloon');

    if (balloonIntervalRef.current) clearInterval(balloonIntervalRef.current);
    balloonIntervalRef.current = setInterval(() => {
      spawnBalloon();
    }, 1500);
  };

  const spawnBalloon = () => {
    if (balloonLives <= 0) return;
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E06C', '#a78bfa'];
    const randomNum = Math.floor(Math.random() * 9) + 1; // 1 to 9
    const randomX = Math.floor(Math.random() * 60) + 20; // 20% to 80%
    const id = balloonSpawnCountRef.current++;
    
    setBalloons((prev) => [...prev, { id, num: randomNum, x: randomX, color: colors[id % colors.length] }]);

    // Remove balloon after 4s (let float off screen)
    setTimeout(() => {
      setBalloons((prev) => {
        const found = prev.find(b => b.id === id);
        if (found) {
          // If child missed a correct balloon (< 5), they lose a life
          if (found.num < balloonDifficulty) {
            setBalloonLives(lives => {
              const newLives = lives - 1;
              if (newLives <= 0) handleBalloonGameOver();
              return newLives;
            });
          }
        }
        return prev.filter(b => b.id !== id);
      });
    }, 4000);
  };

  const handlePopBalloon = (id: number, num: number) => {
    if (balloonGameOver) return;
    
    // Check if correctly popped
    if (num < balloonDifficulty) {
      playCoin();
      setBalloonScore(prev => prev + 10);
    } else {
      playWrong();
      setBalloonLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) handleBalloonGameOver();
        return newLives;
      });
    }

    setBalloons(prev => prev.filter(b => b.id !== id));
  };

  const handleBalloonGameOver = () => {
    setBalloonGameOver(true);
    if (balloonIntervalRef.current) clearInterval(balloonIntervalRef.current);
    // Award coins
    awardCoins(15);
  };

  // -------------------------------------------------------------
  // GAME 2: Pizza Fraction Builder State & Config
  // -------------------------------------------------------------
  const [pizzaSlicesCount, setPizzaSlicesCount] = useState(4); // default 4 slices
  const [pizzaTargetFraction, setPizzaTargetFraction] = useState({ num: 1, den: 4 }); // 1/4
  const [coloredSlices, setColoredSlices] = useState<number[]>([]); // indexes of colored slices
  const [pizzaWon, setPizzaWon] = useState(false);

  const startPizzaGame = () => {
    playClick();
    const denominators = [2, 4, 8];
    const den = denominators[Math.floor(Math.random() * denominators.length)];
    const num = Math.floor(Math.random() * (den - 1)) + 1; // 1 to den-1
    
    setPizzaSlicesCount(den);
    setPizzaTargetFraction({ num, den });
    setColoredSlices([]);
    setPizzaWon(false);
    setActiveGame('pizza');
  };

  const handleSliceClick = (index: number) => {
    if (pizzaWon) return;
    playClick();
    if (coloredSlices.includes(index)) {
      setColoredSlices(prev => prev.filter(i => i !== index));
    } else {
      setColoredSlices(prev => [...prev, index]);
    }
  };

  const verifyPizzaFraction = () => {
    const coloredCount = coloredSlices.length;
    // Check if colored fraction matches target fraction
    // e.g. coloredCount / pizzaSlicesCount === targetFraction
    const isCorrect = coloredCount / pizzaSlicesCount === pizzaTargetFraction.num / pizzaTargetFraction.den;

    if (isCorrect) {
      playSuccess();
      setPizzaWon(true);
      awardCoins(30);
    } else {
      playWrong();
      alert(`Oops! That colors ${coloredCount}/${pizzaSlicesCount} slices. We need exactly ${pizzaTargetFraction.num}/${pizzaTargetFraction.den}!`);
    }
  };

  // -------------------------------------------------------------
  // GAME 3: Grocery Checkout State & Config
  // -------------------------------------------------------------
  const GROCERY_ITEMS = [
    { id: 'g1', name: 'Fresh Banana 🍌', price: 4 },
    { id: 'g2', name: 'Strawberry Cupcake 🧁', price: 8 },
    { id: 'g3', name: 'Golden Honey 🍯', price: 10 },
    { id: 'g4', name: 'Tasty Donut 🍩', price: 6 },
    { id: 'g5', name: 'Red Apple 🍎', price: 3 },
    { id: 'g6', name: 'Juicy Watermelon 🍉', price: 12 }
  ];

  const [groceryBudget, setGroceryBudget] = useState(20);
  const [groceryTargetItem, setGroceryTargetItem] = useState('Strawberry Cupcake 🧁');
  const [groceryCart, setGroceryCart] = useState<any[]>([]);
  const [groceryFinished, setGroceryFinished] = useState(false);
  const [grocerySuccess, setGrocerySuccess] = useState(false);

  const startGroceryGame = () => {
    playClick();
    setGroceryCart([]);
    setGroceryFinished(false);
    setGrocerySuccess(false);
    
    // Choose a random item they MUST buy
    const randomTarget = GROCERY_ITEMS[Math.floor(Math.random() * GROCERY_ITEMS.length)];
    setGroceryTargetItem(randomTarget.name);
    setGroceryBudget(15 + Math.floor(Math.random() * 10)); // Budget 15 - 24
    
    setActiveGame('grocery');
  };

  const handleAddRemoveGroceryItem = (item: any) => {
    if (groceryFinished) return;
    playClick();
    if (groceryCart.some(i => i.id === item.id)) {
      setGroceryCart(prev => prev.filter(i => i.id !== item.id));
    } else {
      setGroceryCart(prev => [...prev, item]);
    }
  };

  const checkGroceryBill = () => {
    const total = groceryCart.reduce((sum, i) => sum + i.price, 0);
    const hasRequired = groceryCart.some(i => i.name === groceryTargetItem);
    const underBudget = total <= groceryBudget;

    setGroceryFinished(true);
    if (underBudget && hasRequired && groceryCart.length > 0) {
      playSuccess();
      setGrocerySuccess(true);
      awardCoins(40);
    } else {
      playWrong();
      setGrocerySuccess(false);
    }
  };

  // -------------------------------------------------------------
  // GAME 4: Math Bingo Multiplayer State & Config
  // -------------------------------------------------------------
  const [socket, setSocket] = useState<Socket | null>(null);
  const [bingoRoomId, setBingoRoomId] = useState('');
  const [bingoPlayers, setBingoPlayers] = useState<any[]>([]);
  const [bingoBoard, setBingoBoard] = useState<number[][]>([]);
  const [bingoMarked, setBingoMarked] = useState<boolean[][]>([
    [false, false, false],
    [false, false, false],
    [false, false, false]
  ]);
  const [bingoQuestion, setBingoQuestion] = useState<{ text: string; choices: number[] } | null>(null);
  const [bingoLobbyMessage, setBingoLobbyMessage] = useState('Connecting to Math Bingo...');
  const [bingoFeedback, setBingoFeedback] = useState<string | null>(null);
  const [bingoOver, setBingoOver] = useState(false);
  const [bingoWinner, setBingoWinner] = useState('');

  const startBingoGame = () => {
    playClick();
    setBingoOver(false);
    setBingoWinner('');
    setBingoQuestion(null);
    setBingoLobbyMessage('Joining room queue... Searching for players 🔍');
    setBingoMarked([
      [false, false, false],
      [false, false, false],
      [false, false, false]
    ]);
    setActiveGame('bingo');

    // Socket.io Client initialization (INV-REALTIME-01)
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket client connected.');
      newSocket.emit('game:join', {
        childId: childProfile?._id || '',
        name: childProfile?.name || 'Player',
        ageGroup: childProfile?.ageGroup || '5-6'
      });
    });

    newSocket.on('game:started', (data: { roomId: string; board: number[][]; players: any[] }) => {
      playSuccess();
      setBingoRoomId(data.roomId);
      setBingoBoard(data.board);
      setBingoPlayers(data.players);
      setBingoLobbyMessage('');
    });

    newSocket.on('game:question', (data: { questionText: string; choices: number[] }) => {
      setBingoQuestion({
        text: data.questionText,
        choices: data.choices
      });
      setBingoFeedback(null);
    });

    newSocket.on('game:feedback', (data: { correct: boolean; score?: number; markedIndex?: number }) => {
      if (data.correct) {
        playCorrect();
        setBingoFeedback('Correct! 🌟');
        // Mark the board locally
        const idx = data.markedIndex || 0;
        const r = Math.floor(idx / 3);
        const c = idx % 3;
        setBingoMarked(prev => {
          const updated = prev.map(row => [...row]);
          updated[r][c] = true;
          return updated;
        });
      } else {
        playWrong();
        setBingoFeedback('Wrong, try another choice! ❌');
      }
    });

    newSocket.on('game:status', (data: { players: any[] }) => {
      setBingoPlayers(data.players);
    });

    newSocket.on('game:over', (data: { winner: string; isWinner: boolean }) => {
      playSuccess();
      setBingoOver(true);
      setBingoWinner(data.winner);
      if (data.isWinner) {
        // Increment coins
        awardCoins(80);
      }
      newSocket.disconnect();
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected.');
    });
  };

  const handleSubmitBingoAnswer = (ans: number) => {
    if (!socket || bingoOver) return;
    playClick();
    socket.emit('game:answer', {
      roomId: bingoRoomId,
      answer: ans
    });
  };

  // Clean up sockets on leave
  const closeAllGames = () => {
    playClick();
    setActiveGame(null);
    if (balloonIntervalRef.current) clearInterval(balloonIntervalRef.current);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Helper to award coins to child profile
  const awardCoins = async (amount: number) => {
    if (!childProfile) return;
    const newCoins = childProfile.coins + amount;
    
    // Call API patch children
    const res = await apiFetch(`/children/${childProfile._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ coins: newCoins })
    });

    if (res.success) {
      updateChildProfile({ coins: newCoins });
    }
  };

  return (
    <div className="flex-1 flex flex-col font-child select-none">
      
      {/* Game Selector Arcade Menu */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-black text-brand-text">🕹️ Numi\'s Fun Zone</h2>
        <p className="text-brand-muted text-base mt-1">Play mini-games to practice your math and earn coins!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl w-full mx-auto">
        {/* Game 1 Card */}
        <motion.div
          whileHover={{ y: -8 }}
          onClick={startBalloonGame}
          className="bg-brand-surface border-4 border-brand-primary rounded-card p-6 shadow-card text-center cursor-pointer flex flex-col justify-between"
        >
          <div>
            <span className="text-5xl block animate-bounce mb-2">🎈</span>
            <h3 className="text-xl font-black text-brand-text">Balloon Pop</h3>
            <p className="text-xs text-brand-muted font-parent mt-2 font-semibold">Pop numbers less than 5! Fast-paced reaction math.</p>
          </div>
          <button className="w-full mt-4 py-2 bg-brand-primary text-white font-black rounded-btn min-h-[48px]">
            Play! 🪙 15
          </button>
        </motion.div>

        {/* Game 2 Card */}
        <motion.div
          whileHover={{ y: -8 }}
          onClick={startPizzaGame}
          className="bg-brand-surface border-4 border-brand-secondary rounded-card p-6 shadow-card text-center cursor-pointer flex flex-col justify-between"
        >
          <div>
            <span className="text-5xl block animate-float mb-2">🍕</span>
            <h3 className="text-xl font-black text-brand-text">Pizza Fractions</h3>
            <p className="text-xs text-brand-muted font-parent mt-2 font-semibold">Color slices of pizza to create target fractions.</p>
          </div>
          <button className="w-full mt-4 py-2 bg-brand-secondary text-white font-black rounded-btn min-h-[48px]">
            Play! 🪙 30
          </button>
        </motion.div>

        {/* Game 3 Card */}
        <motion.div
          whileHover={{ y: -8 }}
          onClick={startGroceryGame}
          className="bg-brand-surface border-4 border-brand-warning rounded-card p-6 shadow-card text-center cursor-pointer flex flex-col justify-between"
        >
          <div>
            <span className="text-5xl block mb-2">🛒</span>
            <h3 className="text-xl font-black text-brand-text">Grocery Shop</h3>
            <p className="text-xs text-brand-muted font-parent mt-2 font-semibold">Stay under budget and buy the required foods.</p>
          </div>
          <button className="w-full mt-4 py-2 bg-brand-warning text-slate-800 font-black rounded-btn min-h-[48px]">
            Play! 🪙 40
          </button>
        </motion.div>

        {/* Game 4 Card */}
        <motion.div
          whileHover={{ y: -8 }}
          onClick={startBingoGame}
          className="bg-brand-surface border-4 border-purple-400 rounded-card p-6 shadow-card text-center cursor-pointer flex flex-col justify-between"
        >
          <div>
            <span className="text-5xl block animate-pulse mb-2">🔢</span>
            <h3 className="text-xl font-black text-brand-text">Math Bingo</h3>
            <p className="text-xs text-brand-muted font-parent mt-2 font-semibold">Real-time multiplayer competition with other players & bots.</p>
          </div>
          <button className="w-full mt-4 py-2 bg-purple-500 text-white font-black rounded-btn min-h-[48px]">
            Play! 🪙 80
          </button>
        </motion.div>
      </div>

      {/* GAME DRAWERS / OVERLAY PORTALS */}
      <AnimatePresence>
        {activeGame && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-surface rounded-card border-4 border-brand-primary p-6 max-w-lg w-full shadow-lg relative min-h-[400px] flex flex-col justify-between"
            >
              
              {/* Close Button */}
              <button
                onClick={closeAllGames}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-brand-text cursor-pointer"
              >
                ✕
              </button>

              {/* ------------------------------------------------------------- */}
              {/* GAME 1: Balloon Pop Render */}
              {/* ------------------------------------------------------------- */}
              {activeGame === 'balloon' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="text-center border-b pb-3 mb-3">
                    <h3 className="text-2xl font-black text-brand-text">Balloon Pop! 🎈</h3>
                    <p className="text-sm font-bold text-brand-primary">Pop balloons showing numbers LESS THAN {balloonDifficulty}!</p>
                    <div className="flex justify-between mt-2 text-sm font-black">
                      <span>Score: {balloonScore}</span>
                      <span className="text-red-500">Lives: {Array.from({ length: balloonLives }).map(() => '❤️')}</span>
                    </div>
                  </div>

                  {!balloonGameOver ? (
                    <div className="h-64 bg-sky-50 border-2 border-dashed rounded-card relative overflow-hidden">
                      {balloons.map((b) => (
                        <motion.button
                          key={b.id}
                          onClick={() => handlePopBalloon(b.id, b.num)}
                          initial={{ y: 260 }}
                          animate={{ y: -50 }}
                          transition={{ duration: 4, ease: 'linear' }}
                          style={{ left: `${b.x}%`, backgroundColor: b.color }}
                          className="absolute -translate-x-1/2 w-12 h-16 rounded-full flex items-center justify-center font-black text-white text-xl shadow-md min-h-[56px] min-w-[48px]"
                        >
                          {b.num}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-6 bg-slate-400" />
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 flex-1 flex flex-col items-center justify-center">
                      <span className="text-5xl block animate-bounce">🏆</span>
                      <h4 className="text-2xl font-black text-brand-primary mt-2">Game Over!</h4>
                      <p className="text-brand-muted text-sm mt-1">Excellent speed! You scored: {balloonScore} points.</p>
                      <p className="text-brand-success font-black mt-2">🪙 Earned +15 coins!</p>
                      <button
                        onClick={startBalloonGame}
                        className="mt-6 px-8 py-3 bg-brand-primary text-white font-black rounded-btn min-h-[48px]"
                      >
                        Play Again 🔄
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* GAME 2: Pizza Fractions Render */}
              {/* ------------------------------------------------------------- */}
              {activeGame === 'pizza' && (
                <div className="flex-1 flex flex-col justify-between text-center">
                  <div className="border-b pb-3 mb-3">
                    <h3 className="text-2xl font-black text-brand-text">Pizza Fraction Baker 🍕</h3>
                    <p className="text-base font-bold text-brand-secondary">
                      Can you color exactly <span className="underline">{pizzaTargetFraction.num}/{pizzaTargetFraction.den}</span> of the pizza red?
                    </p>
                  </div>

                  <div className="flex justify-center items-center my-6">
                    {/* SVG Circular Pizza divided into denominator segments */}
                    <div className="w-56 h-56 rounded-full border-4 border-amber-500 bg-amber-100 relative overflow-hidden shadow-md">
                      {Array.from({ length: pizzaSlicesCount }).map((_, idx) => {
                        const angle = 360 / pizzaSlicesCount;
                        const rotate = angle * idx;
                        const isColored = coloredSlices.includes(idx);
                        
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSliceClick(idx)}
                            style={{
                              transform: `rotate(${rotate}deg)`,
                              clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.tan((angle * Math.PI) / 360)}% 0%)`,
                              backgroundColor: isColored ? '#FF6B6B' : 'transparent'
                            }}
                            className="absolute inset-0 border-r border-amber-600/30 origin-center cursor-pointer transition"
                          />
                        );
                      })}
                      {/* Center Pin */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-amber-600 rounded-full border border-amber-800" />
                    </div>
                  </div>

                  <div className="bg-brand-background p-3 rounded-card border mb-4 font-parent">
                    <p className="text-sm text-brand-muted">Colored Slices: <strong className="text-brand-text">{coloredSlices.length} of {pizzaSlicesCount}</strong></p>
                  </div>

                  {!pizzaWon ? (
                    <button
                      onClick={verifyPizzaFraction}
                      className="w-full py-4 bg-brand-secondary text-white font-black text-xl rounded-btn shadow min-h-[56px]"
                    >
                      Bake and Check! 🚀
                    </button>
                  ) : (
                    <div className="text-center">
                      <h4 className="text-2xl font-black text-brand-success">Perfect segment baking! 🌟</h4>
                      <p className="text-brand-success font-black">🪙 Earned +30 coins!</p>
                      <button
                        onClick={startPizzaGame}
                        className="mt-4 px-8 py-3 bg-brand-secondary text-white font-black rounded-btn min-h-[48px]"
                      >
                        Next Pizza segment 🍕
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* GAME 3: Grocery Checkout Render */}
              {/* ------------------------------------------------------------- */}
              {activeGame === 'grocery' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="text-center border-b pb-3 mb-3">
                    <h3 className="text-2xl font-black text-brand-text">Grocery Shop Checkout 🛒</h3>
                    <p className="text-base font-bold text-amber-800">
                      Budget: <span className="underline">₹{groceryBudget}</span> | Required Item: <strong className="text-brand-primary">{groceryTargetItem}</strong>
                    </p>
                  </div>

                  {/* Grocery store shelves */}
                  <div className="grid grid-cols-3 gap-3 my-4">
                    {GROCERY_ITEMS.map((item) => {
                      const isSelected = groceryCart.some(i => i.id === item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleAddRemoveGroceryItem(item)}
                          className={`p-3 border-2 rounded-card text-center cursor-pointer transition shadow-sm ${
                            isSelected ? 'bg-amber-100 border-brand-warning ring-2 ring-amber-300' : 'bg-white border-brand-muted/10 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-3xl block">{item.name.split(' ')[1]}</span>
                          <span className="text-[10px] block font-bold text-brand-text">{item.name.split(' ')[0]}</span>
                          <span className="text-xs font-black text-brand-primary">₹{item.price}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cart tally */}
                  <div className="bg-brand-background p-3 rounded-card border mb-4 font-parent flex justify-between items-center text-sm">
                    <span>
                      Items in cart: <strong>{groceryCart.length}</strong>
                    </span>
                    <span className={groceryCart.reduce((s, i) => s + i.price, 0) > groceryBudget ? 'text-red-500 font-bold' : 'text-brand-success font-bold'}>
                      Total: ₹{groceryCart.reduce((s, i) => s + i.price, 0)} / ₹{groceryBudget}
                    </span>
                  </div>

                  {!groceryFinished ? (
                    <button
                      onClick={checkGroceryBill}
                      className="w-full py-4 bg-brand-warning text-slate-800 font-black text-xl rounded-btn shadow min-h-[56px]"
                    >
                      Checkout Bill 🛒
                    </button>
                  ) : (
                    <div className="text-center py-4">
                      {grocerySuccess ? (
                        <>
                          <span className="text-5xl block animate-bounce">🎉</span>
                          <h4 className="text-2xl font-black text-brand-success mt-2">Nice Checkout!</h4>
                          <p className="text-xs text-brand-muted">You bought the target item and stayed under budget!</p>
                          <p className="text-brand-success font-black mt-2">🪙 Earned +40 coins!</p>
                        </>
                      ) : (
                        <>
                          <span className="text-5xl block">😢</span>
                          <h4 className="text-2xl font-black text-brand-error mt-2">Oops! Bill Rejected.</h4>
                          <p className="text-xs text-brand-muted">Check if you overspent or forgot the required item.</p>
                        </>
                      )}
                      <button
                        onClick={startGroceryGame}
                        className="mt-6 px-8 py-3 bg-brand-warning text-slate-800 font-black rounded-btn min-h-[48px]"
                      >
                        Play Again 🔄
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* GAME 4: Math Bingo Multiplayer Render */}
              {/* ------------------------------------------------------------- */}
              {activeGame === 'bingo' && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="text-center border-b pb-2 mb-2">
                    <h3 className="text-2xl font-black text-brand-text">Multiplayer Math Bingo 🔢</h3>
                  </div>

                  {bingoLobbyMessage ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                      <span className="text-5xl block animate-pulse">👥</span>
                      <p className="text-base font-black text-brand-text mt-4">{bingoLobbyMessage}</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-between">
                      {/* Scoreboard */}
                      <div className="flex justify-between items-center bg-slate-50 border p-2.5 rounded-btn text-xs font-parent font-bold mb-3">
                        {bingoPlayers.map((player) => (
                          <div key={player.id} className="text-center">
                            <span className="block text-brand-muted truncate max-w-[80px]">{player.name}</span>
                            <span className="text-brand-primary">{player.score} pts</span>
                          </div>
                        ))}
                      </div>

                      {/* Question panel */}
                      {!bingoOver && bingoQuestion && (
                        <div className="bg-brand-background p-3 rounded-card border-2 border-purple-300 text-center mb-3">
                          <h4 className="text-lg font-black text-purple-700">{bingoQuestion.text}</h4>
                          <div className="flex justify-center gap-2 mt-2">
                            {bingoQuestion.choices.map((choice) => (
                              <button
                                key={choice}
                                onClick={() => handleSubmitBingoAnswer(choice)}
                                className="px-5 py-2 bg-white border-2 border-purple-400 hover:bg-purple-50 text-brand-text font-black text-lg rounded-btn min-h-[45px]"
                              >
                                {choice}
                              </button>
                            ))}
                          </div>
                          {bingoFeedback && (
                            <p className="text-xs font-black text-purple-600 mt-1">{bingoFeedback}</p>
                          )}
                        </div>
                      )}

                      {/* Bingo Board Grid (3x3) */}
                      {!bingoOver && (
                        <div className="grid grid-cols-3 gap-2 w-48 h-48 mx-auto my-2">
                          {bingoBoard.map((row, rIdx) =>
                            row.map((cell, cIdx) => {
                              const isMarked = bingoMarked[rIdx][cIdx];
                              return (
                                <div
                                  key={`${rIdx}-${cIdx}`}
                                  className={`border-4 rounded-btn flex items-center justify-center font-black text-xl shadow-sm transition-all ${
                                    isMarked 
                                      ? 'bg-brand-success border-brand-success text-white scale-95 ring-2 ring-green-200' 
                                      : 'bg-white border-slate-200 text-brand-text'
                                  }`}
                                >
                                  {cell}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* Game Over screen */}
                      {bingoOver && (
                        <div className="text-center py-6 flex-1 flex flex-col items-center justify-center">
                          <span className="text-6xl block animate-bounce">🏆</span>
                          <h4 className="text-3xl font-black text-purple-700 mt-2">BINGO!</h4>
                          <p className="text-sm font-bold text-brand-text mt-1">Winner: {bingoWinner}</p>
                          <p className="text-xs text-brand-muted mt-1 font-parent">If you won, you received a chest of +80 coins!</p>
                          <button
                            onClick={startBingoGame}
                            className="mt-6 px-8 py-3 bg-purple-500 text-white font-black rounded-btn min-h-[48px]"
                          >
                            Find Another Match 👥
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
