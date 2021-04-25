import React, {Component} from "react";
import PropTypes from 'prop-types';
import VideoOffIcon from "mdi-react/VideoOffIcon";

export default class LocalVideo extends Component {
    componentDidMount() {
        let video = this.refes[this.props.id];
        video.srcObject = this.props.stream;
        video.onloadedmetadata = (e) => {
            video.play();
        }
    }

    render() {
        const locaVideoStyle = {
            display: 'flex',
            justifyContent: "center",
            alignItems: 'center',
            position: "absolute",
            width: '192px',
            height: '108px',
            bottom: '60px',
            right: '10px',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#ffffff',
            overflow: 'hidden',
            zIndex: 99,
            borderRadius: '4px'
        };

        const videoMuteIcon = {
            position: 'absolute',
            color: 'fff'
        };

        return (
            <div key={this.props.id} style={locaVideoStyle}>
                <video ref={this.props.id}
                       id={this.props.id}
                       autoPlay
                       playsInline
                       muted={true}
                       style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                {
                    this.props.muted ? <VideoOffIcon style={videoMuteIcon}/> : null
                }
            </div>
        )
    }
};

LocalVideo.propTypes = {
    stream: PropTypes.any.isRequired,
    id: PropTypes.string
}