const mineflayer = require("mineflayer");
const Movements = require("mineflayer-pathfinder").Movements;
const pathfinder = require("mineflayer-pathfinder").pathfinder;
const { GoalBlock } = require("mineflayer-pathfinder").goals;

const config = require("./settings.json");

function countDown(number) {
  console.log("Is about to connect the server again in " + number + " seconds");
  if (number > 0) {
    setTimeout(function () {
      countDown(number - 10);
    }, 10000);
  }
}

function countDownMinutes(numberM) {
  console.log(
    "The bots will disconnect from the server in " +
      numberM / 60 / 60 +
      " hours"
  );
  if (numberM > 0) {
    setTimeout(function () {
      countDownMinutes(numberM - 600);
    }, 600000);
  }
}

function disconnectBot() {
  const timeout = config.utils["timeout"];
  countDownMinutes(timeout);
  setTimeout(function () {
    console.log("The bots have been disconnected");
    process.exit();
  }, timeout * 1000);
}

function createBot() {
  // Initialize bot settings as an empty object
  const bot = {
    settings: {},
    username: config["bot-account"]["username"],
    password: config["bot-account"]["password"],
    auth: config["bot-account"]["type"],
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version,
  };

  bot.loadPlugin(pathfinder);
  const mcData = require("minecraft-data")(bot.version);
  const defaultMove = new Movements(bot, mcData);

  // Set colorsEnabled after bot settings initialization
  bot.settings.colorsEnabled = false;

  bot.once("spawn", function () {
    const name = config["bot-account"]["username"];
    console.log("\x1b[33m[BotLog] " + name + " joined to the server", "\x1b[0m");

    if (config.utils["auto-auth"].enabled) {
      console.log("[INFO] Started auto-auth module");

      const password = config.utils["auto-auth"].password;
      setTimeout(function () {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
      }, 500);

      console.log(`[Auth] Authentification commands executed.`);
      // Optional: Memory usage logging (commented out)
      // const used = process.memoryUsage().heapUsed / 1024 / 1024;
      // console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB\n`);

      // Call disconnectBot if auto-auth is enabled
      disconnectBot();
    }

    if (config.utils["chat-messages"].enabled) {
      console.log("[INFO] Started chat-messages module");
      const messages = config.utils["chat-messages"]["messages"];

      if (config.utils["chat-messages"].repeat) {
        const delay = config.utils["chat-messages"]["repeat-delay"];
        let i = 0;

        const msg_timer = setInterval(() => {
          bot.chat(`${messages[i]}`);

          if (i + 1 === messages.length) {
            i = 0;
          } else {
            i++;
          }
        }, delay * 1000);
      } else {
        messages.forEach(function (msg) {
          bot.chat(msg);
        });
      }
    }

    const pos = config.position;

    if (config.position.enabled) {
      console.log(
        `\x1b[32m[BotLog] Starting moving to target location (${pos.x}, ${pos.y}, ${pos.z})\x1b[0m`
      );
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new GoalBlock(pos.x
