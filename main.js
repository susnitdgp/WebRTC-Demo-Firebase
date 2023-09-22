let localConnection;
let remoteConnection;
let sendChannel;
let receiveChannel;
let fileReader;


const bitrateDiv = document.querySelector('div#bitrate');

const fileInput = document.querySelector('input#fileInput');
const abortButton = document.querySelector('button#abortButton');

const downloadAnchor = document.querySelector('a#download');
const sendProgress = document.querySelector('progress#sendProgress');
const receiveProgress = document.querySelector('progress#receiveProgress');
const statusMessage = document.querySelector('span#status');


const sendFileButton = document.querySelector('button#sendFile');

sendFileButton.addEventListener('click', () => createConnection());

fileInput.addEventListener('change', handleFileInputChange, false);

abortButton.addEventListener('click', () => {
  if (fileReader && fileReader.readyState === 1) {
    console.log('Abort read!');
    fileReader.abort();
  }
});


async function handleFileInputChange() {
    const file = fileInput.files[0];
    if (!file) {
      console.log('No file chosen');
    } else {
      sendFileButton.disabled = false;
    }
  }


  async function createConnection() {
    abortButton.disabled = false;
    sendFileButton.disabled = true;
    localConnection = new RTCPeerConnection();
    console.log('Created local peer connection object localConnection');
  
    sendChannel = localConnection.createDataChannel('sendDataChannel');
    sendChannel.binaryType = 'arraybuffer';
    console.log('Created send data channel');
  
    sendChannel.addEventListener('open', onSendChannelStateChange);
    sendChannel.addEventListener('close', onSendChannelStateChange);
    sendChannel.addEventListener('error', onError);
  
    localConnection.addEventListener('icecandidate', async event => {
      console.log('Local ICE candidate: ', event.candidate);
      await remoteConnection.addIceCandidate(event.candidate);
    });
  
    remoteConnection = new RTCPeerConnection();
    console.log('Created remote peer connection object remoteConnection');
  
    remoteConnection.addEventListener('icecandidate', async event => {
      console.log('Remote ICE candidate: ', event.candidate);
      await localConnection.addIceCandidate(event.candidate);
    });
    remoteConnection.addEventListener('datachannel', receiveChannelCallback);
  
    try {
      const offer = await localConnection.createOffer();
      await gotLocalDescription(offer);
    } catch (e) {
      console.log('Failed to create session description: ', e);
    }
  
    fileInput.disabled = true;
  }
  