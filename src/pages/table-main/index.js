import React, { useState } from 'react';
import TableFull from "../../components/tableFull"
import SunBustFull from "../../components/graphs/sunburstFull"

export default function Home (operatorsData) {
  const [operatorsListMain, setOperatorsListMain] = useState(operatorsData?.operatorsData || [] );
  const [operatorsList, setOperatorsList] = useState(operatorsListMain);
  return (
    <div>
      <SunBustFull operatorsList={operatorsListMain}/>
      <TableFull operatorsList={operatorsList}/>
    </div>
  )
}
