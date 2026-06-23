import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { connectDB } from './config/db';

// Routers
import authRouter from './routes/auth';
import childrenRouter from './routes/children';
import lessonsRouter from './routes/lessons';
import sessionsRouter from './routes/sessions';
import gamificationRouter from './routes/gamification';
import analyticsRouter from './routes/analytics';
import adminRouter from './routes/admin';

// Models / Services
import { ChildProfile } from './models/ChildProfile';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;

// Rate limiting (INV-SEC-04 / Rate limit 100 req/15min)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later' }
});

app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(mongoSanitize()); // Prevent NoSQL Injection (INV-SEC-04)

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'OK' });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/children', childrenRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);

// Math Bingo multiplayer room management state
interface BingoPlayer {
  id: string; // socket.id or bot id
  childId: string;
  name: string;
  isBot: boolean;
  board: number[][]; // 3x3 number grid
  marked: boolean[][]; // 3x3 checked state
  score: number;
}

interface BingoRoom {
  id: string;
  players: BingoPlayer[];
  equations: { question: string; answer: number }[];
  currentQuestionIndex: number;
  gameStarted: boolean;
  timer?: NodeJS.Timeout;
}

const activeRooms: Map<string, BingoRoom> = new Map();
let lobbyQueue: { socket: Socket; childId: string; name: string; ageGroup: string }[] = [];

// Helper to generate 3x3 board numbers
function generateBingoBoard(ageGroup: string): number[] {
  const numbers: number[] = [];
  const max = ageGroup === '3-4' ? 10 : ageGroup === '5-6' ? 20 : 30;
  while (numbers.length < 9) {
    const num = Math.floor(Math.random() * max) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers;
}

// Helper to make simple equations corresponding to numbers
function generateEquationFor(num: number): string {
  const operations = ['+', '-'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  if (op === '+') {
    const a = Math.floor(Math.random() * num);
    const b = num - a;
    return `${a} + ${b}`;
  } else {
    const b = Math.floor(Math.random() * 10) + 1;
    const a = num + b;
    return `${a} - ${b}`;
  }
}

function checkBingo(marked: boolean[][]): boolean {
  // Check rows
  for (let r = 0; r < 3; r++) {
    if (marked[r][0] && marked[r][1] && marked[r][2]) return true;
  }
  // Check columns
  for (let c = 0; c < 3; c++) {
    if (marked[0][c] && marked[1][c] && marked[2][c]) return true;
  }
  // Check diagonals
  if (marked[0][0] && marked[1][1] && marked[2][2]) return true;
  if (marked[0][2] && marked[1][1] && marked[2][0]) return true;

  return false;
}

// Socket io handlers
io.on('connection', (socket: Socket) => {
  console.log('User connected to socket:', socket.id);

  socket.on('game:join', (data: { childId: string; name: string; ageGroup: string }) => {
    // Add to queue
    lobbyQueue.push({ socket, childId: data.childId, name: data.name, ageGroup: data.ageGroup });
    console.log(`Lobby size: ${lobbyQueue.length}`);

    // If queue is enough or check timer triggers
    if (lobbyQueue.length >= 2) {
      startNewBingoGame();
    } else {
      // Start a countdown to force start with bots
      setTimeout(() => {
        if (lobbyQueue.find(item => item.socket.id === socket.id)) {
          startNewBingoGame();
        }
      }, 3000);
    }
  });

  socket.on('game:answer', (data: { roomId: string; answer: number }) => {
    const room = activeRooms.get(data.roomId);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const currentEquation = room.equations[room.currentQuestionIndex];
    if (currentEquation && data.answer === currentEquation.answer) {
      // Correct! Mark board
      let markedIdx = -1;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (player.board[r][c] === data.answer && !player.marked[r][c]) {
            player.marked[r][c] = true;
            markedIdx = r * 3 + c;
            player.score += 10;
          }
        }
      }

      if (markedIdx !== -1) {
        // Emit correct event to socket
        socket.emit('game:feedback', { correct: true, score: player.score, markedIndex: markedIdx });
        
        // Broadcast game:status to room
        io.to(room.id).emit('game:status', {
          players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score }))
        });

        // Check for Bingo Win
        if (checkBingo(player.marked)) {
          // Award coins in DB if player is real child
          ChildProfile.findByIdAndUpdate(player.childId, { $inc: { coins: 100 } }).catch(console.error);
          
          io.to(room.id).emit('game:over', { winner: player.name, isWinner: true });
          if (room.timer) clearInterval(room.timer);
          activeRooms.delete(room.id);
          return;
        }

        // Advance to next question
        advanceBingoQuestion(room);
      }
    } else {
      socket.emit('game:feedback', { correct: false });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    lobbyQueue = lobbyQueue.filter(item => item.socket.id !== socket.id);
    
    // Clean up room if player left
    for (const [roomId, room] of activeRooms.entries()) {
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.filter(p => !p.isBot).length === 0) {
          // If no human left, delete room
          if (room.timer) clearInterval(room.timer);
          activeRooms.delete(roomId);
          console.log(`Bingo room ${roomId} deleted, no humans left`);
        }
      }
    }
  });
});

