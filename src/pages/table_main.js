import React, { useState } from 'react';
import TableFull from "../components/tables/tableFull"

export default function Home (operatorsData) {
  const [operatorsListMain, setOperatorsListMain] = useState(operatorsData?.operatorsData || [] );
  
  return (
    <div>
      <TableFull operatorsListMain={operatorsListMain}/>
    </div>
  )
}
