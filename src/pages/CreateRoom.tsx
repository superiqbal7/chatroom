import React from "react";

import { v4 as uuidv4 } from "uuid";

const CreateRoom = (props: any) => {
  function create() {
    const id = uuidv4();
    props.history.push(`/room/${id}`);
  }

  return (
    <div>
      <button onClick={create}>Create Room</button>
    </div>
  );
};

export default CreateRoom;
