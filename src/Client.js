import React, {Component} from "react";
import {List, Button} from "antd";
import HangupIcon from "mdi-react/PhoneHangupIcon";
import VideoIcon from "mdi-react/VideoIcon";
import VideocamOffIcon from "mdi-react/VideocamOffIcon";
import MicrophoneIcon from "mdi-react/MicrophoneIcon";
import MicrophoneOffIcon from "mdi-react/MicrophoneOffIcon";
import LocalVideo from "./LocalVideo";
import RemoteVideo from "./RemoteVideo";
import VideoCall from "./VideoCall";
import Login from "./Login";


export default class Client extends Component {
    constructor(props) {
        super(props);

         this.state = {
             users: [],
             userId: null,
             userName: null,
             roomId: '1111',
             isOnCall: false,
             isLogined: false,
             localStream: null,
             audioMuted: false,
             videoDisabled: false
         };
    }

    connectServer() {
        let signalingServerAddress = "wss://" + window.location.hostname + ":8000/ws";
        let turnServerAddress = "https://" + window.location.hostname + ":9000/api/turn?service=turn&username=sample";

        console.log("Signaling server address: " + signalingServerAddress);
        console.log("TURN server address: " + turnServerAddress);

        this.videoCall = new VideoCall(signalingServerAddress, turnServerAddress, this.state.userName, this.state.roomId);

        this.videoCall.on("updateUserList", (users, self) => {
            this.setState({
                users: users,
                userId: self
            });
        });

        this.videoCall.on("newCall", (from, sessions) => {
            this.setState({
                isOnCall: true
            });
        });

        this.videoCall.on("localStream", (stream) => {
            this.setState({
                localStream: stream
            });
        });

        this.videoCall.on("addstream", (stream) => {
            this.setState({
                remoteStream: stream
            });
        });

        this.videoCall.on("remotestream", (stream) => {
            this.setState({
                remoteStream: null
            });
        });

        this.videoCall.on("hangUp", (to, session) => {
            this.setState({
                isOnCall: false,
                localStream: null,
                remoteSteam: null
            });
        });
    }

    handleStartCall(remoteUserId, mediaType) {
        this.videoCall.startCall(remoteUserId, mediaType);
    }

    handleHangup() {
        this.videoCall.hangup();
    }

    onVideoOnClickHandler() {
        let videoDisabled = !this.state.videoDisabled;
        this.onToggleLocalVideoTrack(videoDisabled);
        this.setState({videoDisabled: videoDisabled}); // TODO:XX
    }

    onToggleLocalVideoTrack(videoDisabled) {
        let videoTracks = this.state.localStream.getVideoTracks();
        for(let track of videoTracks)
            track.enabled = !videoDisabled;
    }

    onAudioClickHandler() {
        let audioMuted = !this.state.audioMuted;
        this.onToggleLocalAudioTrack(audioMuted);
        this.setState({audioMuted: audioMuted});
    }

    onToggleLocalAudioTrack(audioMuted) {
        let audioTracks = this.state.localStream.getAudioTracks();
        for(let track of audioTracks)
            track.enabled = !audioTracks;
    }

    logHandler(userName, roomId) {
        this.setState({
            isLogined: true,
            userName: userName,
            roomId: roomId
        });

        this.connectServer();
    }

    render() {
        return (
            <div className="main-layout">
                {!this.state.isLogined?
                    <div className="login-container">
                        <h2> P2P video call</h2>
                        <Login loginHandler={this.loginHandler}/>
                    </div>
                    :
                    !this.state.isOnCall?
                        <List bordered header={"P2P Video Call"} footer={"Enduser(Web/Android/iOS)"}>
                            {
                                this.state.users.map((user, index) => {
                                   return (
                                       <List.Item key={"user.id"}>
                                           <div className={list-item}>
                                               {user.name + user.id}
                                               {user.id !== this.state.userId &&
                                                   <div>
                                                       <Button type="link" onClick={() => this.handleStartCall(user.id, "video")}>Video</Button>
                                                       <Button type="link" onClick={() => this.handleStartCall(user.id, "screen")}>Screen</Button>
                                                   </div>
}                                               }
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
                                    //渲染本地视频
                                    this.state.remoteStream != null ? <RemoteVideo stream={this.state.remoteStream} id={'remoteview'} /> : null
                                }
                                {
                                    //渲染远端视频
                                    this.state.localStream != null ? <LocalVideo stream={this.state.localStream} muted={this.state.videoMuted} id={'localview'} /> : null
                                }
                            </div>
                            <div className="btn-tools">
                                {/* 打开/关闭视频 */}
                                <Button className="button" ghost size="large" shape="circle"
                                        icon={this.state.videoDisabled ? <VideocamOffIcon /> : <VideoIcon />}
                                        onClick={this.onVideoOnClickHandler}
                                >
                                </Button>
                                {/* 挂断 */}
                                <Button className="button" ghost size="large" shape="circle"
                                        icon={<HangupIcon />}
                                        onClick={this.handleUp}
                                >
                                </Button>
                                {/* 打开/关闭音频 */}
                                <Button ghost size="large" shape="circle"
                                        icon={this.state.audioMuted ? <MicrophoneOffIcon /> : <MicrophoneIcon />}
                                        onClick={this.onAudioClickHandler}
                                >
                                </Button>
                            </div>
                        </div>

                }
            </div>
        )
    }
}