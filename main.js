// Imports
const Constants = require("twisted").Constants;
const LolApi = require("twisted").LolApi;

const Discord = require("discord.js");
const fetch = require("node-fetch");
const fs = require('fs');

// env keys
const DISCORD_KEY = process.env.DISCORD_KEY;
const RIOT_KEY = process.env.RIOT_KEY;

const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES"]
}); // not sure what intents does, but the code breaks if I remove it
const prefix = "$";

var dataJSON;
pullJSON();

//add - add the value to the existing score without modifying it
//wins - add but only if game ended in win
//per # - add 1 if the value >= #
const eternals = {
  "Lol Bye.": ["c.blastConeOppositeOpponentCount", "Times hit opponent with blast cone", "add"],
  "yoink": ["c.buffsStolen", "Buffs stolen", "add"],
  "Shelly Travolta": ["c.dancedWithRiftHerald", "Ended game with rift herald", "add"],
  "Discount Collector": ["c.elderDragonKillsWithOpposingSoul", "Elder dragons taken when opposing team has soul", "add"],
  "Jungle Nirvana": ["c.epicMonsterKillsNearEnemyJungler", "Epic monster kills near enemy jungler", "add"],
  "Three Parallel Universes Ahead": ["c.epicMonsterKillsWithin30SecondsOfSpawn", "Epic monster kills within 30 seconds of spawn", "add"],
  "YOINK!": ["c.epicMonsterSteals", "Epic monster steals", "add"],
  "Chiropractor needed": ["c.hadAfkTeammate", "Wins with an afk teammate", "wins"],
  "Didn't need those anyway": ["c.hadOpenNexus", "Wins with an open nexus", "wins"],
  "Jeffery Bezos": ["c.maxCsAdvantageOnLaneOpponent", "Times farm score lead of 50 or more than lane opponent", "per 50"],
  "WHERE IS YOUR GOD NOW?": ["c.maxLevelLeadLaneOpponent", "Times level advantage of 3 or more than lane opponent", "per 3"],
  "Professional House Cleaner": ["c.mostWardsDestroyedOneSweeper", "Times destroyed three or more wards with one sweeper per game", "per 3"],
  "Barry Allen": ["c.multikillsAfterAggressiveFlash", "Multikills after flashing in", "add"],
  "Can't touch this": ["c.outerTurretExecutesBefore10Minutes", "Outer turret executes before 10 minutes", "add"],
  "Unstoppable Force": ["c.outnumberedNexusKill", "Nexus kills with more nearby enemies than allies", "add"],
  "Flame me, I dare you": ["c.perfectDragonSoulsTaken", "Perfect dragon souls taken", "add"],
  "Easy mode": ["c.perfectGame", "Zero death games", "add"],
  "Trust me, I got this": ["c.soloBaronKills", "Solo baron kills", "add"],
  "Not even close": ["c.survivedSingleDigitHpCount", "Survived with single digit health points", "add"],
  "Alcove Gaming": ["c.takedownsInAlcove", "Takedowns in alcove", "add"],
  "Dangerous game": ["c.takedownsInEnemyFountain", "Takedowns in enemy fountain", "add"],
  "Hobbit nuke": ["c.twentyMinionsIn3SecondsCount", "Times killed 20 minions within 3 seconds", "add"],
  "Mission Impossible": ["c.visionScoreAdvantageLaneOpponent", "Times vision score of 15 or more than lane opponent", "per 15"], //bad name
  "YOU SHALL NOT PASS": ["c.wardsGuarded", "Wards guarded", "add"],
  "Blood in the water": ["firstBloodKill", "First bloods", "add"],
  "Early bird": ["gameEndedInEarlySurrender", "Wins by early surrender", "wins"],
  "Royal Flush": ["pentaKills", "Pentakills", "add"],
  "You might as well make some tea": ["timeCCingOthers", "Time CCing others", "add"],
  "Colourblind Simulator": ["totalTimeSpentDead", "Total time spent dead", "add"]
}

// copied from twisted riot-api library github page
const api = new LolApi({
  /**
   * If api response is 429 (rate limits) try reattempt after needed time (default true)
   */
  rateLimitRetry: true,
  /**
   * Number of time to retry after rate limit response (default 1)
   */
  rateLimitRetryAttempts: 1,
  /**
   * Concurrency calls to riot (default infinity)
   * Concurrency per method (example: summoner api, match api, etc)
   */
  concurrency: undefined,
  /**
   * Riot games api key
   */
  key: RIOT_KEY,
  /**
   * Debug methods
   */
  debug: {
    /**
     * Log methods execution time (default false)
     */
    logTime: false,
    /**
     * Log urls (default false)
     */
    logUrls: false,
    /**
     * Log when is waiting for rate limits (default false)
     */
    logRatelimit: false
  }
})

