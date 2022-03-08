const mineflayer = require("mineflayer");
const Movements = require("mineflayer-pathfinder").Movements;
const pathfinder = require("mineflayer-pathfinder").pathfinder;
const { GoalBlock } = require("mineflayer-pathfinder").goals;

const config = require("./settings.json");

function countDown(number) {
  console.log("Is about to connect the server again in " + number + " seconds.");
  if (number > 1) {
      setTimeout(function(){
        countDown(number - 10);
      }, 10000)
  } else {
    console.log("\nConnect the server.\n");
  }
}

function createBot() {
  const bot = mineflayer.createBot({
    username: config["bot-account"]["username"],
    password: config["bot-account"]["password"],
    auth: config["bot-account"]["type"],
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version,
  });

  bot.loadPlugin(pathfinder);
  const mcData = require("minecraft-data")(bot.version);
  const defaultMove = new Movements(bot, mcData);
  bot.settings.colorsEnabled = false;

  bot.once("spawn", function () {
    var name = config["bot-account"]["username"];
    console.log("\x1b[33m[BotLog] " + name + " joined to the server", "\x1b[0m");

    if (config.utils["auto-auth"].enabled) {
      console.log("[INFO] Started auto-auth module");

      var password = config.utils["auto-auth"].password;
      setTimeout(function () {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
      }, 500);

      console.log(`[Auth] Authentification commands executed.`)
    }

    if (config.utils["chat-messages"].enabled) {
      console.log("[INFO] Started chat-messages module");
      var messages = config.utils["chat-messages"]["messages"];

      if (config.utils["chat-messages"].repeat) {
        var delay = config.utils["chat-messages"]["repeat-delay"];
        let i = 0;

        let msg_timer = setInterval(() => {
          bot.chat(`${messages[i]}`);

          if (i + 1 == messages.length) {
            i = 0;
          } else i++;
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
      bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
    }

    if (config.utils["anti-afk"].enabled) {
      bot.setControlState("jump", true);
      if (config.utils["anti-afk"].sneak) {
        bot.setControlState("sneak", true);
      }
    }
  });

  bot.on("chat", function (username, message) {
    if (config.utils["chat-log"]) {
      console.log(`[แชท] <${username}> ${message}`);
    }
  });

  bot.on("goal_reached", function () {
    console.log(
      `\x1b[32m[BotLog] Bot arrived to target location. ${bot.entity.position}\x1b[0m`
    );
  });

  bot.on("death", function () {
    console.log(
      `\x1b[33m[BotLog] Bot has been died and was respawned ${bot.entity.position}`,
      "\x1b[0m"
    );
  });

  if (config.utils["auto-reconnect"]) {
    bot.on("end", function () {
        
      // console.log("\nกำลังจะเชื่อมต่อเซิร์ฟเวอร์ในอีก");
      var rdelay = config.utils["delay"];
      console.log("Is about to connect the server again in " + rdelay + " seconds");
      setTimeout(function () {
        createBot();
      }, rdelay * 1000);

      // status(config.server.ip, config.server.port, (response) => {
      //   if ((response.status == true)) {
      //     console.log("เซิร์ฟเวอร์ออนไลน์");
      //     createBot();
      //   } else {
      //     console.log("\x1b[31m",`เซิร์ฟเวอร์ออฟไลน์`,"\x1b[0m");
      //     console.log("กำลังจะเชื่อมต่อเซิร์ฟเวอร์ในอีก " + rdelay + " วินาที");
      //     // countDown(rdelay);
          
      //   }
      // });
      
    })
  }

  bot.on('kicked', (reason) => console.log('\x1b[33m',`[BotLog] Bot was kicked from the server. Reason: \n${reason}`, '\x1b[0m'))
  
  bot.on("error", (err) =>
    console.log(`\x1b[31m[เชื่อมต่อล้มเหลว] ${err.message}\n`, "\x1b[0m")
  );
}

createBot();
