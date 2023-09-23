 
 // Import the functions you need from the SDKs you need
 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
 import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
 
 // Your web app's Firebase configuration
 const firebaseConfig = {
   apiKey: "AIzaSyDq1fcL9GxuUw-JxCYNOHmK7IAx15FiD4g",
   authDomain: "ntpc-test.firebaseapp.com",
   databaseURL: "https://ntpc-test.firebaseio.com",
   projectId: "ntpc-test",
   storageBucket: "ntpc-test.appspot.com",
   messagingSenderId: "390567912142",
   appId: "1:390567912142:web:ebf686e301844d847d269f"
 };
 // Initialize Firebase
 const app = initializeApp(firebaseConfig);
 //get database
 const db = getDatabase(app);

 var UUID = (function () {
   var self = {};
   var lut = []; for (var i = 0; i < 256; i++) { lut[i] = (i < 16 ? '0' : '') + (i).toString(16); }
   self.generate = function () {
     var d0 = Math.random() * 0xffffffff | 0;
     var d1 = Math.random() * 0xffffffff | 0;
     var d2 = Math.random() * 0xffffffff | 0;
     var d3 = Math.random() * 0xffffffff | 0;
     return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
       lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
       lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
       lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
   }
   return self;
 })();


 const sbtButton = document.querySelector('button#insertBtn');
 sbtButton.addEventListener('click', insertData);

 //const val = UUID.generate();
 const val="779b3a28-acb1-4abc-a486-b5a6527c1633";
 
 var uuidText = document.querySelector('input#uuid');
 uuidText.value = val;
 console.log(val);
 uuidText.disabled = true;

 const name = document.querySelector('input#name');

 var result = document.querySelector('b#result');

 function insertData() {
   //write data
   set(ref(db, 'Customers/' + val), {
     CustomerName: name.value

   });
   result.innerHTML = "Data Inserted";
   console.log("Data Inserted");
   sbtButton.disabled = true;

 }

 //read data of Students collection and document 426
 //const studentsRef = ref(db, 'Students/' + "426/");
 //onValue(studentsRef, (snapshot) => {
  // const data = snapshot.val();
   //console.log(data.fname);
 //});


//Second Part----------------------------//

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Global State
const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;


//HTML elements
const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('webcamVideo');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');


callInput.value = val;

// 1. Setup media sources

webcamButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  remoteStream = new MediaStream();

  // Push tracks from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  pc.onnegotiationneeded = e => {
    if (pc.signalingState != "stable") return;
  
  }

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;

  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;

};


// 2. Create an offer
callButton.onclick = async () => {

  
  callInput.value = val;

  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    event.candidate &&  set(ref(db, 'Calls/' + val + "/offerCandidates/"), event.candidate.toJSON());
  };

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type
  };

  //save the offer in db
  set(ref(db, 'Calls/' + val +"/offer/"),offer);


  // Listen for remote answer
  const callAnswerRef = ref(db, 'Calls/' + val+ "/answer/");
  onValue(callAnswerRef, (snapshot) => {
    const data = snapshot.val();
    if (!pc.currentRemoteDescription && data != null) {
      const answerDescription = new RTCSessionDescription(data);
      pc.setRemoteDescription(answerDescription);
    }
    
  });

  //Listen for remote ICE candidates
  //When answered, add candidate to peer connection
  const answerCandidatesRef = ref(db, 'Calls/' + val +"/answerCandidates/");
  onValue(answerCandidatesRef, (snapshot) => {
    const data = snapshot.val();
    if(data != null){
      console.log("Answer Received: "+data);
      const candidate = new RTCIceCandidate(data);
      pc.addIceCandidate(candidate);
    }   
    
  });

 
  hangupButton.disabled = false;

};


// 3. Answer the call with the unique ID
answerButton.onclick = async () => {
  
  const callId = callInput.value;

  pc.onicecandidate = (event) => {
    
    event.candidate && set(ref(db, 'Calls/' + callId + "/answerCandidates/"), event.candidate.toJSON());
  };

  
  // Fetch data, then set the offer & answer
  const callOfferRef = ref(db, 'Calls/' + callId +"/offer/");
  onValue(callOfferRef, async (snapshot) => {
    const data = snapshot.val();
    console.log("Call Offer: " + data);
    const offerDescription = data;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  });

  //const offerDescription = callData.offer;
  //await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp
  };

  //await callDoc.update({ answer });
  set(ref(db, 'Calls/' + callId +"/answer/"),answer);


  const offerCandidatesRef = ref(db, 'Calls/' + callId +"/offerCandidates/");
  onValue(offerCandidatesRef, (snapshot) => {
    const data = snapshot.val();
    if ( data!=null){
      console.log("Offer Received: " + data);
      pc.addIceCandidate(new RTCIceCandidate(data));
    }

  });

};