import React from "react";

const ChatRoom = (props: any) => {
  function create() {
    let offer: any;
    let answer: any;

    const create = () => {
      const peer = new RTCPeerConnection();

      const dc = peer.createDataChannel("channel");

      dc.onmessage = (e) => {
        console.log("new message: " + e);
      };

      dc.onopen = (e) => {
        console.log("Connection opened!");
      };
      peer.onicecandidate = (e) => {
        "New Ice Candidate! reprinting SDP" +
          JSON.stringify(peer.localDescription);
        offer = peer.localDescription;
      };

      peer
        .createOffer()
        .then((o) => {
          peer.setLocalDescription(o);
        })
        .then((a) => {
          console.log("set successfully");
        });

      peer.setRemoteDescription(answer);
      dc.send("peer");
    };

    const join = () => {
      const rc = new RTCPeerConnection();
      let rcdc: any;
      rc.onicecandidate = (e) => {
        "New Ice Candidate! reprinting SDP" +
          JSON.stringify(rc.localDescription);
        answer = rc.localDescription;
      };

      rc.ondatachannel = (e) => {
        rcdc = e.channel;
        rcdc.onmessage = (msg: any) => {
          console.log("new message: " + msg.data);
        };
        rcdc.onopen = (e: any) => {
          console.log("connection opened");
        };
      };

      rc.setRemoteDescription(offer).then((a) => console.log("offer set"));

      rc.createAnswer()
        .then((a) => {
          rc.setLocalDescription(a);
          answer = a;
        })
        .then((a) => console.log("answer created"));
      rcdc.send("hola");
    };
  }

  return <div></div>;
};

export default ChatRoom;
