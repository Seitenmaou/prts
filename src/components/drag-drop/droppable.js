import React from 'react';
import {useDroppable} from '@dnd-kit/core';

export default function Droppable({ id, children, onDrop }) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const style = {
    width: 400,
    height: 200,
    backgroundColor: isOver ? "lightgreen" : "lightgrey",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid black",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}