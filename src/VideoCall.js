import * as events from 'events';
import Axios from 'axios';
import {configure} from "@testing-library/react";

let RTCPeerConnection = Window.RTCPeerConnection || Window.mozRTCPeerConnection ||
    Window.webkitRTCPeerConnection || Window.msRTCPeerConnection;

let RTCSessionDescription = Window.RTCSessionDescription || Window.mozRTCSessionDescription ||
    Window.webkitRTCSessionDescription || Window.msRTCSessionDescription;

// default configuration
let iceServerConfig = {"iceServers": [{"url": "stun:stun.1.google.com:19302"}]};

export default class VideoCall extends events.EventEmitter {
    constructor(signalingServerAddress, turnServerAddress, userName, roomId) {
        super();

        this.rtcPeerConn = {};
        this.sessionId = '000-111'; // TODO:XX

        this.userName = userName;
        this.roomId = roomId;

        this.signalingServerAddress = signalingServerAddress;
        this.turnServerAddress = turnServerAddress;

        Axios.get(this.turnServerAddress, {})
            .then(resp => {
                if (resp.status === 200) {
                    let credential = resp.data;
                    iceServerConfig = {
                        "iceServers": [
                            {
                                "url": credential['uris'][0],
                                "username": credential['username'],
                                "credential": credential['password']
                            }
                        ]
                    };
                    console.log("ice server configuration: " + JSON.stringify(iceServerConfig));
                }
            }).catch((error) => console.log("Network error: can not connect to TURN server."));

        this.socket = new WebSocket(this.signalingServerAddress);

        this.socket.onopen = () => {
            console.log("WebSocket connected successfully.");
            this.userId = this.generateUserId();
            let message = {
                type: 'joinRoom',
                data: {
                    name: this.userName,
                    userId: this.userId,
                    roomId: this.roomId
                }
            };

            this.sendMessage(message);
        };

        this.socket.onmessage = (e) => {
            let message = JSON.parse(e.data);
            console.log("WebSocket got message => type: " + message.type + ", data: " + JSON.stringify(message.data));

            switch (message.type) {
                case 'offer':
                    this.handleOfferMessage(message);
                    break;
                case 'answer':
                    this.handleAnswerMessage(message);
                    break;
                case 'candidate':
                    this.handleCandidateMessage(message);
                    break;
                case 'updateUserList':
                    this.handleUpdateUserListMessage(message);
                    break;
                case 'leaveRoom':
                    this.handleLeaveRoomMessage(message);
                    break;
                case 'hangup':
                    this.handleHangupMessage(message);
                    break;
                case 'heartbeat':
                    this.handleHeartbeatMessage(message);
                    break;
                default:
                    console.log("WebSocket got unknown message.");
            }
        };

        this.socket.onerror = (e) => console.log("WebSocket got error: " + e.data);

        this.socket.onclose = (e) => console.log("Socket closed: " + e.data);
    }


}