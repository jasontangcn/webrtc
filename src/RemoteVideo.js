import React, {Component} from "react";
import PropTypes from 'prop-types';

export default class RemoteVideo extends Component {
    componentDidMount() {
        //let video = this.refes[this.props.id];
        this.video = React.createRef();
        this.video.srcObject = this.props.stream;
        this.video.onloadedmetadata = (e) => {
            this.video.play();
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
                <video ref={this.video}
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