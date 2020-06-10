const botconfig = require("./botconfig.json");
const Discord = require("discord.js");
const axios = require('axios');
const bot = new Discord.Client({ disableEveryone: true });
var fs = require('fs');
bot.on("ready", async () => {
  console.log(`Bot is online`)
  if (help = botconfig.commands.help) {
    bot.user.setActivity(`type ${botconfig.prefix + help.name} for help!`, "Custom")
  } else {
    bot.user.setAFK(true).then((user) => {
      bot.user = user;
    });
  }
});

var token = null;

const announcedMap = new Map();

const commandMap = new Map([
  [botconfig.commands.help, (message) => {
    const cmds = []
    for (const cmd of commandMap.keys()) {
      cmds.push(`${botconfig.prefix}${cmd.name}: ${cmd.description}`)
    }
    message.channel.send(`Meine Commands:\n${cmds.join("\n")}`)
  }],
  [botconfig.commands.submit, (msg) => {
    if (!(msg instanceof Message)) {
      return;
    }
    channel = msg.channel
    sender = msg.author
    data = fs.readFileSync('clips.json', 'utf8');
    clips = JSON.parse(data);

    var convMsg = message.content.split(" ");

    urlImport = urlImport + convMsg[1];

    for (const clip of clips) {
      if (clip.originalURL == urlImport) {
        message.channel.send(`Dieser Clip wurde bereits von ${clip.submitter} eingereicht!`)
        clip.submissions++;
        json = JSON.stringify(clips);
        fs.writeFileSync('clips.json', json, 'utf8');
        return;
      }
    }

    axios.get(urlImport, {
      auth: {
        username: uemail,
        password: upwd
      },
    }).then((resp) => {
      clips.push({
        submitter: message.author.username,
        originalURL: urlImport,
        uploadCode: resp.data.shortcode,
        submissions: 1,
        ts: Date.now(),
      });
      json = JSON.stringify(clips); //convert it back to json
      fs.writeFileSync('clips.json', json, 'utf8');
    }, (error) => {
      console.log(error);
    });
  }],
])

const upwd = botconfig.upwd;
const uemail = botconfig.uemail;
const streamableBaselinkVideo = "https://streamable.com/";

var urlImport = "https://api.streamable.com/import?url=";
var urlExport = "https://api.streamable.com/videos/"

bot.on("message", async message => {
  if (!message.content.startsWith(botconfig.prefix)) {
    return;
  }
  message.content = message.content.substring(1)
  const command = botconfig.commands[message.content.split(" ")[0]]
  if (commandMap.has(command)) {
    commandMap.get(command)(message);
  }

});

async function checkStreams() {
  time = Date.now()
  if (!token || token['expires_at'] < time) {
    token = (await axios.post(
      "https://id.twitch.tv/oauth2/token?client_id=vwp8j7risddh2eu2veqm1um4012hza&client_secret=2jc8pm3bwxckvvw8tl4ecy0w2czw9b&grant_type=client_credentials&scope=analytics:read:games"
    )).data
    token['expires_at'] = time + token['expires_in'] * 1000
  }
  axios.get(
    `https://api.twitch.tv/helix/streams?${getLoginNames()}`,
    {
      headers: {
        Authorization: `Bearer ${token['access_token']}`,
        'Client-ID': "vwp8j7risddh2eu2veqm1um4012hza"
      }
    }
  ).then((res) => {
    streams = res.data.data;
    var reminderChannel = null;
    for (const channel of bot.channels.values()) {
      if(channel.name == botconfig.streamReminder.streamReminderChannel) {
        reminderChannel = channel;
        break;
      }
    }
    if(reminderChannel == null) {
      return;
    }
    messageArr = []

    for (const stream of streams) {
      if(!announcedMap.get(stream.id)) {
        announcedMap.set(stream.id, true);
        getStreamMessage(stream).then((msg) => {
          reminderChannel.send(msg)
        })
      }
    }
  }).catch((err) => {
    console.log(err);
  })
}

function getLoginNames() {
  const list = [];
  for (const streamer of botconfig.streamReminder.streamer) {
    list.push(`user_login=${streamer}`);
  }
  return list.join("&")
}

async function getStreamMessage(stream) {
  const games = (await axios.get(
    `https://api.twitch.tv/helix/games?id=${stream.game_id}`,
    {
      headers: {
        Authorization: `Bearer ${token['access_token']}`,
        'Client-ID': "vwp8j7risddh2eu2veqm1um4012hza"
      }
    }
  )).data.data;
  const users = (await axios.get(
    `https://api.twitch.tv/helix/users?id=${stream.user_id}`,
    {
      headers: {
        Authorization: `Bearer ${token['access_token']}`,
        'Client-ID': "vwp8j7risddh2eu2veqm1um4012hza"
      }
    }
  )).data.data;
  if (users.length == 0) {
    return '';
  }
  const user = users[0]
  const game = games.length ? games[0] : null; 
  return `${user.display_name} hat den Stream '${stream.title}' gestartet! Schalte ein auf <https://twitch.tv/${user.login}>${game ? ` und schaue beim Spielen von ${game.name} zu!` : "!"}`
}

setInterval(checkStreams, 5000);

bot.login(botconfig.token);