//JSON MANIPUlATION
async function pullJSON() {
  await fs.readFile('data.json', (err, data) => {
    if (err) console.log(err);
    dataJSON = JSON.parse(data); //now it's an object
    console.log('dataJSON object updated from data.json');
  });
}

async function pushJSON() {
  let json = JSON.stringify(dataJSON); //convert it to json
  await fs.writeFile('data.json', json, (err) => {
    if (err) console.log(err);
    console.log('dataJSON object written to data.json');
  });
}

async function updateScores() {
  for (const acc in dataJSON.accounts) {
    //for (ci)
  }
}

async function setupJSON() {
  if (dataJSON.accounts == undefined) {
    console.log('accounts not found in data.JSON, making it');
    dataJSON.accounts = {};
    pushJSON();
  }
}

async function setupAccount(account) {
  dataJSON.accounts[account] = {
    "accountId": acc.response.accountId,
    "puuid": acc.response.puuid,
    "name": acc.response.name
  };
  if (dataJSON.accounts[account].eternals == undefined) {
    console.log(`eternals not found for ${account}, making it`);
    dataJSON.accounts[account].eternals = [];
  }
  if (dataJSON.accounts[account].activeEternals == undefined) {
    console.log(`activeEternals not found for ${account}, making it`);
    dataJSON.accounts[account].activeEternals = [];
  }
  const matches = (await api.MatchV5.list(acc.response.puuid, Constants.RegionGroups.AMERICAS)).response;
  dataJSON.accounts[account].calculatedGames = matches;
  console.log(dataJSON.accounts[account].calculatedGames);
  pushJSON();
}

//RIOT API CALLS
async function summonerByName(username) {
  try {
    ret = await api.Summoner.getByName(username, Constants.Regions.AMERICA_NORTH);
  } catch (err) {
    console.log(err);
    return;
  }
  return ret;
}

async function matches(puuid) {
  const matches = (await api.MatchV5.list(puuid, Constants.RegionGroups.AMERICAS)).response;
  console.log(matches[0]);
  console.log("Matchlist length:", matches.length);
  var playerGames = [];
  for (const matchId of matches) {
    const match = (await api.MatchV5.get(matchId, Constants.RegionGroups.AMERICAS)).response;
    for (const player of match["info"]["participants"]) {
      if (player.puuid == puuid) {
        playerGames.push(player);
      }
    }
  }
  return playerGames;
}

//bottom half of matches() to reduce api calls
async function playerGames(matches, puuid) {
  var playerGames = [];
  for (const matchId of matches) {
    const match = (await api.MatchV5.get(matchId, Constants.RegionGroups.AMERICAS)).response;
    for (const player of match["info"]["participants"]) {
      if (player.puuid == puuid) {
        playerGames.push(player);
      }
    }
  }
  return playerGames;
}

//DONT FORGET: convert true bool value to 1 int value
function eternalsMath(stat, key, win) {
  if (stat == undefined) {
    console.log(key, "stat is undefined");
    return 0;
  } else if (stat == true) {
    stat = 1;
  } else if (stat == false) {
    stat = 0;
  }
  if (eternals[key][2] == "add") {
    console.log("add", key, stat, win);
    return stat;
  } else if (eternals[key][2].startsWith("per")) {
    console.log("per", key, stat, win);
    let num = parseInt(eternals[key][2].split(' ')[1]);
    if (stat >= num) {
      return 1;
    }
    return 0;
  } else if (eternals[key][2] == "wins") {
    console.log("wins", key, stat, win);
    if (win) {
      return 1;
    }
    return 0;
  }
  console.log("eternal condition not recognized for", key)
}

