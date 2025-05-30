import fs from "fs";
import path from "path";

const DATA_FILE = path.join("./", "duelData.json");

// Load duel data from file or create initial empty data
let duelData = { users: {}, duels: {}, leaderboard: {} };

try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    duelData = JSON.parse(raw);
  }
} catch (e) {
  console.error("Error loading duel data:", e);
}

// Save duel data to file
export function saveAll() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(duelData, null, 2));
  } catch (e) {
    console.error("Error saving duel data:", e);
  }
}

// Get or create user data
export function getUserData(userId) {
  if (!duelData.users[userId]) {
    duelData.users[userId] = {
      wins: 0,
      losses: 0,
      hp: 100,
      isInDuel: false,
      duelId: null,
    };
  }
  return duelData.users[userId];
}

// Start a duel between two users
export function startDuel(user1, user2) {
  const userData1 = getUserData(user1);
  const userData2 = getUserData(user2);

  // Check if either user is already in duel
  if (userData1.isInDuel || userData2.isInDuel) {
    return null; // Cannot start duel, one is busy
  }

  const duelId = Date.now().toString();

  // Initialize duel state
  duelData.duels[duelId] = {
    players: {
      [user1]: { hp: 100, defending: false },
      [user2]: { hp: 100, defending: false },
    },
    turn: user1, // user1 starts
    winner: null,
    isActive: true,
  };

  // Mark users as in duel
  userData1.isInDuel = true;
  userData1.duelId = duelId;
  userData2.isInDuel = true;
  userData2.duelId = duelId;

  saveAll();

  return duelId;
}

// Get duel by user ID
export function getDuelByUser(userId) {
  const user = getUserData(userId);
  if (!user.isInDuel) return null;
  return duelData.duels[user.duelId] || null; // Defensive: duel might be missing
}

// Attack action
export function attack(userId) {
  const user = getUserData(userId);
  if (!user.isInDuel) return { error: "You are not in a duel." };

  const duel = getDuelByUser(userId);
  if (!duel || !duel.isActive) return { error: "No active duel found." };

  if (duel.turn !== userId) return { error: "It's not your turn." };

  // Find opponent ID
  const opponentId = Object.keys(duel.players).find((id) => id !== userId);
  if (!opponentId) return { error: "Opponent not found." }; // Defensive check

  const attacker = duel.players[userId];
  const defender = duel.players[opponentId];

  // Calculate damage
  let damage = Math.floor(Math.random() * 21) + 10; // 10-30 damage

  if (defender.defending) {
    damage = Math.floor(damage / 2); // damage halved if defending
  }

  defender.hp -= damage;

  // Reset defending status
  defender.defending = false;

  // Check if defender is defeated
  if (defender.hp <= 0) {
    defender.hp = 0;
    duel.isActive = false;
    duel.winner = userId;

    // Update leaderboard & user stats
    duelData.users[userId].wins++;
    duelData.users[userId].isInDuel = false;
    duelData.users[userId].duelId = null;

    duelData.users[opponentId].losses++;
    duelData.users[opponentId].isInDuel = false;
    duelData.users[opponentId].duelId = null;

    if (!duelData.leaderboard[userId]) duelData.leaderboard[userId] = 0;
    duelData.leaderboard[userId]++;

    saveAll();

    return {
      success: true,
      message: `You attacked and dealt ${damage} damage! ${opponentId} has been defeated!`,
      winner: userId,
    };
  }

  // Switch turn
  duel.turn = opponentId;
  saveAll();

  return {
    success: true,
    message: `You attacked and dealt ${damage} damage! Opponent has ${defender.hp} HP left.`,
  };
}

// Defend action
export function defend(userId) {
  const user = getUserData(userId);
  if (!user.isInDuel) return { error: "You are not in a duel." };

  const duel = getDuelByUser(userId);
  if (!duel || !duel.isActive) return { error: "No active duel found." };

  if (duel.turn !== userId) return { error: "It's not your turn." };

  // Set defending for current player
  duel.players[userId].defending = true;

  // Switch turn
  const opponentId = Object.keys(duel.players).find((id) => id !== userId);
  if (!opponentId) return { error: "Opponent not found." }; // Defensive

  duel.turn = opponentId;

  saveAll();

  return {
    success: true,
    message: "You are defending this turn. Damage from next attack will be halved.",
  };
}

// Forfeit duel
export function forfeitDuel(userId) {
  const user = getUserData(userId);
  if (!user.isInDuel) return { error: "You are not in a duel." };

  const duel = getDuelByUser(userId);
  if (!duel || !duel.isActive) return { error: "No active duel found." };

  const opponentId = Object.keys(duel.players).find((id) => id !== userId);
  if (!opponentId) return { error: "Opponent not found." }; // Defensive

  duel.isActive = false;
  duel.winner = opponentId;

  // Update stats
  duelData.users[opponentId].wins++;
  duelData.users[opponentId].isInDuel = false;
  duelData.users[opponentId].duelId = null;

  duelData.users[userId].losses++;
  duelData.users[userId].isInDuel = false;
  duelData.users[userId].duelId = null;

  if (!duelData.leaderboard[opponentId]) duelData.leaderboard[opponentId] = 0;
  duelData.leaderboard[opponentId]++;

  saveAll();

  return {
    success: true,
    message: `You forfeited the duel. ${opponentId} wins by default.`,
    winner: opponentId,
  };
}

// Get leaderboard (top 10)
export function getLeaderboard() {
  const entries = Object.entries(duelData.leaderboard);
  // Sort descending by wins
  entries.sort((a, b) => b[1] - a[1]);

  // Return top 10
  return entries.slice(0, 10).map(([userId, wins]) => ({ userId, wins }));
}
