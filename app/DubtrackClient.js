'use strict';

import util from 'util';
import events from 'events';
import DubAPI from 'dubapi';

class DubtrackClient extends events.EventEmitter {
    constructor ({username, password, room}) {
        super();
        this.username = username;
        this.password = password;
        this.room = room;
    }
    login (callback) {
        new DubAPI({
            username: this.username,
            password: this.password
        }, (err, dubapi) => {
            if (err) return callback(err);
            this._dubapi = dubapi;
            dubapi.on('connected', () => this.emit('connected'));
            dubapi.on('disconnected', () => this.emit('disconnected'));
            dubapi.on('error', (err) => this.emit('error', err));
            dubapi.on('room_playlist-dub', (data) => {
                this.emit('vote', {
                    username: data.user.username,
                    type: data.dubtype
                });
            });
            dubapi.on(dubapi.events.chatMessage, (data) => {
                this.emit('chat-message', {
                    username: data.user.username,
                    timestamp: new Date(data.time),
                    message: data.message,
                    id: data.id
                });
            });
            dubapi.on(dubapi.events.roomPlaylistUpdate, (data) => {
                if (!data.media) return;
                this.emit('track-changed', {
                    username: data.user.username,
                    timestamp: new Date(),
                    title: data.media.name,
                    originType: data.media.type,
                    originId: data.media.fkid,
                    duration: data.media.songLength
                });
            });
            callback();
        });
    }
    connect () {
        this._dubapi.connect(this.room);
    }
    say (message) {
        this._dubapi.sendChat(message);
    }
    getTrackInfo () {
        var media = this._dubapi.getMedia();
        var dj = this._dubapi.getDJ();
        return media && {
            username: dj.username,
            timestamp: new Date(media.created),
            title: media.name,
            originType: media.type,
            originId: media.fkid
        };
    }
    getUsers () {
        return this._dubapi.getUsers();
    }
    getQueue () {
        return this._dubapi.getQueue();
    }
    deleteChatMessage (messageId) {
        this._dubapi.moderateDeleteChat(messageId);
    }
    skipTrack () {
        this._dubapi.moderateSkip();
    }
}

export default DubtrackClient;
