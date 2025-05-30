import { duels, getUserData, saveAll, leaderboard } from "./duelData.js";
import { v4 as uuidv4 } from "uuid";

export function startDuel(challengerId, targetId) {
  const challenger = getUserData(challengerId);
  const target = getUserData(targetId);

  // Prevent starting duel if already in a duel
  if (getDuelByUser(challengerId) || getDuelByUser(targetId)) return false;

  const duelId = uuidv4();

  duels[duelId] = {
    id: duelId,
    challengerId,
    opponent: targetId,
    turn: challengerId,
    hp1: challenger.hp,
    hp2: target.hp,
    status: "pending", // pending until accepted
    log: [],
  };

  saveAll();
  return duelId;
}

export function getDuelByUser(userId) {
  for (const duelId in duels) {
    const duel = duels[duelId];
    if (duel.challengerId === userId || duel.opponent === userId) {
      return { duelId, challengerId: duel.challengerId, duel };
    }
  }
  return null;
}

export function attack(userId, moveName) {
  const duelEntry = getDuelByUser(userId);
  if (!duelEntry) return { error: "You're not in a duel." };

  const { duelId, challengerId, duel } = duelEntry;

  if (duel.status !== "active") return { error: "Duel is not active." };
  if (duel.turn !== userId) return { error: "It's not your turn." };

  const user = getUserData(userId);
  const opponentId = userId === challengerId ? duel.opponent : challengerId;
  const opponent = getUserData(opponentId);

  const move = user.moves.find((m) => m.name.toLowerCase() === moveName.toLowerCase());
  if (!move || move.type !== "attack") return { error: "Invalid attack move." };

  // Calculate damage with elemental advantage
  const baseDamage = Math.floor(Math.random() * 21) + 10; // 10-30 damage
  const multiplier = getDamageMultiplier(user.ability, opponent.ability);
  const damage = Math.floor(baseDamage * multiplier);

  if (userId === challengerId) {
    duel.hp2 -= damage;
    if (duel.hp2 < 0) duel.hp2 = 0;
  } else {
    duel.hp1 -= damage;
    if (duel.hp1 < 0) duel.hp1 = 0;
  }

  duel.log.push(`${userId} used ${move.name}, dealing ${damage} damage!`);

  // Check win condition
  if (duel.hp1 <= 0 || duel.hp2 <= 0) {
    duel.status = "ended";
    duel.winner = userId;
    leaderboard[userId] = (leaderboard[userId] || 0) + 1;
    saveAll();
    return {
      move,
      damage,
      attacker: userId,
      defender: opponentId,
      hp1: duel.hp1,
      hp2: duel.hp2,
      duel,
      winner: userId,
    };
  }

  // Switch turn
  duel.turn = opponentId;
  saveAll();

  return { move, damage, attacker: userId, defender: opponentId, hp1: duel.hp1, hp2: duel.hp2, duel };
}

export function defend(userId, moveName) {
  const duelEntry = getDuelByUser(userId);
  if (!duelEntry) return { error: "You're not in a duel." };

  const { duelId, challengerId, duel } = duelEntry;

  if (duel.status !== "active") return { error: "Duel is not active." };
  if (duel.turn !== userId) return { error: "It's not your turn." };

  const user = getUserData(userId);

  const move = user.moves.find((m) => m.name.toLowerCase() === moveName.toLowerCase());
  if (!move || move.type !== "defend") return { error: "Invalid defend move." };

  // Heal amount between 5-15 HP
  const heal = Math.floor(Math.random() * 11) + 5;

  if (userId === challengerId) {
    duel.hp1 += heal;
    if (duel.hp1 > 100) duel.hp1 = 100; // max HP cap
  } else {
    duel.hp2 += heal;
    if (duel.hp2 > 100) duel.hp2 = 100;
  }

  duel.log.push(`${userId} used ${move.name}, healing ${heal} HP!`);

  // Switch turn
  const opponentId = userId === challengerId ? duel.opponent : challengerId;
  duel.turn = opponentId;

  saveAll();

  return { move, defense: heal, attacker: userId, defender: opponentId, hp1: duel.hp1, hp2: duel.hp2, duel };
}

export function forfeitDuel(userId) {
  const duelEntry = getDuelByUser(userId);
  if (!duelEntry) return false;

  const { duelId, challengerId, duel } = duelEntry;
  const winnerId = duel.challengerId === userId ? duel.opponent : duel.challengerId;

  leaderboard[winnerId] = (leaderboard[winnerId] || 0) + 1;

  delete duels[duelId];
  saveAll();

  return winnerId;
}

export function endDuel(userId) {
  const duelEntry = getDuelByUser(userId);
  if (!duelEntry) return false;
  const { duelId } = duelEntry;
  delete duels[duelId];
  saveAll();
  return true;
}

// Elemental advantage helper
const advantageMap = {
  fire: "earth",
  earth: "air",
  air: "water",
  water: "fire",
};

function getDamageMultiplier(attackerAbility, defenderAbility) {
  return advantageMap[attackerAbility] === defenderAbility ? 1.2 : 1.0;
}
