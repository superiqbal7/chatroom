import styled from "styled-components";

export const Container = styled.div`
  height: 100vh;
  width: 50%;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Messages = styled.div`
  width: 100%;
  height: 60%;
  border: 1px solid black;
  margin-top: 10px;
  overflow: scroll;
`;

export const MessageBox = styled.textarea`
  width: 100%;
  height: 30%;
`;

export const Button = styled.button`
  width: 50%;
  border: 1px solid black;
  margin-top: 15px;
  margin-bottom: 15px;
  height: 5%;
  border-radius: 5px;
  cursor: pointer;
  background-color: black;
  color: white;
  font-size: 18px;
`;

export const MyRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

export const MyMessage = styled.div`
  width: 45%;
  background-color: #00929F;
  color: white;
  padding: 10px;
  margin-right: 5px;
  text-align: center;
  border-top-right-radius: 10%;
  border-bottom-right-radius: 10%;
`;

export const PartnerRow = styled(MyRow)`
  justify-content: flex-start;
`;

export const PartnerMessage = styled.div`
  width: 45%;
  background-color: #2C3435;
  color: white;
  border: 1px solid lightgray;
  padding: 10px;
  margin-left: 5px;
  text-align: center;
  border-top-left-radius: 10%;
  border-bottom-left-radius: 10%;
`;

export const RoomStatus = styled.div`

`;

export const RoomStatusText = styled.p`

`;
