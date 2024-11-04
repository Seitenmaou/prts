import React, { useState } from 'react';
import TableFull from "../../components/table-full"

export default function Home (operatorsData) {
  const [operatorsListMain, setOperatorsListMain] = useState(operatorsData?.operatorsData || [] );
  const [operatorsList, setOperatorsList] = useState(operatorsListMain);
  return (
    <TableFull operatorsList={operatorsList}/>
  )
}
