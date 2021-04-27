import * as events from 'events';
import Axios from 'axios';
import {configure} from "@testing-library/react";

let RTCPeerConnection = Window.RTCPeerConnection
    || Window.mozRTCPeerConnection
    || Window.webkitRTCPeerConnection
    || Window.msRTCPeerConnection;

let RTCSessionDescription = Window.RTCSessionDescription
    || Window.mozRTCSessionDescription
    || Window.webkitRTCSessionDescription
    || Window.msRTCSessionDescription;

// default configuration
let iceServerConfig = {"iceServers": [{"url": "stun:stun.1.google.com:19302"}]};

export default class VideoCall extends events.EventEmitter {
    constructor(signalingServerAddress, turnServerAddress, userName, roomId) {
        super();

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
                    console.log("ICE server configuration: " + JSON.stringify(iceServerConfig) + ".");
                }
            }).catch(error => {
                console.log("Can not connect to TURN server.");
            });

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
                    console.log("WebSocket got a heartbeat message.");
                    break;
                default:
                    console.log("WebSocket got unknown message.");
            }
        };

        this.socket.onerror = (e) => console.log("WebSocket got error: " + e.data);

        this.socket.onclose = (e) => console.log("WebSocket closed: " + e.data);
    }

    getLocalStream = (type) => {
        return new Promise((resolve, reject) => {
            if (type == 'screen') {
                navigator.mediaDevices.getDisplayMedia({video: true})
                    .then((mediaStream) => {
                        resolve(mediaStream);
                    }).catch((err) => {
                        console.log("getLocalStream => got errors: " + err.name + ", " + err.message);
                        reject(err);
                    });

            } else {
                let constraints = {audio: true, video: type === 'video' ? {width: 1280, height: 720} : false};
                navigator.mediaDevices.getDisplayMedia(constraints)
                    .then((mediaStream) => {
                        resolve(mediaStream);
                    }).catch((err) => {
                        console.log("getLocalStream got errors: " + err.name + ", " + err.message);
                        reject(err);
                    });
            }
        });
    }

    generateUserId() {
        let num = "";
        for(let i = 0; i < 6; i++) {
            num += Math.floor(Math.random() * 10);
        }
        return num;
    }

    sendMessage(message) {
        this.socket.send(JSON.stringify(message));
    }

    startCall(remoteUserId, mediaType) {
        this.sessionId = this.userId + "-" + remoteUserId;
        this.getLocalStream(mediaType)
            .then((stream) => {
                this.localStream = stream;
                this.createConnection(remoteUserId, mediaType, true, stream);
                this.emit('localStream', stream);
                this.emit('newCall', this.userId, this.sessionId);
            });
    }

    hangup() {
        let message = {
            type: 'hangup',
            data: {
                sessionId: this.sessionId,
                from: this.userId,
                roomId: this.roomId
            }
        };

        this.sendMessage(message);
    }

    createOffer(peerConnection, remoteUserId, mediaType) {
        peerConnection.createOffer()
            .then(desc => {
                console.log('createOffer: ', desc.sdp);
                return peerConnection.setLocalDescription(desc);
            }).then(() => {
                console.log('setLocalDescription', peerConnection.localDescription);
                let desc = peerConnection.localDescription;
                let message = {
                    type: 'offer',
                    data: {
                        to: remoteUserId,
                        from: this.userId,
                        description: {'sdp': desc.sdp, 'type': desc.type},
                        sessionId: this.sessionId,
                        media: mediaType,
                        roomId: this.roomId
                    }
                };
                this.sendMessage(message);
            }).catch(this.logError);
    }

    createPeerConnection(remoteUserId, mediaType, isInitiator, localStream) {
        console.log("start to create connection");

        let peerConnection = new RTCPeerConnection(iceServerConfig);
        this.peerConnections["" + remoteUserId] = peerConnection;

        peerConnection.onicecandidate = (event) => {
            console.log("onicecandidate triggered: ", event);
            if(event.candidate) {
                let message = {
                    type: 'candidate',
                    data: {
                        to: remoteUserId,
                        from: this.userId,
                        candidate: {
                            'sdpMLineIndex': event.candidate.sdpMLineIndex,
                            'sdpMid': event.candidate.sdpMid,
                            'candidate': event.candidate.candidate
                        },
                        sessionId: this.sessionId,
                        roomId: this.roomId
                    }
                };

                this.sendMessage(message);
            }
        };

        peerConnection.onnegotiationneeded = () => {
            console.log("onnegotiationneeded triggered.");
        };

        peerConnection.oniceconnectionstatechange = (event) => {
            console.log("oniceconnectionstatechange triggered.");
        }

        peerConnection.onsignalingstatechange = (event) => {
            console.log("onsignalingstatechange triggered.");
        }

        peerConnection.onaddstream = (event) => {
            console.log('onaddstream triggered.', event);
            this.emit('addstream', event.stream);
        }

        peerConnection.onremovestream = (event) => {
            console.log("onremovestream triggered.");
            this.emit('removestream', event.stream);
        }

        peerConnection.onaddstream(localStream);
        if(isInitiator){
            this.createOffer(peerConnection, remoteUserId, mediaType);
        }

        return peerConnection;
    }

    handleUpdateUserListMessage(message) {
        let data = message.data;
        console.log("users: " + JSON.stringify(data));
        this.emit('updateUserList', data, this.userId);
    }

    handleOfferMessage = (message) => {
        let data = message.data;
        let from = message.from;
        this.sessionId = data.sessionId;
        this.emit('newCall', from, this.sessionId);

        let mediaType = 'video';
        this.getLocalStream(mediaType)
            .then((stream) => {
                this.localStream = stream;
                this.emit('localStream', stream);
                let peerConnection = this.createPeerConnection(from, mediaType, false, stream);

                if(peerConnection && data.description) {
                    // TODO:
                    // In older code and documentation,
                    // you may see a callback-based version of this function used.
                    // This has been deprecated and its use is strongly discouraged.
                    // You should update any existing code to use
                    // the Promise-based version of setRemoteDescription() instead.
                    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/setRemoteDescription
                    peerConnection.setRemoteDescription(new RTCSessionDescription(data.description))
                        .then(() => {
                            if(peerConnection.remoteDescription.type == 'offer') {
                                peerConnection.createAnswer().then(desc => {
                                    return peerConnection.setLocalDescription(desc);
                                }).then(() => {
                                    let desc = peerConnection.localDescription;
                                    let message = {
                                        type: 'answer',
                                        data: {
                                            to: from,
                                            from: this.userId,
                                            description: {'sdp': desc.sdp, 'type': desc.type},
                                            sessionId: this.sessionId,
                                            roomId: this.roomId
                                        }
                                    };

                                    this.sendMessage(message);
                                }).catch(this.logError);
                            }
                        });
                }
            });
    }

    handleAnswerMessage(message) {
        let data = message.data;
        let from = data.from;
        let peerConnection = this.peerConnections[from];

        if(peerConnection && data.description) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.description)).catch(this.logError);
        }
    }

    handleCandidateMessage(message) {
        let data = message.data;
        let from = data.from;
        let peerConnection = this.peerConnections[from];

        if(peerConnection && data.candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(this.logError);
        }
    }

    handleLeaveRoomMessage(message) {
        let data = message.data;
        let peerConnection = this.peerConnections[data];
        if(peerConnection) {
            peerConnection.close();
            delete this.peerConnections[data];
            this.emit('leaveRoom', data);
        }

        if(this.localStream) {
            this.closeStream(this.localStream);
            this.localStream = null;
        }
    }

    handleHangupMessage(message) {
        let data = message.data;
        let ids = data.sessionId.split('_');
        let userId = ids[0];
        let remoteUserId = ids[1];
        let to = data.to;
        let peerConnection = this.peerConnections[userId];
        let remotePeerConnection = this.peerConnections[remoteUserId];

        if(peerConnection) {
            peerConnection.close();
            delete this.peerConnections[userId];
        }

        if(remotePeerConnection) {
            remotePeerConnection.close();
            delete this.peerConnections[remoteUserId];
        }

        if(this.localStream) {
            this.closeStream(this.localStream);
            this.localStream = null;
        }

        this.emit('hangup', to, this.sessionId);
        //this.sessionId = "000-111";
    }

    logError(error) {
        console.log("got error: ", error);
    }

    closeStream(stream) {
        if(!stream)
            return;
        for(let track of stream.getTracks())
            track.stop();
    }
}