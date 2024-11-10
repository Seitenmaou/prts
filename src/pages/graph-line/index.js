import React, { useEffect, useState } from 'react';
import Line from '../../components/graphs/line';

export default function GraphSunburst (operatorsData) {
  const [operatorsListMain, setOperatorsListMain] = useState(operatorsData?.operatorsData || [] );

  

  return (
    <div>
      <Line operatorsList={operatorsListMain} title={"LINE PIECE"}  keys={[1,2,3,4]}/>
    </div>
  )
}
