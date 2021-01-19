import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { db } from "../firebase";

const Container = styled.div`
  height: 100vh;
  width: 50%;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Messages = styled.div`
  width: 100%;
  height: 60%;
  border: 1px solid black;
  margin-top: 10px;
  overflow: scroll;
`;

const MessageBox = styled.textarea`
  width: 100%;
  height: 30%;
`;

const Button = styled.div`
  width: 50%;
  border: 1px solid black;
  margin-top: 15px;
  height: 5%;
  border-radius: 5px;
  cursor: pointer;
  background-color: black;
  color: white;
  font-size: 18px;
`;

const MyRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

const MyMessage = styled.div`
  width: 45%;
  background-color: blue;
  color: white;
  padding: 10px;
  margin-right: 5px;
  text-align: center;
  border-top-right-radius: 10%;
  border-bottom-right-radius: 10%;
`;

const PartnerRow = styled(MyRow)`
  justify-content: flex-start;
`;

const PartnerMessage = styled.div`
  width: 45%;
  background-color: grey;
  color: white;
  border: 1px solid lightgray;
  padding: 10px;
  margin-left: 5px;
  text-align: center;
  border-top-left-radius: 10%;
  border-bottom-left-radius: 10%;
`;

const ChatRoom = (props: any) => {

  const sendChannel: any = useRef();
  const [text, setText] = useState("");
  let [roomId, setRoomId]: any = useState("");
  const [messages, setMessages]: any = useState([]);

  const configuration = {
  iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  let peerConnection:any = null;

  //create a room
  async function createRoom() {

  const roomRef = await db.collection('rooms').doc();

  console.log('Create PeerConnection with configuration: ', configuration);
  //create peer connection
  peerConnection = new RTCPeerConnection(configuration);

  registerPeerConnectionListeners();

  //create data channel
  sendChannel.current = peerConnection.createDataChannel("sendChannel");

  //registerPeerConnectionListeners();

  // Code for collecting ICE candidates below
  const callerCandidatesCollection = roomRef.collection('callerCandidates');

  peerConnection.addEventListener('icecandidate', (event: any) => {
    if (!event.candidate) {
      console.log('Got final candidate!');
      return;
    }
    console.log('Got candidate: ', event.candidate);

    //adding icecandidate to db collection
    callerCandidatesCollection.add(event.candidate.toJSON());
  });
  // Code for collecting ICE candidates above

  // Code for creating a room below
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log('Created offer:', offer);

  const roomWithOffer = {
    'offer': {
      type: offer.type,
      sdp: offer.sdp,
    },
  };
  await roomRef.set(roomWithOffer);
  roomId = roomRef.id;
  console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);
  // Code for creating a room above

  // Listening for remote session description below
  roomRef.onSnapshot(async (snapshot: any) => {
    const data = snapshot.data();
    if (!peerConnection.currentRemoteDescription && data && data.answer) {
      console.log('Got remote description: ', data.answer);
      const rtcSessionDescription = new RTCSessionDescription(data.answer);
      await peerConnection.setRemoteDescription(rtcSessionDescription);
    }
  });
  // Listening for remote session description above

  // Listen for remote ICE candidates below
  roomRef.collection('calleeCandidates').onSnapshot((snapshot: any) => {
    snapshot.docChanges().forEach(async (change: any) => {
      if (change.type === 'added') {
        let data = change.doc.data();
        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
        await peerConnection.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
  // Listen for remote ICE candidates above

  //handle incoming messages
  sendChannel.current.onmessage = handleReceiveMessage;
}

async function joinRoomById() {
  const roomRef: any = db.collection('rooms').doc(`${roomId}`);
  const roomSnapshot: any = await roomRef.get();
  console.log('Got room:', roomSnapshot.exists);

  if (roomSnapshot.exists) {
    console.log('Create PeerConnection with configuration: ', configuration);
    peerConnection = new RTCPeerConnection(configuration);

    registerPeerConnectionListeners();

    peerConnection.ondatachannel = (event: any) => {
      sendChannel.current = event.channel;
      sendChannel.current.onmessage = handleReceiveMessage;
    }

    // Code for collecting ICE candidates below
    const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
    peerConnection.addEventListener('icecandidate', (event: any) => {
      if (!event.candidate) {
        console.log('Got final candidate!');
        return;
      }
      console.log('Got candidate: ', event.candidate);
      calleeCandidatesCollection.add(event.candidate.toJSON());
    });
    // Code for collecting ICE candidates above

    // Code for creating SDP answer below
    const offer = roomSnapshot.data().offer;
    console.log('Got offer:', offer);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    console.log('Created answer:', answer);
    await peerConnection.setLocalDescription(answer);

    const roomWithAnswer = {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    };
    await roomRef.update(roomWithAnswer);
    // Code for creating SDP answer above

    // Listening for remote ICE candidates below
    roomRef.collection('callerCandidates').onSnapshot((snapshot: any) => {
      snapshot.docChanges().forEach(async (change: any) => {
        if (change.type === 'added') {
          let data = change.doc.data();
          console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
          await peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
    // Listening for remote ICE candidates above
  }
}

function registerPeerConnectionListeners() {
  peerConnection.addEventListener('icegatheringstatechange', () => {
    console.log(
        `ICE gathering state changed: ${peerConnection.iceGatheringState}`);
  });

  peerConnection.addEventListener('connectionstatechange', () => {
    console.log(`Connection state change: ${peerConnection.connectionState}`);
  });

  peerConnection.addEventListener('signalingstatechange', () => {
    console.log(`Signaling state change: ${peerConnection.signalingState}`);
  });

  peerConnection.addEventListener('iceconnectionstatechange ', () => {
    console.log(
        `ICE connection state change: ${peerConnection.iceConnectionState}`);
  });
}

  function handleReceiveMessage(e: any) {
    setMessages(() => [
      ...messages,
      {
        yours: false,
        value: e.data,
      },
    ]);
  }

  //send messages
  function sendMessage() {
    sendChannel.current.send(text);
    setMessages((messages: any) => [
      ...messages,
      {
        yours: true,
        value: text,
      },
    ]);
    setText("");
  }

  function renderMessage(message: any, index: any) {
    if (message.yours) {
      return (
        <MyRow key={index}>
          <MyMessage>{message.value}</MyMessage>
        </MyRow>
      );
    }

    return (
      <PartnerRow key={index}>
        <PartnerMessage>{message.value}</PartnerMessage>
      </PartnerRow>
    );
  }

  return (
    <Container>
      <div>
        <button onClick={createRoom}>Create Room</button>
        <div>
          <input value={roomId} onChange={event => setRoomId(event.target.value)} placeholder="room id"></input>
          <button onClick={joinRoomById}>Join Room</button>
        </div>
      </div>
      <Messages>{messages.map(renderMessage)}</Messages>
      <MessageBox
        value={text}
        onChange={event => setText(event.target.value)}
        placeholder="Say something....."
      />
      <Button onClick={sendMessage}>Send..</Button>
    </Container>
  );
};

export default ChatRoom;
