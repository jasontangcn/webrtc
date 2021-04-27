import React, {Component} from "react";
import PropTypes from 'prop-types';
import VideoOffIcon from "mdi-react/VideoOffIcon";

export default class LocalVideo extends Component {
    componentDidMount() {
        //let video = this.refs[this.props.id];
        this.video = React.createRef();
        this.video.srcObject = this.props.stream;
        this.video.onloadedmetadata = (e) => {
            this.video.play();
        }
    }

    render() {
        const localVideoStyle = {
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
            <div key={this.props.id} style={localVideoStyle}>
                <video ref={this.video}
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