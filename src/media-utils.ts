import browserama from 'browserama';
import { PureCloudWebrtcSdk } from './client';
import { log } from './logging';
import { LogLevels } from './types/enums';

const PC_AUDIO_EL_CLASS = '__pc-webrtc-inbound';
export let _hasTransceiverFunctionality: boolean | null = null;

declare var window: {
  navigator: {
    mediaDevices: {
      getDisplayMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
    } & MediaDevices;
  } & Navigator;
} & Window;

/**
 * Get the screen media
 * @param this must be called with a PureCloudWebrtcSdk as `this`
 */
export const startDisplayMedia = function (): Promise<MediaStream> {
  const constraints = getScreenShareConstraints();

  if (hasGetDisplayMedia()) {
    return window.navigator.mediaDevices.getDisplayMedia(constraints);
  }

  return window.navigator.mediaDevices.getUserMedia(constraints);
};

export const startMedia = function (opts: { video?: boolean, audio?: boolean } = { video: true, audio: true }): Promise<MediaStream> {
  let constraints: any = { audio: true };

  if (opts.video) {
    constraints = getVideoConstraints(!opts.audio);
  }

  return window.navigator.mediaDevices.getUserMedia(constraints);
};

/**
 * Select or create the `audio.__pc-webrtc-inbound` element
 */
export const createAudioMediaElement = function (): HTMLAudioElement {
  const existing = document.querySelector(`audio.${PC_AUDIO_EL_CLASS}`);
  if (existing) {
    return existing as HTMLAudioElement;
  }
  const audio = document.createElement('audio');
  audio.classList.add(PC_AUDIO_EL_CLASS);
  (audio.style as any) = 'visibility: hidden';

  document.body.append(audio);
  return audio;
};

/**
 * Attach an audio stream to the audio element
 * @param this must be called with a PureCloudWebrtcSdk as `this`
 * @param stream audio stream to attach
 */
export const attachAudioMedia = function (sdk: PureCloudWebrtcSdk, stream: MediaStream, audioElement?: HTMLAudioElement): void {
  if (!audioElement) {
    audioElement = createAudioMediaElement();
  }

  if (audioElement.srcObject) {
    log.call(sdk, LogLevels.warn, 'Attaching media to an audio element that already has a srcObject. This can result is audio issues.');
  }

  audioElement.autoplay = true;
  audioElement.srcObject = stream;
};

export const checkHasTransceiverFunctionality = function (): boolean {
  if (_hasTransceiverFunctionality !== null) {
    return _hasTransceiverFunctionality;
  }

  try {
    // make sure we are capable to use tracks
    const dummyRtcPeerConnection = new RTCPeerConnection();
    // if this function exists we should be good
    _hasTransceiverFunctionality = !!dummyRtcPeerConnection.getTransceivers;
  } catch (err) {
    _hasTransceiverFunctionality = false;
  }
  return _hasTransceiverFunctionality;
};

export const checkAllTracksHaveEnded = function (stream: MediaStream): boolean {
  let allTracksHaveEnded = true;
  stream.getTracks().forEach(function (t) {
    allTracksHaveEnded = t.readyState === 'ended' && allTracksHaveEnded;
  });
  return allTracksHaveEnded;
};

export const createNewStreamWithTrack = function (track: MediaStreamTrack): MediaStream {
  const newStream = new MediaStream();
  newStream.addTrack(track);
  return newStream;
};

function hasGetDisplayMedia (): boolean {
  return !!(window.navigator && window.navigator.mediaDevices && window.navigator.mediaDevices.getDisplayMedia);
}

function getScreenShareConstraints (): MediaStreamConstraints {
  if (browserama.isChromeOrChromium) {
    if (hasGetDisplayMedia()) {
      return {
        audio: false,
        video: true
      };
    }
    return {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          maxWidth: window.screen.width,
          maxHeight: window.screen.height,
          maxFrameRate: 15
        }
      } as MediaTrackConstraints
    };

  } else { /* if not chrome */
    return {
      audio: false,
      video: {
        mediaSource: 'window'
      } as MediaTrackConstraints
    };
  }
}

function getVideoConstraints (cameraOnly: boolean): MediaStreamConstraints {
  const constraints: any = {
    video: {},
    audio: {}
  };

  if (browserama.isChromeOrChromium) {
    constraints.video.googNoiseReduction = true;
    constraints.audio = {
      googAudioMirroring: false,
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      googDucking: false,
      googHighpassFilter: true
    };
  }

  if (cameraOnly) {
    constraints.audio = false;
  }

  return constraints;
}