function startNewBingoGame() {
  if (lobbyQueue.length === 0) return;

  const roomId = `room-${Date.now()}`;
  const roomPlayers: BingoPlayer[] = [];

  // 1. Add humans in queue (up to 4)
  const queueToJoin = lobbyQueue.splice(0, 4);
  const ageGroup = queueToJoin[0]?.ageGroup || '5-6';

  queueToJoin.forEach(item => {
    const rawBoard = generateBingoBoard(ageGroup);
    const board: number[][] = [
      [rawBoard[0], rawBoard[1], rawBoard[2]],
      [rawBoard[3], rawBoard[4], rawBoard[5]],
      [rawBoard[6], rawBoard[7], rawBoard[8]]
    ];
    
    roomPlayers.push({
      id: item.socket.id,
      childId: item.childId,
      name: item.name,
      isBot: false,
      board,
      marked: [
        [false, false, false],
        [false, false, false],
        [false, false, false]
      ],
      score: 0
    });

    item.socket.join(roomId);
  });

  // 2. Add fallback bot players to make it 4 players
  const botNames = ['Owl Bot 🦉', 'Smart Cat 🐱', 'Math Monkey 🐵', 'Number Bear 🐻'];
  let botIdx = 0;
  while (roomPlayers.length < 4) {
    const rawBoard = generateBingoBoard(ageGroup);
    const board: number[][] = [
      [rawBoard[0], rawBoard[1], rawBoard[2]],
      [rawBoard[3], rawBoard[4], rawBoard[5]],
      [rawBoard[6], rawBoard[7], rawBoard[8]]
    ];

    roomPlayers.push({
      id: `bot-${botIdx}-${Date.now()}`,
      childId: '',
      name: botNames[botIdx],
      isBot: true,
      board,
      marked: [
        [false, false, false],
        [false, false, false],
        [false, false, false]
      ],
      score: 0
    });
    botIdx++;
  }

  // 3. Generate Bingo Equations corresponding to the board cells
  // We want to ask equations that equal the cells of the players' boards
  const answersPool: number[] = [];
  roomPlayers.forEach(p => {
    p.board.forEach(row => {
      row.forEach(cell => {
        if (!answersPool.includes(cell)) {
          answersPool.push(cell);
        }
      });
    });
  });

  // Shuffle answers pool and create equations
  const shuffledPool = answersPool.sort(() => 0.5 - Math.random());
  const equations = shuffledPool.map(ans => ({
    question: `What is ${generateEquationFor(ans)}?`,
    answer: ans
  }));

  const room: BingoRoom = {
    id: roomId,
    players: roomPlayers,
    equations,
    currentQuestionIndex: 0,
    gameStarted: true
  };

  activeRooms.set(roomId, room);

  // 4. Emit starting data
  queueToJoin.forEach((item, index) => {
    const p = roomPlayers.find(player => player.id === item.socket.id);
    item.socket.emit('game:started', {
      roomId: room.id,
      board: p?.board,
      players: roomPlayers.map(player => ({ id: player.id, name: player.name, score: player.score }))
    });
  });

  // 5. Send first question
  sendBingoQuestion(room);

  // 6. Start Bot simulation intervals
  room.timer = setInterval(() => {
    simulateBotMoves(room);
  }, 4000);
}

function sendBingoQuestion(room: BingoRoom) {
  const currentEq = room.equations[room.currentQuestionIndex];
  if (!currentEq) {
    // If we run out of equations without a Bingo
    io.to(room.id).emit('game:over', { winner: 'No one, game drawn!', isWinner: false });
    if (room.timer) clearInterval(room.timer);
    activeRooms.delete(room.id);
    return;
  }

  // Generate incorrect choices
  const wrongChoices = new Set<number>();
  while (wrongChoices.size < 3) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const choice = currentEq.answer + offset;
    if (choice > 0 && choice !== currentEq.answer) {
      wrongChoices.add(choice);
    }
  }

  const choices = Array.from(wrongChoices);
  choices.push(currentEq.answer);
  choices.sort(() => 0.5 - Math.random()); // shuffle choices

  io.to(room.id).emit('game:question', {
    questionText: currentEq.question,
    choices,
    index: room.currentQuestionIndex
  });
}

function advanceBingoQuestion(room: BingoRoom) {
  room.currentQuestionIndex++;
  sendBingoQuestion(room);
}

function simulateBotMoves(room: BingoRoom) {
  const currentEq = room.equations[room.currentQuestionIndex];
  if (!currentEq) return;

  // Let each bot have a chance to answer correctly
  // Bots have a 25% chance of making a move every tick
  for (const player of room.players) {
    if (player.isBot && Math.random() < 0.25) {
      // Find if this answer exists on the bot's board
      let found = false;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (player.board[r][c] === currentEq.answer && !player.marked[r][c]) {
            player.marked[r][c] = true;
            player.score += 10;
            found = true;
            break;
          }
        }
        if (found) break;
      }

      if (found) {
        console.log(`Bot ${player.name} marked ${currentEq.answer}`);
        io.to(room.id).emit('game:status', {
          players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score }))
        });

        if (checkBingo(player.marked)) {
          io.to(room.id).emit('game:over', { winner: player.name, isWinner: false });
          if (room.timer) clearInterval(room.timer);
          activeRooms.delete(room.id);
          return;
        }

        advanceBingoQuestion(room);
        break; // Only one player/bot marks per question
      }
    }
  }
}

// Connect database and start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Express API Server running on port ${PORT}`);
    console.log(`Socket.io Server initialized on same port`);
  });
});
