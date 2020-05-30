const botconfig = require("./botconfig.json");
const Discord = require("discord.js");
const axios = require('axios');
const bot = new Discord.Client({disableEveryone: true});
var fs = require('fs');
bot.on("ready", async() => {
    console.log(`Bot is online`)
    if (help = botconfig.commands.help) {
      bot.user.setActivity(`type ${botconfig.prefix + help.name} for help!`, "Custom")
    } else {
      bot.user.setAFK(true).then((user) => {
        bot.user = user;
      });
    }
});

const commandMap = new Map([
  [botconfig.commands.help, (message) => {
    const cmds = []
    for(const cmd of commandMap.keys()) {
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

    axios.get(urlImport,{
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
    },(error) => {
      console.log(error);
    });
  }]
])

const upwd = botconfig.upwd;
const uemail = botconfig.uemail;
const streamableBaselinkVideo = "https://streamable.com/";

var urlImport = "https://api.streamable.com/import?url=";
var urlExport = "https://api.streamable.com/videos/"

bot.on("message", async message => {
  if(!message.content.startsWith(botconfig.prefix)) {
    return;
  }
  message.content = message.content.substring(1)
  const command = botconfig.commands[message.content.split(" ")[0]]
  if(commandMap.has(command)) {
    commandMap.get(command)(message);
  }

});

bot.login(botconfig.token);