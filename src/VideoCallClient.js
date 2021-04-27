import React, {Component} from "react";
import {List, Button} from "antd";
import PhoneHangupIcon from "mdi-react/PhoneHangupIcon";
import VideoIcon from "mdi-react/VideoIcon";
import VideocamOffIcon from "mdi-react/VideocamOffIcon";
import MicrophoneIcon from "mdi-react/MicrophoneIcon";
import MicrophoneOffIcon from "mdi-react/MicrophoneOffIcon";
import VideoCall from "./VideoCall";
import LocalVideo from "./LocalVideo";
import RemoteVideo from "./RemoteVideo";
import Login from "./Login";

export default class VideoCallClient extends Component {
    constructor(props) {
        super(props);

        this.state = {
            userId: null,
            userName: null,
            roomId: '1111',
            users: [],

            isOnCall: false,
            isLogined: false,

            localStream: null,
            audioMuted: false,
            videoEnabled: true
        };
    }

    connectServers() {
        let signalingServerAddress = "wss://" + window.location.hostname + ":8000/ws";
        let turnServerAddress = "https://" + window.location.hostname + ":9000/api/turn?service=turn&username=sample";

        console.log("Signaling server address: " + signalingServerAddress);
        console.log("TURN server address: " + turnServerAddress);

        this.videoCall = new VideoCall(signalingServerAddress, turnServerAddress, this.state.userName, this.state.roomId);

        this.videoCall.on("UpdateUserList", (users, userId) => {
            this.setState({
                users: users,
                userId: userId
            });
        });

        this.videoCall.on("NewCall", (from, sessionId) => {
            this.setState({
                isOnCall: true
            });
        });

        this.videoCall.on("LocalStream", (stream) => {
            this.setState({
                localStream: stream
            });
        });

        this.videoCall.on("AddStream", (stream) => {
            this.setState({
                remoteStream: stream
            });
        });

        this.videoCall.on("RemoveStream", (stream) => {
            this.setState({
                remoteStream: null
            });
        });

        this.videoCall.on("Hangup", (to, session) => {
            this.setState({
                isOnCall: false,
                localStream: null,
                remoteSteam: null
            });
        });
    }

    startCallHandler(remoteUserId, mediaType) {
        this.videoCall.startCall(remoteUserId, mediaType);
    }

    hangupHandler() {
        this.videoCall.hangup();
    }

    videoSwitchHandler() {
        let videoEnabled = this.state.videoEnabled;
        this.toggleLocalVideoTracks(!videoEnabled);
        this.setState({videoDisabled: !videoEnabled}); // TODO:XX
    }

    toggleLocalVideoTracks(videoEnabled) {
        let videoTracks = this.state.localStream.getVideoTracks();
        for (let track of videoTracks)
            track.enabled = videoEnabled;
    }

    audioSwitchHandler() {
        let audioMuted = this.state.audioMuted;
        this.toggleLocalAudioTracks(!audioMuted);
        this.setState({audioMuted: !audioMuted});
    }

    toggleLocalAudioTracks(audioMuted) {
        let audioTracks = this.state.localStream.getAudioTracks();
        for (let track of audioTracks)
            track.enabled = audioTracks;
    }

    loginHandler(userName, roomId) {
        this.setState({
            isLogined: true,
            userName: userName,
            roomId: roomId
        });

        this.connectServers();
    }

    render() {
        return (
            <div className="main-layout">
                {!this.state.isLogined ?
                    <div className="login-container">
                        <h2> P2P Video Call</h2>
                        <Login loginHandler={this.loginHandler}/>
                    </div>
                    :
                    !this.state.isOnCall ?
                        <List bordered header={"P2P Video Call"} footer={"(Web/Android/iOS)"}>
                            {
                                this.state.users.map((user, index) => {
                                    return (
                                        <List.Item key={"user.id"}>
                                            <div className="list-item">
                                                {user.name + user.id}
                                                {user.id !== this.state.userId &&
                                                <div>
                                                    <Button type="link"
                                                            onClick={() => this.startCallHandler(user.id, "video")}>Video</Button>
                                                    <Button type="link"
                                                            onClick={() => this.startCallHandler(user.id, "screen")}>ScreenSharing</Button>
                                                </div>
                                                }
                                            </div>
                                        </List.Item>
                                    )
                                })
                            }
                        </List>
                        :
                        <div>
                            <div>
                                {
                                    this.state.remoteStream ?
                                        <RemoteVideo stream={this.state.remoteStream} id={'remoteVideoView'}/> : null
                                }
                                {
                                    this.state.localStream ?
                                        <LocalVideo stream={this.state.localStream} muted={!this.state.videoEnabled}
                                                    id={'localVideoView'}/> : null
                                }
                            </div>
                            <div className="btn-tools">
                                <Button className="button" ghost size="large" shape="circle"
                                        icon={this.state.videoDisabled ? <VideocamOffIcon/> : <VideoIcon/>}
                                        onClick={this.videoSwitchHandler}>
                                </Button>
                                <Button className="button" ghost size="large" shape="circle"
                                        icon={<PhoneHangupIcon/>}
                                        onClick={this.hangupHandler}>
                                </Button>
                                <Button ghost size="large" shape="circle"
                                        icon={this.state.audioMuted ? <MicrophoneOffIcon/> : <MicrophoneIcon/>}
                                        onClick={this.audioSwitchHandler}>
                                </Button>
                            </div>
                        </div>
                }
            </div>
        )
    }
}