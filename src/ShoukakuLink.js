const ShoukakuPlayer = require('./ShoukakuPlayer.js');

class ShoukakuLink {
    constructor(node) {
        this.node = node;
        this.lastServerUpdate = null;
        this.sessionID = null;
        this.userID = null;
        this.guildID = null;
        this.voiceChannelID = null;
        this.player = new ShoukakuPlayer(this);
    }
    
    set link(data) {
        this.userID = data.userID;
        this.guildID = data.guild_id;
        this.voiceChannelID = data.channel_id;
        this.sessionID = data.sessionID;
    }

    set serverUpdate(data) {
        this.lastServerUpdate = data;
    }
    
    send(data) {
        return this.node.send(data);
    }
}
module.exports = ShoukakuLink;