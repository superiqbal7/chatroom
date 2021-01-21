import React, { useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { Iconfiguration, Imessage } from "../interface/chatroom";
import {
  Container,
  Messages,
  MessageBox,
  Button,
  MyRow,
  MyMessage,
  PartnerRow,
  PartnerMessage,
  RoomStatus,
  RoomStatusText,
} from "./style";

const ChatRoom = (props: any) => {
  const sendChannel: any = useRef<RTCDataChannel>();
  const [text, setText] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [messages, setMessages] = useState<Imessage[]>([]);
  const [roomCreated, setRoomCreated] = useState<Boolean>(false);
  const [connectionStatus, setconnectionStatus] = useState<string>(
    "Not Connected"
  );
  const [joinRoomStatus, setJoinRoomStatus] = useState<Boolean>(false);

  let peerConnection: RTCPeerConnection;

  const configuration: Iconfiguration = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
      {
        urls: ["turn:numb.viagenie.ca"],
        credential: "muazkh",
        username: "webrtc@live.com",
      },
    ],
    iceCandidatePoolSize: 10,
  };

  //create a room
  async function createRoom() {
    const roomRef = await db.collection("rooms").doc();

    console.log("Create PeerConnection with configuration: ", configuration);
    //create peer connection
    peerConnection = new RTCPeerConnection(configuration);

    registerPeerConnectionListeners();

    //create data channel
    sendChannel.current = peerConnection.createDataChannel("sendChannel");
    console.log("created Datachannel" + sendChannel.current);

    //registerPeerConnectionListeners();

    // Code for collecting ICE candidates below
    const callerCandidatesCollection = roomRef.collection("callerCandidates");

    peerConnection.addEventListener("icecandidate", (event: any) => {
      if (!event.candidate) {
        console.log("Got final candidate!");
        return;
      }
      console.log("Got candidate: ", event.candidate);

      //adding icecandidate to db collection
      callerCandidatesCollection.add(event.candidate.toJSON());
    });
    // Code for collecting ICE candidates above

    // Code for creating a room below
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("Created offer:", offer);

    const roomWithOffer = {
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
    };
    await roomRef.set(roomWithOffer);

    //set room id
    if (roomRef) {
      setRoomId(roomRef.id);
      setRoomCreated(true);
      console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);
    }

    // Code for creating a room above

    // Listening for remote session description below
    roomRef.onSnapshot(async (snapshot: any) => {
      const data = snapshot.data();
      if (!peerConnection.currentRemoteDescription && data && data.answer) {
        console.log("Got remote description: ", data.answer);
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await peerConnection.setRemoteDescription(rtcSessionDescription);
      }
    });
    // Listening for remote session description above

    // Listen for remote ICE candidates below
    roomRef.collection("calleeCandidates").onSnapshot((snapshot: any) => {
      snapshot.docChanges().forEach(async (change: any) => {
        if (change.type === "added") {
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
    const roomRef: any = db.collection("rooms").doc(`${roomId}`);
    const roomSnapshot: any = await roomRef.get();
    console.log("Got room:", roomSnapshot.exists);

    if (roomSnapshot.exists) {
      setJoinRoomStatus(true);
      console.log("Create PeerConnection with configuration: ", configuration);
      peerConnection = new RTCPeerConnection(configuration);

      registerPeerConnectionListeners();

      peerConnection.ondatachannel = (event: any) => {
        sendChannel.current = event.channel;
        sendChannel.current.onmessage = handleReceiveMessage;
      };

      // Code for collecting ICE candidates below
      const calleeCandidatesCollection = roomRef.collection("calleeCandidates");
      peerConnection.addEventListener("icecandidate", (event: any) => {
        if (!event.candidate) {
          console.log("Got final candidate!");
          return;
        }
        console.log("Got candidate: ", event.candidate);
        calleeCandidatesCollection.add(event.candidate.toJSON());
      });
      // Code for collecting ICE candidates above

      // Code for creating SDP answer below
      const offer = roomSnapshot.data().offer;
      console.log("Got offer:", offer);
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.createAnswer();
      console.log("Created answer:", answer);
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
      roomRef.collection("callerCandidates").onSnapshot((snapshot: any) => {
        snapshot.docChanges().forEach(async (change: any) => {
          if (change.type === "added") {
            let data = change.doc.data();
            console.log(
              `Got new remote ICE candidate: ${JSON.stringify(data)}`
            );
            await peerConnection.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
      // Listening for remote ICE candidates above
    }
  }

  function registerPeerConnectionListeners() {
    peerConnection.addEventListener("icegatheringstatechange", () => {
      console.log(
        `ICE gathering state changed: ${peerConnection.iceGatheringState}`
      );
    });

    peerConnection.addEventListener("connectionstatechange", () => {
      setconnectionStatus(peerConnection.connectionState);
      console.log(`Connection state change: ${peerConnection.connectionState}`);
    });

    peerConnection.addEventListener("signalingstatechange", () => {
      console.log(`Signaling state change: ${peerConnection.signalingState}`);
    });

    peerConnection.addEventListener("iceconnectionstatechange ", () => {
      console.log(
        `ICE connection state change: ${peerConnection.iceConnectionState}`
      );
    });
  }

  //receive messasge and save on message state
  function handleReceiveMessage(e: any) {
    setMessages(() => [
      ...messages,
      {
        yours: false,
        value: e.data,
      },
    ]);
  }

  //send messages and save on message state
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
          <input
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            placeholder="room id"
          ></input>
          <button onClick={joinRoomById}>Join Room</button>
        </div>
      </div>
      <div>
        {roomCreated ? (
          <RoomStatus className="roomStatus">
            <RoomStatusText>New Room Created with id: {roomId}</RoomStatusText>
          </RoomStatus>
        ) : (
          ""
        )}
        {joinRoomStatus ? (
          <RoomStatus className="roomStatus">
            <RoomStatusText>Joined Room id: {roomId}</RoomStatusText>
          </RoomStatus>
        ) : (
          ""
        )}
      </div>
      <RoomStatus>
        <RoomStatusText>Connection Status: {connectionStatus}</RoomStatusText>
      </RoomStatus>
      <Messages>{messages.map(renderMessage)}</Messages>
      <MessageBox
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Say something....."
      />
      <Button onClick={sendMessage} disabled={connectionStatus !== "connected"}>
        Send..
      </Button>
    </Container>
  );
};

export default ChatRoom;
