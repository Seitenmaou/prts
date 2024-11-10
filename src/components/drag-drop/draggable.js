import React from 'react';
import {useDraggable} from '@dnd-kit/core';

export default function Draggable({ id }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : "",
    width: 100,
    height: 50,
    backgroundColor: "lightblue",
    margin: "10px",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {id}
    </div>
  );
}