/* Let CRA handle linting for sample app */
import React, { Component } from 'react';

import Spinner from 'react-spinner';
import classNames from 'classnames';

import AccCore from 'opentok-accelerator-core';
import 'opentok-solutions-css';

import config from "./config.json";
import './App.css';

let otCore;
const otCoreOptions = {
  credentials: {
    apiKey: config.apiKey,
    sessionId: "",
    token: "",
  },
  // A container can either be a query selector or an HTML Element
  streamContainers(pubSub, type, data, stream) {
    return {
      publisher: {
        camera: '#cameraPublisherContainer',
        screen: '#screenPublisherContainer',
      },
      subscriber: {
        camera: '#cameraSubscriberContainer',
        screen: '#screenSubscriberContainer',
      },
    }[pubSub][type];
  },
  controlsContainer: '#controls',
  packages: ['textChat', 'screenSharing', 'annotation'],
  communication: {
    callProperties: null, // Using default
    autoSubscribe: true,
    subscribeOnly: false,
    connectionLimit: null,
  },
  textChat: {
    name: ['David', 'Paul', 'Emma', 'George', 'Amanda'][Math.random() * 5 | 0], // eslint-disable-line no-bitwise
    waitingMessage: 'Messages will be delivered when other users arrive',
    container: '#chat',
  },
  screenSharing: {
    extensionID: 'plocfffmbcclpdifaikiikgplfnepkpo',
    annotation: true,
    externalWindow: false,
    dev: true,
    screenProperties: {
      insertMode: 'append',
      width: '100%',
      height: '100%',
      showControls: false,
      style: {
        buttonDisplayMode: 'off',
      },
      videoSource: 'window',
      fitMode: 'contain' // Using default
    },
  },
  annotation: {
    absoluteParent: {
      publisher: '.App-video-container',
      subscriber: '.App-video-container'
    }
  },
};

/**
 * Build classes for container elements based on state
 * @param {Object} state
 */
const containerClasses = (state) => {
  const { active, meta, localAudioEnabled, localVideoEnabled } = state;
  const sharingScreen = meta ? !!meta.publisher.screen : false;
  const viewingSharedScreen = meta ? meta.subscriber.screen : false;
  const activeCameraSubscribers = meta ? meta.subscriber.camera : 0;
  const activeCameraSubscribersGt2 = activeCameraSubscribers > 2;
  const activeCameraSubscribersOdd = activeCameraSubscribers % 2;
  const screenshareActive = viewingSharedScreen || sharingScreen;
  return {
    controlClass: classNames('App-control-container', { hidden: !active }),
    localAudioClass: classNames('ots-video-control circle audio', { hidden: !active, muted: !localAudioEnabled }),
    localVideoClass: classNames('ots-video-control circle video', { hidden: !active, muted: !localVideoEnabled }),
    localCallClass: classNames('ots-video-control circle end-call', { hidden: !active }),
    cameraPublisherClass: classNames('video-container', { hidden: !active, small: !!activeCameraSubscribers || screenshareActive, left: screenshareActive }),
    screenPublisherClass: classNames('video-container', { hidden: !active || !sharingScreen }),
    cameraSubscriberClass: classNames('video-container', { hidden: !active || !activeCameraSubscribers },
      { 'active-gt2': activeCameraSubscribersGt2 && !screenshareActive },
      { 'active-odd': activeCameraSubscribersOdd && !screenshareActive },
      { small: screenshareActive }
    ),
    screenSubscriberClass: classNames('video-container', { hidden: !viewingSharedScreen || !active }),
  };
};

const connectingMask = () =>
  <div className="App-mask">
    <Spinner />
    <div className="message with-spinner">Connecting</div>
  </div>;

const errorMask = () =>

  <div style={{
    position: 'absolute',
    top: '60%',
    color: '#ff1605'
  }}>No device connected</div>;

const startCallMask = start =>
  <div className="App-mask">
    <button className="message button clickable" onClick={start}>Click to Start Call </button>
  </div>;

class TokWeb extends Component {

  constructor(props) {
    super(props);
    this.state = {
      error: false,
      connected: false,
      connecting: false,
      active: false,
      publishers: null,
      subscribers: null,
      meta: null,
      localAudioEnabled: true,
      localVideoEnabled: true,
    };
    this.endCall = this.endCall.bind(this);
    this.toggleLocalAudio = this.toggleLocalAudio.bind(this);
    this.toggleLocalVideo = this.toggleLocalVideo.bind(this);
  }

  startCall = () => {
    this.setState({ connecting: true, error: false });
    fetch("http://192.168.1.11:2383/api/videosession/session/token")
      .then(res => res.json())
      .then(
        result => {
          if (!result) {
            this.setState({ connecting: false, });
            return;
          }
          this.setState({ session: result });
          otCoreOptions.credentials.sessionId = result.session_id;
          otCoreOptions.credentials.token = result.token_id;
          otCore = new AccCore(otCoreOptions);
          const events = [
            "subscribeToCamera",
            "unsubscribeFromCamera",
            "subscribeToScreen",
            "unsubscribeFromScreen",
            "startScreenShare",
            "endScreenShare"
          ];

          events.forEach(event =>
            otCore.on(event, ({ publishers, subscribers, meta }) => {
              this.setState({ publishers, subscribers, meta });
            })
          );
          otCore.connect().then(() => {
            this.setState({ connected: true });
            otCore
              .startCall()
              .then(({ publishers, subscribers, meta }) => {
                this.setState({
                  publishers,
                  subscribers,
                  meta,
                  active: true,
                  connecting: false
                });
              })
              .catch(error => console.log(error));
          });
        },
        error => {
          this.setState({ connecting: false, error: true });
        }
      );
  };

  endCall() {

    otCore.endCall();
    otCore.disconnect();
    this.setState({ session: null, active: false });
  }

  toggleLocalAudio() {
    otCore.toggleLocalAudio(!this.state.localAudioEnabled);
    this.setState({ localAudioEnabled: !this.state.localAudioEnabled });
  }

  toggleLocalVideo() {
    otCore.toggleLocalVideo(!this.state.localVideoEnabled);
    this.setState({ localVideoEnabled: !this.state.localVideoEnabled });
  }

  render() {
    const { connecting, active, error } = this.state;
    const {
      localAudioClass,
      //   localVideoClass,
      localCallClass,
      controlClass,
      cameraPublisherClass,
      screenPublisherClass,
      cameraSubscriberClass,
      screenSubscriberClass,
    } = containerClasses(this.state);

    return (
      <div className="App">
        <div className="App-header">
          <h1>Web</h1>
        </div>
        <div className="App-main">
          <div className="App-video-container">
            {connecting && connectingMask()}
            {error && errorMask()}
            {!connecting && !active && startCallMask(this.startCall)}
            <div id="cameraPublisherContainer" className={cameraPublisherClass} />
            <div id="screenPublisherContainer" className={screenPublisherClass} />
            <div id="cameraSubscriberContainer" className={cameraSubscriberClass} />
            <div id="screenSubscriberContainer" className={screenSubscriberClass} />
          </div>
          <div id="controls" className={controlClass}>
            <div className={localAudioClass} onClick={this.toggleLocalAudio} />
            {/* <div className={localVideoClass} onClick={this.toggleLocalVideo} /> */}
            <div className={localCallClass} onClick={this.endCall} />
          </div>
          <div id="chat" className="App-chat-container" />
        </div>
      </div>
    );
  }
}

export default TokWeb;
