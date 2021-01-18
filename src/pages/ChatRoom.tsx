import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import styled from "styled-components";

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
  const peerRef: any = useRef();
  const sendChannel: any = useRef();
  const [text, setText] = useState("");
  const [messages, setMessages]: any = useState([]);
  const socketRef: any = useRef();
  const otherUser: any = useRef();

  useEffect(() => {
    socketRef.current = io("http://localhost:8000");
    socketRef.current.emit("join room", props.match.params.roomID);

    socketRef.current.on("other user", (userID: any) => {
      callUser(userID);
      otherUser.current = userID;
    });

    socketRef.current.on("user joined", (userID: any) => {
      otherUser.current = userID;
    });

    socketRef.current.on("offer", handleOffer);

    socketRef.current.on("answer", handleAnswer);

    socketRef.current.on("ice-candidate", handleNewICECandidateMsg);
  }, []);

  function callUser(userID: string) {
    peerRef.current = createPeer(userID);

    sendChannel.current = peerRef.current.createDataChannel("sendChannel");
    sendChannel.current.onmessage = handleReceiveMessage;
  }

  function createPeer(userID?: string) {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = handleICECandidateEvent;
    peerConnection.onnegotiationneeded = () =>
      handleNegotiationNeededEvent(userID);

    return peerConnection;
  }

  function handleICECandidateEvent(e: any) {
    if (e.candidate) {
      const payload = {
        target: otherUser.current,
        candidate: e.candidate,
      };
      socketRef.current.emit("ice-candidate", payload);
    }
  }

  function handleNegotiationNeededEvent(userID: any) {
    peerRef.current
      .createOffer()
      .then((offer: any) => {
        return peerRef.current.setLocalDescription(offer);
      })
      .then(() => {
        const payload = {
          target: userID,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit("offer", payload);
      })
      .catch((e: any) => console.log(e));
  }

  function handleReceiveMessage(e: any) {
    setMessages((message: []) => [
      ...message,
      {
        yours: false,
        value: e.data,
      },
    ]);
  }

  function handleOffer(incoming: any) {
    peerRef.current = createPeer();

    peerRef.current.ondatachannel = (event: any) => {
      sendChannel.current = event.channel;
      sendChannel.current.onmessage = handleReceiveMessage;
    };

    const desc = new RTCSessionDescription(incoming.sdp);
    peerRef.current
      .setRemoteDescription(desc)
      .then(() => {})
      .then(() => {
        return peerRef.current.createAnswer();
      })
      .then((answer: any) => {
        return peerRef.current.setLocalDescription(answer);
      })
      .then(() => {
        const payload = {
          target: incoming.caller,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit("answer", payload);
      });
  }

  function handleAnswer(message: any) {
    const desc = new RTCSessionDescription(message.sdp);
    peerRef.current
      .setRemoteDescription(desc)
      .catch((e: any) => console.log(e));
  }

  function handleNewICECandidateMsg(incoming: any) {
    const candidate = new RTCIceCandidate(incoming);

    peerRef.current
      .addIceCandidate(candidate)
      .catch((e: any) => console.log(e));
  }

  function handleChange(e: any) {
    setText(e.target.value);
  }

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
      <Messages>{messages.map(renderMessage)}</Messages>
      <MessageBox
        value={text}
        onChange={handleChange}
        placeholder="Say something....."
      />
      <Button onClick={sendMessage}>Send..</Button>
    </Container>
  );
};

export default ChatRoom;
