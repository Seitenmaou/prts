import React, { useState } from 'react';
import { useParams } from "react-router-dom";
import './operatorDetails.css'
import Plot from 'react-plotly.js';

export default function OperatorDetails (operatorsData) {
  const [operatorsList, setOperatorsList] = useState(operatorsData?.operatorsData || [] );
  const { operatorId } = useParams();

    const [compareId, setCompareId] = useState(null)
    const handleComparison = (event) => {

        setCompareId(operatorsList.find(operator => operator.name_code === event.target.value).ID);
      };

    const showAverageValues = true

    const [maxValues, setMaxValues] = useState(
        {
            maxHp: Math.max(...operatorsList.map(item => item.combat_hp)),
            maxAtk: Math.max(...operatorsList.map(item => item.combat_atk)),
            maxDef: Math.max(...operatorsList.map(item => item.combat_def)),
            maxRes: Math.max(...operatorsList.map(item => item.combat_res)),
            maxCldn: Math.max(...operatorsList.map(item => item.combat_cldn)),
            maxCost: Math.max(...operatorsList.map(item => item.combat_cost)),
            maxBlk: Math.max(...operatorsList.map(item => item.combat_blk)),
            maxAtkspd: Math.max(...operatorsList.map(item => item.combat_atkspd)),
        }
    )
    const [averageValues, setAverageValues] = useState(
        {
            avgHp: operatorsList.reduce((acc, item) => acc + item.combat_hp, 0) / operatorsList.length,
            avgAtk: operatorsList.reduce((acc, item) => acc + item.combat_atk, 0) / operatorsList.length,
            avgDef: operatorsList.reduce((acc, item) => acc + item.combat_def, 0) / operatorsList.length,
            avgRes: operatorsList.reduce((acc, item) => acc + item.combat_res, 0) / operatorsList.length,
            avgCldn: operatorsList.reduce((acc, item) => acc + item.combat_cldn, 0) / operatorsList.length,
            avgCost: operatorsList.reduce((acc, item) => acc + item.combat_cost, 0) / operatorsList.length,
            avgBlk: operatorsList.reduce((acc, item) => acc + Number(item.combat_blk), 0) / operatorsList.length,
            avgAtkspd: operatorsList.reduce((acc, item) => acc + item.combat_atkspd, 0) / operatorsList.length,
        }
    )

  var data = [{
    type: 'scatterpolar',
    r: [
        operatorsList[operatorId].combat_hp / maxValues.maxHp,
        operatorsList[operatorId].combat_atk / maxValues.maxAtk,
        operatorsList[operatorId].combat_def / maxValues.maxDef,
        operatorsList[operatorId].combat_res / maxValues.maxRes,
        (maxValues.maxCldn - operatorsList[operatorId].combat_cldn) / maxValues.maxCldn,
        operatorsList[operatorId].combat_cost / maxValues.maxCost,
        operatorsList[operatorId].combat_blk / maxValues.maxBlk,
        operatorsList[operatorId].combat_atkspd / maxValues.maxAtkspd,
        operatorsList[operatorId].combat_hp / maxValues.maxHp,
    ],
    theta: [
        'Hit Points',
        'Attack',
        'Defense',
        'Resistance',
        'Redeploy',
        'Cost',
        'Block',
        'Attack Speed',
        'Hit Points'

    ],
    fill: 'toself',
    name: operatorsList[operatorId].name_code
    }]


    if (showAverageValues){
        data.push(
            {
                type: 'scatterpolar',
                r: [
                    averageValues.avgHp / maxValues.maxHp,
                    averageValues.avgAtk / maxValues.maxAtk,
                    averageValues.avgDef / maxValues.maxDef,
                    averageValues.avgRes / maxValues.maxRes,
                    (maxValues.maxCldn - averageValues.avgCldn) / maxValues.maxCldn,
                    averageValues.avgCost / maxValues.maxCost,
                    averageValues.avgBlk / maxValues.maxBlk,
                    averageValues.avgAtkspd / maxValues.maxAtkspd,
                    averageValues.avgHp / maxValues.maxHp,
                ],
                theta: [
                    'Hit Points', 
                    'Attack' ,
                    'Defense' ,
                    'Resistance' ,
                    'Redeploy' ,
                    'Cost' ,
                    'Block' ,
                    'Attack Speed',
                    'Hit Points'
                ],
                // fill: 'toself',
                name: 'Average'
            }
        )
    }

    if (compareId !== null){
        data.push(
            {
                type: 'scatterpolar',
                r: [
                    operatorsList[compareId].combat_hp / maxValues.maxHp,
                    operatorsList[compareId].combat_atk / maxValues.maxAtk,
                    operatorsList[compareId].combat_def / maxValues.maxDef,
                    operatorsList[compareId].combat_res / maxValues.maxRes,
                    (maxValues.maxCldn - operatorsList[compareId].combat_cldn) / maxValues.maxCldn,
                    operatorsList[compareId].combat_cost / maxValues.maxCost,
                    operatorsList[compareId].combat_blk / maxValues.maxBlk,
                    operatorsList[compareId].combat_atkspd / maxValues.maxAtkspd,
                    operatorsList[compareId].combat_hp / maxValues.maxHp
                ],
                theta: [
                    'Hit Points', 
                    'Attack' ,
                    'Defense' ,
                    'Resistance' ,
                    'Redeploy' ,
                    'Cost' ,
                    'Block' ,
                    'Attack Speed',
                    'Hit Points'
                ],
                // fill: 'toself',
                name: operatorsList[compareId].name_code
            }
        )
    }
  
  var layout = {
    polar: {
      radialaxis: {
        visible: false,
        range: [0, 1]
      }
    },
    showlegend: true
  }


  return (
    <div class='container'>
        <div id='nonCompareableDetails'>
            <div id='mainDetails'>
                <div id='photo'>
                    
                </div>
                <ul id='mainDetail'>
                    <li>Code Name: {operatorsList[operatorId].name_code}</li>

                </ul>
            </div>
            <div id='backgroundInfo'>
            <ul>
                    <li>Real Name: {operatorsList[operatorId].name_real}</li>
                    <li>Operator Code:  {operatorsList[operatorId].code}</li>
                    <li>Date Joined: {operatorsList[operatorId].date_joined}</li>
                    <li>Gender: {operatorsList[operatorId].gender} </li>
                    <li>Species: {operatorsList[operatorId].species} </li>
                    <li>Affiliation: {operatorsList[operatorId].affiliation_location} </li>
                    <li>Organization: {operatorsList[operatorId].affiliation_organization} </li>
                    <li>Birth Place: {operatorsList[operatorId].place_birth} </li>
                    <li>Birth Date: {operatorsList[operatorId].date_birth} </li>
                </ul>
            </div>
        </div>
        <div id='compareableDetails'>
            <div id='statusGraph'>
            <Plot data={data} layout={layout} />
            </div>

            <select value={compareId} onChange={handleComparison}>
                <option value="">Select an option</option>
                {operatorsList.map(operator => (
                <option key={operator.id} value={operator.id}>
                    {operator.name_code}
                </option>
                ))}
            </select>
            <p>Selected Option ID: {compareId}</p>
            <div id='skillGraph'>

            </div>
            <div id='basicStats'>
            <ul>
                    <li>Rarity: {operatorsList[operatorId].operatorRecords_rarity}</li>
                    <li>Class: {operatorsList[operatorId].operatorRecords_class}</li>
                    <li>Job: {operatorsList[operatorId].operatorRecords_job} </li> 
                    <li>Experience: {operatorsList[operatorId].experience_combat} Years</li> 
                    <li>Height: {operatorsList[operatorId].height} centimeters</li>
                    <li>Oripathy: {operatorsList[operatorId].medical_oripathy} </li>
                    <li>Fusion: {operatorsList[operatorId].medical_fusion} %</li>
                    <li>Blood Ratio: {operatorsList[operatorId].medical_bloodRatio}/mL</li>
                </ul>
            </div>
        </div>
    </div>
  )
}
