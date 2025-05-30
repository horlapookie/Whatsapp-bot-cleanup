import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  getContentType,
  jidNormalizedUser,
} from "@whiskeysockets/baileys";

import pino from "pino";
import fs from "fs";
import path from "path";
import { readdir } from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsDir = path.join(__dirname, "commands");
const prefix = "$";

const OWNER = "2349122222622";
const modsFile = path.join(__dirname, "data", "mods.json");
const bannedFile = path.join(__dirname, "data", "banned.json");
const groupsFile = path.join(__dirname, "data", "groups.json");

function loadJson(file, def) {
  if (!fs.existsSync(file)) {
    saveJson(file, def);
    return def;
  }
  return JSON.parse(fs.readFileSync(file));
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function saveAll() {
  saveJson(modsFile, MODS);
  saveJson(bannedFile, Array.from(bannedUsers));
  saveJson(groupsFile, groupSettings);
}

let MODS = loadJson(modsFile, [OWNER]);
let bannedUsers = new Set(loadJson(bannedFile, []));
let groupSettings = loadJson(groupsFile, {});
let botEnabled = true;

const logger = pino({ level: "info" });

let sock; // socket instance
let authState;

async function startSock() {
  authState = await useMultiFileAuthState("Success");
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: {
      creds: authState.state.creds,
      keys: makeCacheableSignalKeyStore(authState.state.keys, logger),
    },
    logger,
    browser: ["Ubuntu", "Chrome", "20.0"],
  });

  sock.ev.on("creds.update", authState.saveCreds);

  // Load commands
  const commands = new Map();
  const files = await readdir(commandsDir);

  console.log("Loading commands...");
  for (const file of files) {
    if (file.endsWith(".js")) {
      const filePath = path.join(commandsDir, file);
      try {
        const cmd = await import(`file://${filePath}`);
        if (cmd.default?.name) {
          commands.set(cmd.default.name, cmd.default);
          console.log(`[LOADED] ${cmd.default.name} from ${file}`);
        } else {
          console.warn(`[SKIPPED] ${file} (no 'name' export)`);
        }
      } catch (err) {
        console.error(`[FAILED] ${file}:`, err.message);
      }
    }
  }
  console.log(`Total loaded commands: ${commands.size}`);

  // Function to check if sender is group admin
  async function isGroupAdmin(groupJid, userJid) {
    try {
      const metadata = await sock.groupMetadata(groupJid);
      const participants = metadata.participants || [];
      const admin = participants.find(
        (p) =>
          jidNormalizedUser(p.id) === jidNormalizedUser(userJid) &&
          (p.admin === "admin" || p.admin === "superadmin")
      );
      return !!admin;
    } catch (err) {
      console.error("Error checking admin status:", err);
      return false;
    }
  }

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    // Determine who sent the message
    const sender = msg.key.participant || msg.key.remoteJid;
    const from = msg.key.remoteJid;

    // Is this a group chat?
    const isGroup = from?.endsWith("@g.us") || false;

    // Normalize sender id (remove device id etc)
    const normalizedSender = jidNormalizedUser(sender);

    // Content type & message text
    const contentType = getContentType(msg.message);
    const body =
      msg.message?.conversation ||
      msg.message[contentType]?.text ||
      msg.message[contentType]?.caption ||
      "";

    const isOwner = normalizedSender === OWNER;
    const isMod = isOwner || MODS.includes(normalizedSender);

    // Check if sender is admin (only if group)
    let isAdmin = false;
    if (isGroup) {
      isAdmin = await isGroupAdmin(from, sender);
    }

    const isCmd = body.startsWith(prefix);
    const [cmdNameRaw, ...args] = body.slice(prefix.length).trim().split(" ");
    const cmdName = cmdNameRaw?.toLowerCase() || "";
    const argStr = args.join(" ");

    if (!botEnabled && !isOwner) return;

    if (bannedUsers.has(normalizedSender) && !isOwner) {
      await sock.sendMessage(
        from,
        { text: "You're banned from using this bot." },
        { quoted: msg }
      );
      return;
    }

    if (isCmd) {
      switch (cmdName) {
        case "addmod":
          if (isOwner) {
            const num = argStr.replace(/\D/g, "");
            if (num && !MODS.includes(num)) {
              MODS.push(num);
              saveAll();
              await sock.sendMessage(
                from,
                { text: `Added moderator: ${num}` },
                { quoted: msg }
              );
            } else {
              await sock.sendMessage(
                from,
                { text: "Invalid or already a mod." },
                { quoted: msg }
              );
            }
          }
          return;
        case "rmmod":
          if (isOwner) {
            const num = argStr.replace(/\D/g, "");
            if (MODS.includes(num)) {
              MODS = MODS.filter((n) => n !== num);
              saveAll();
              await sock.sendMessage(
                from,
                { text: `Removed moderator: ${num}` },
                { quoted: msg }
              );
            } else {
              await sock.sendMessage(
                from,
                { text: "Not a moderator." },
                { quoted: msg }
              );
            }
          }
          return;
        case "mods":
          await sock.sendMessage(
            from,
            { text: `Moderators:\n${MODS.join("\n")}` },
            { quoted: msg }
          );
          return;
        case "ban":
          if (isMod && args[0]) {
            const num = args[0].replace(/\D/g, "");
            if (num !== OWNER && !bannedUsers.has(num)) {
              bannedUsers.add(num);
              saveAll();
              await sock.sendMessage(
                from,
                { text: `Banned ${num}.` },
                { quoted: msg }
              );
            } else {
              await sock.sendMessage(
                from,
                { text: "Cannot ban owner or already banned." },
                { quoted: msg }
              );
            }
          }
          return;
        case "unban":
          if (isMod && args[0]) {
            const num = args[0].replace(/\D/g, "");
            if (bannedUsers.has(num)) {
              bannedUsers.delete(num);
              saveAll();
              await sock.sendMessage(
                from,
                { text: `Unbanned ${num}.` },
                { quoted: msg }
              );
            } else {
              await sock.sendMessage(
                from,
                { text: "User not banned." },
                { quoted: msg }
              );
            }
          }
          return;
        case "nsfw":
          if (!isGroup && !isMod) {
            await sock.sendMessage(
              from,
              { text: "NSFW commands can only be used in groups." },
              { quoted: msg }
            );
            return;
          }
          const nsfwCmd = commands.get("nsfw");
          if (nsfwCmd) {
            try {
              await nsfwCmd.execute(msg, {
                sock,
                args,
                isOwner,
                isMod,
                isGroup,
                groupSettings,
                bannedUsers,
              });
            } catch (err) {
              console.error("Error executing nsfw command:", err);
              await sock.sendMessage(
                from,
                { text: "Error executing command." },
                { quoted: msg }
              );
            }
          }
          return;
        case "on":
          if (isOwner) {
            botEnabled = true;
            await sock.sendMessage(
              from,
              { text: "Bot is now active." },
              { quoted: msg }
            );
          }
          return;
        case "off":
          if (isOwner) {
            botEnabled = false;
            await sock.sendMessage(
              from,
              { text: "Bot is now disabled." },
              { quoted: msg }
            );
          }
          return;
      }

      // Check command in commands map
      const command = commands.get(cmdName);
      if (command) {
        if (command.ownerOnly && !isOwner) return;
        if (command.modOnly && !isMod) return;

        // If command has adminOnly flag, check group admin
        if (command.adminOnly && (!isGroup || !isAdmin)) return;

        try {
          await command.execute(msg, {
            sock,
            args,
            isOwner,
            isMod,
            isAdmin,
            isGroup,
            groupSettings,
            bannedUsers,
          });
        } catch (err) {
          console.error(`Error executing ${cmdName}:`, err);
          await sock.sendMessage(
            from,
            { text: "Error executing command." },
            { quoted: msg }
          );
        }
      } else {
        await sock.sendMessage(
          from,
          {
            text: `Unknown command: ${cmdName}\nType ${prefix}help to see all commands.`,
          },
          { quoted: msg }
        );
      }
    }
  });

  // Group welcome messages
  sock.ev.on("group-participants.update", async (update) => {
    const { id, participants, action } = update;
    const group = groupSettings[id] || {};

    if (action === "add" && participants.includes(sock.user.id)) {
      groupSettings[id] = { welcome: true };
      saveAll();
      await sock.sendMessage(id, {
        text: "Thanks for adding me!\n\nWelcome feature is enabled.",
      });
      return;
    }

    if (!group.welcome) return;
    for (const participant of participants) {
      const tag = `@${participant.split("@")[0]}`;
      if (action === "add") {
        await sock.sendMessage(id, { text: `Welcome ${tag}`, mentions: [participant] });
      } else if (action === "remove") {
        await sock.sendMessage(id, { text: `We won't miss you ${tag}`, mentions: [participant] });
      }
    }
  });

  // Reconnect & connection updates
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    console.log("Connection update:", connection);

    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401; // 401 = logged out
      console.log(
        `Disconnected. Reconnect: ${shouldReconnect}, Reason: ${
          lastDisconnect?.error?.output?.payload?.reason || "Unknown"
        }`
      );

      if (shouldReconnect) {
        startSock().catch((err) => console.error("Reconnect failed:", err));
      }
    } else if (connection === "open") {
      console.log("Connected!");
    }
  });

  return sock;
}

startSock().catch((err) => console.error("Failed to start sock:", err));
