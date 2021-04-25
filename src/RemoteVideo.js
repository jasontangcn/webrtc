import React, {Component} from "react";
import PropTypes from 'prop-types';
import VideoOffIcon from "mdi-react/VideoOffIcon";

export default class RemoteVideo extends Component {
    componentDidMount() {
        let video = this.refes[this.props.id];
        video.srcObject = this.props.stream;
        video.onloadedmetadata = (e) => {
            video.play();
        }
    }

    render() {
        const remoteVideoStyle = {
            position: 'absolute',
            left: '0px',
            right: '0px',
            top: '0px',
            bottom: '0px',
            borderColor: '#323232',
            zIndex: 0,
        };

        return (
            <div key={this.props.id} style={remoteVideoStyle}>
                <video ref={this.props.id}
                       id={this.props.id}
                       autoPlay
                       playsInline
                       style={{width: '100%', height: '100%', objectFit: 'contain'}}/>
            </div>
        )
    }
};

RemoteVideo.propTypes = {
    stream: PropTypes.any.isRequired,
    id: PropTypes.string
}