async function calculateEternals(acc) {
  console.log('calculating eternals for',dataJSON.accounts[acc].name);
  var matches = (await api.MatchV5.list(dataJSON.accounts[acc].puuid, Constants.RegionGroups.AMERICAS)).response;

  let i = matches.length;
  while (i--) {
    if (dataJSON.accounts[acc].calculatedGames.indexOf(matches[i]) != -1){
      matches.splice(i, 1);
    }
  }

  var games = await playerGames(matches, dataJSON.accounts[acc].puuid);

  for (let game of games) {
    for (let key of dataJSON.accounts[acc].activeEternals){
      for (let log of dataJSON.accounts[acc].eternals){
        if (log.name == key) {
          var eternalIndex = dataJSON.accounts[acc].eternals.indexOf(log);
        }
      }
      if (game.challenges != undefined){
        if (eternals[key][0].startsWith('c.')) {
          let a_key = eternals[key][0].substr(2);
          dataJSON.accounts[acc].eternals[eternalIndex].score += eternalsMath(game.challenges[a_key], key, game.win);
        } else {
          let old = dataJSON.accounts[acc].eternals[eternalIndex].score
          dataJSON.accounts[acc].eternals[eternalIndex].score += eternalsMath(game[eternals[key][0]], key, game.win);
        }
      }
    }
  }
  dataJSON.accounts[acc].calculatedGames.push(...matches);
  pushJSON();
}

//Math
async function calculateLevel(puuid) {

}

//Rewards
async function updateRole() {
  //var roleManager = new Discord.GuildMemberRoleManager()
  var low_score = 99999;
  var score_user;
  for (const acc in accounts) {
    if (acc != "inter_role") {
      if (accounts[acc].score < low_score) {
        low_score = accounts[acc].score;
        score_user = acc;
      }
      var guild = client.guilds.cache.get(accounts[acc].guildId);
      var role = guild.roles.cache.find(r => r.id === accounts.inter_role.substr(3).slice(0, -1));
      var user = await guild.members.fetch(acc.substr(2).slice(0, -1));
      user.roles.remove(role);
    }
  }
  if (score_user != undefined) {
    try {
      var guild = client.guilds.cache.get(accounts[score_user].guildId);
      var role = guild.roles.cache.find(r => r.id === accounts.inter_role.substr(3).slice(0, -1));
      var user = await guild.members.fetch(score_user.substr(2).slice(0, -1));
      user.roles.add(role);
    } catch (err) {
      console.log(err);
    }
  }
}

