import React, { useEffect, useState } from 'react';
import SunBustFull from "../../components/graphs/sunburstFull"
import { DndContext } from "@dnd-kit/core";
import Draggable from "../../components/drag-drop/draggable";
import Droppable from '../../components/drag-drop/droppable';

export default function GraphSunburst (operatorsData) {
  const [operatorsListMain, setOperatorsListMain] = useState(operatorsData?.operatorsData || [] );

  const sunBurstTitle = "Rhodes Island";

  const [graphProperties, setGraphProperties] = useState(["operatorRecords_class","operatorRecords_job","name_code"]);
  
  const dataKeys = {
    Operator: "name_code",
    Class: "operatorRecords_class",
    Job: "operatorRecords_job",
    Location: "affiliation_location",
    Organization: "affiliation_organization",
    Birth: "place_birth",
    Gender: "gender",
    Species: "species",
    Rarity: "operatorRecords_rarity",
  } 

  const [items, setItems] = useState({
    options: [
      "Organization",
      "Gender",
      "Birth",
      "Species",
      "Location",
      "Rarity"],
    graphed: [
      "Job",
      "Class",
    ],
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prevItems) => {
        const sourceSquare = Object.keys(prevItems).find((key) => prevItems[key].includes(active.id));
        const destinationSquare = over.id;

        if (sourceSquare && destinationSquare && sourceSquare !== destinationSquare) {
          return {
            ...prevItems,
            [sourceSquare]: prevItems[sourceSquare].filter((id) => id !== active.id),
            [destinationSquare]: [...prevItems[destinationSquare], active.id],
          };
        }
        return prevItems;
      });
    }
  };
  
  useEffect(()=>{
    setGraphProperties(items['graphed'].map(key => dataKeys[key]).reverse().concat(dataKeys["Operator"]))
  },[items])

  return (
    <div>
        <DndContext onDragEnd={handleDragEnd}>
      <div style={{ display: "flex", gap: "20px" }}>
        {Object.keys(items).map((squareId) => (
          <Droppable key={squareId} id={squareId}>
            {items[squareId].map((boxId) => (
              <Draggable key={boxId} id={boxId} />
            ))}
          </Droppable>
        ))}
      </div>
    </DndContext>
        <p>Order of placement does matter</p>
      <SunBustFull operatorsList={operatorsListMain} title={sunBurstTitle}  keys={graphProperties}/>
    </div>
  )
}