//Discord API
client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  setupJSON();
})

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  var commandBody = message.content.slice(prefix.length);
  var args = commandBody.split(' ');
  var command = args.shift().toLowerCase();

  if (command == "help") {
    message.reply(`**$help:** Brings you to this page. Hello!\n\
**$link *[Summoner Name]*:** Links your league account to your discord account in the bot's database.\n\
**$remove:** Removes you from the scoreboard. *THIS WILL PERMENANTLY REMOVE YOUR CURRENT ETERNALS DATA!!!*\n\
**$eternals *[optional: eternal name]*:** Returns a list of eternals and their description, or a specific eternal.\n\
**$set *[eternal name]*:** Begin actively earning points towards the selected eternal.\n\
**$unset *[eternal name]*:** Stop actively earning points towards the selected eternal.\n\
**$active *[optional: eternal name]*:** See what eternals you're actively tracking.\n\
**$myeternals:** List your personal eternal stats, active or not.\n\
**$update:** Updates active eternals from the last 20 games.
`);
  } else if (command == "link") {
    if (dataJSON.accounts[message.author] != undefined) {
      message.reply("You're already linked, delete your current link before you relink");
      message.channel.sendTyping();
      acc = await summonerByName(dataJSON.accounts[message.author].name);
      const accountMessage = await new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle("You're Currently Linked To:")
        .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/12.3.1/img/profileicon/${acc.response.profileIconId}.png`)
        .addFields({
          name: 'Account',
          value: `${acc.response.name}`
        }, {
          name: 'Level',
          value: `${acc.response.summonerLevel}`
        }, {
          name: 'Discord Account',
          value: `${message.author}`
        })
        .setTimestamp()
        .setFooter({
          text: "Expanded Eternals"
        });

      message.channel.send({
        embeds: [accountMessage]
      });
      return;
    }
    if (args.length == 0) {
      message.reply("The 'account' command takes at least one argument!");
      return;
    }
    message.channel.sendTyping();
    acc = await summonerByName(args.join(' '));
    if (acc == null) {
      message.reply("There was a problem finding your account");
      return;
    }

    dataJSON.accounts[message.author] = {};
    setupAccount(message.author);
    //calculateEternals();

    const linkMessage = await new Discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Account Linked Successfully!')
      .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/12.3.1/img/profileicon/${acc.response.profileIconId}.png`)
      .addFields({
        name: 'Account',
        value: `${acc.response.name}`
      }, {
        name: 'Level',
        value: `${acc.response.summonerLevel}`
      }, {
        name: 'Discord Account',
        value: `${message.author}`
      })
      .setTimestamp()
      .setFooter({
        text: "Expanded Eternals"
      });

    message.reply({
      embeds: [linkMessage]
    });
  } else if (command == "remove") {
    delete dataJSON.accounts[message.author];
    message.reply(`${message.author} has been removed from the scoreboard, thanks for playing!`);
    pushJSON();
  } else if (command == "eternals") {
    if (args.length == 0) {
      let list = [];
      for (let i in eternals) {
        list.push(`**${i}:** ${eternals[i][1]}`);
      }
      message.reply("**Eternals**\n" + list.join('\n'));
    } else {
      try {
        message.reply(`**${args.join(' ')}:** ${eternals[args.join(' ')][1]}`);
      } catch {
        message.reply(`'${args}' is not an eternal, check your capitalization and spelling`);
      }
    }
  } else if (command == "set") {
    //test
    if (dataJSON.accounts[message.author] == undefined) {
      message.reply("You're not currently linked, type $help for a list of commands!");
      return;
    }
    if (args.length == 0) {
      message.reply("The 'set' command takes at least one argument!");
      return;
    }
    if (dataJSON.accounts[message.author].activeEternals.length >= 5) {
      message.reply("You're already tracking 5 eternals, remove one before you add another");
      return;
    }
    if (dataJSON.accounts[message.author].activeEternals.includes(args.join(' '))) {
      message.reply(`You're already tracking ${args.join(' ')}`);
      return;
    }
    if (eternals[args.join(' ')] == undefined) {
      message.reply(`${args.join(' ')} isn't a valid eternal`);
      return;
    }
    if (dataJSON.accounts[message.author].eternals.find(obj => {
        return obj.name == args.join(' ')
      }) == undefined) {
      console.log(`no ${args.join(' ')} object found in eternals, adding`);
      let object = {
        "name": args.join(' '),
        "score": 0,
        "level": 0
      };
      dataJSON.accounts[message.author].eternals.push(object);
    }
    dataJSON.accounts[message.author].activeEternals.push(args.join(' '));
    pushJSON();
    message.reply(`Started tracking ${args.join(' ')}`);
    return;
  } else if (command == "unset") {
    //test
    if (dataJSON.accounts[message.author] == undefined) {
      message.reply("You're not currently linked, type $help for a list of commands!");
      return;
    }
    if (args.length == 0) {
      message.reply("The 'unset' command takes at least one argument!");
      return;
    }

    if (!Object.keys(dataJSON.accounts[message.author].activeEternals).length) {
      message.reply("You are not currently tracking any eternals, use *$myeternals add [eternal name]* to begin tracking");
      return;
    }
    if (!dataJSON.accounts[message.author].activeEternals.includes(args.join(' '))) {
      message.reply(`You are not currently tracking ${args.join(' ')}`);
      return;
    }
    dataJSON.accounts[message.author].activeEternals = dataJSON.accounts[message.author].activeEternals.filter(function(f) {
      return f != args.join(' ')
    })
    message.reply(`You are no longer tracking ${args.join(' ')}`);
    return;
  } else if (command == "active") {
  //test
  if (dataJSON.accounts[message.author] == undefined) {
    message.reply("You're not currently linked, type $help for a list of commands!");
    return;
  }

  if (!Object.keys(dataJSON.accounts[message.author].activeEternals).length) {
    message.reply("You are not currently tracking any eternals, use *$myeternals add [eternal name]* to begin tracking");
    return;
  }
  let list = [];
  for (let active of dataJSON.accounts[message.author].activeEternals) {
    list.push(active);
  }
  message.reply("*Currently Tracking:*\n" + list.join('\n'));
  return;
  } else if (command == "myeternals") {
  //test
  if (dataJSON.accounts[message.author] == undefined) {
    message.reply("You're not currently linked, type $help for a list of commands!");
    return;
  }
  //listing - return if nothing to list
  //if (!Object.keys(dataJSON.accounts[message.author].eternals).length) {
  if (dataJSON.accounts[message.author].eternals.length == 0) {
    message.reply("You do not currently have any eternals, use *$set [eternal name]* to begin tracking");
    return;
  }
  //no args
  if (args.length == 0) {
    let list = [];
    for (let eternal of dataJSON.accounts[message.author].eternals) {
      //list.push(`**${eternal.name}:** Score: ${eternal.score}, Level: ${eternal.level}`);
      list.push(`**${eternal.name}:** Score: ${eternal.score}`);
    }
    message.reply("**Your Eternals:**\n" + list.join('\n'));
  }
} else if (command == "update") {
  calculateEternals(message.author);
  message.reply("Your active eternals have been updated");
}
})

client.login(DISCORD_KEY);
