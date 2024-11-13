import React, { useState } from 'react';
import { useParams } from "react-router-dom";
import './operatorDetails.css'
import Plot from 'react-plotly.js';
import Select from 'react-select'
import CompareStats from '../components/compare'

export default function OperatorDetails (operatorsData) {
  const [operatorsList, setOperatorsList] = useState(operatorsData?.operatorsData || [] );
  const { operatorId } = useParams();

    const operatorOptions = operatorsList.map(operator => ({
        value: operator.ID,
        label: operator.name_code
    }));

    const [compareId, setCompareId] = useState(null)
    const handleComparison = (selectedOption) => {
        setCompareId(selectedOption.value);
    };
    const removeCompare = () => setCompareId(null)

    const [showAverage, setShowAverage] = useState(false)
    const toggleAverage = () => setShowAverage(!showAverage)

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

    let statsData = [{
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
    // fill: 'toself',
    name: operatorsList[operatorId].name_code
    }]


    const skillsConversion = {
        'UNKNOWN': 0,
        'NOT APPLICABLE': 0,
        'Flawed': 1,
        'Normal': 2,
        'Standard': 3,
        'Excellent': 4,
        'Outstanding': 5,
        'REDACTED': 6
    }
    
    let maxSkill = -Infinity;
    for (const [skill, level] of Object.entries(skillsConversion)) {
    if (level > maxSkill) {
        maxSkill = level;
    }
    }
    const namesToSkip = ['Rosmontis']
    const indicesToSkip = operatorsList .map((operator, index) => namesToSkip.includes(operator.name_code) ? index : -1).filter(index => index !== -1);

    const [averageSkills, setAverageSkills] = useState(
        {
            avgStr: operatorsList.filter((_, index) => !indicesToSkip.includes(index)).reduce((acc, item) => acc + skillsConversion[item.skills_strength], 0) / (operatorsList.length - indicesToSkip.length),
            avgMbl: operatorsList.filter((_, index) => !indicesToSkip.includes(index)).reduce((acc, item) => acc + skillsConversion[item.skills_mobility], 0) / (operatorsList.length - indicesToSkip.length),
            avgEnd: operatorsList.filter((_, index) => !indicesToSkip.includes(index)).reduce((acc, item) => acc + skillsConversion[item.skills_endurance], 0) / (operatorsList.length - indicesToSkip.length),
            avgTcAc: operatorsList.filter((_, index) => !indicesToSkip.includes(index)).reduce((acc, item) => acc + skillsConversion[item.skills_tacticalAcumen], 0) / (operatorsList.length - indicesToSkip.length),
            avgCbt: operatorsList.filter((_, index) => !indicesToSkip.includes(index)).reduce((acc, item) => acc + skillsConversion[item.skills_combat], 0) / (operatorsList.length - indicesToSkip.length),
            avgArt: operatorsList.filter((_, index) => !indicesToSkip.includes(index)).reduce((acc, item) => acc + skillsConversion[item.skills_artsAdaptability], 0) / (operatorsList.length - indicesToSkip.length),
        }
    )
    let skillsData = []
    if (operatorId == operatorsList.find(operator => operator.name_code === 'Rosmontis').ID){
        
        skillsData.push(
            {
                type: 'scatterpolar',
                r: [
                    skillsConversion[operatorsList[operatorId].skills_strength.substring(0,operatorsList[operatorId].skills_strength.indexOf('/'))],
                    skillsConversion[operatorsList[operatorId].skills_mobility.substring(0,operatorsList[operatorId].skills_mobility.indexOf('/'))],
                    skillsConversion[operatorsList[operatorId].skills_endurance.substring(0,operatorsList[operatorId].skills_endurance.indexOf('/'))],
                    skillsConversion[operatorsList[operatorId].skills_tacticalAcumen.substring(0,operatorsList[operatorId].skills_tacticalAcumen.indexOf('/'))],
                    skillsConversion[operatorsList[operatorId].skills_combat.substring(0,operatorsList[operatorId].skills_combat.indexOf('/'))],
                    skillsConversion[operatorsList[operatorId].skills_artsAdaptability.substring(0,operatorsList[operatorId].skills_artsAdaptability.indexOf('/'))],
                    skillsConversion[operatorsList[operatorId].skills_strength.substring(0,operatorsList[operatorId].skills_strength.indexOf('/'))],
                ],
                theta: [
                    'Strength',
                    'Mobility',
                    'Endurance',
                    'Tactical',
                    'Combat',
                    'Arts',
                    'Strength'
                ],
                // fill: 'toself',
                name: operatorsList[operatorId].name_code
                },
                {
                    type: 'scatterpolar',
                    r: [
                        skillsConversion[operatorsList[operatorId].skills_strength.substring(operatorsList[operatorId].skills_strength.indexOf('/')+1,operatorsList[operatorId].skills_strength.length)],
                        skillsConversion[operatorsList[operatorId].skills_mobility.substring(operatorsList[operatorId].skills_mobility.indexOf('/')+1,operatorsList[operatorId].skills_mobility.length)],
                        skillsConversion[operatorsList[operatorId].skills_endurance.substring(operatorsList[operatorId].skills_endurance.indexOf('/')+1,operatorsList[operatorId].skills_endurance.length)],
                        skillsConversion[operatorsList[operatorId].skills_tacticalAcumen.substring(operatorsList[operatorId].skills_tacticalAcumen.indexOf('/')+1,operatorsList[operatorId].skills_tacticalAcumen.length)],
                        skillsConversion[operatorsList[operatorId].skills_combat.substring(operatorsList[operatorId].skills_combat.indexOf('/')+1,operatorsList[operatorId].skills_combat.length)],
                        skillsConversion[operatorsList[operatorId].skills_artsAdaptability.substring(operatorsList[operatorId].skills_artsAdaptability.indexOf('/')+1,operatorsList[operatorId].skills_artsAdaptability.length)],
                        skillsConversion[operatorsList[operatorId].skills_strength.substring(operatorsList[operatorId].skills_strength.indexOf('/')+1,operatorsList[operatorId].skills_strength.length)],
                    ],
                    theta: [
                        'Strength',
                        'Mobility',
                        'Endurance',
                        'Tactical',
                        'Combat',
                        'Arts',
                        'Strength'
                    ],
                    // fill: 'toself',
                    name: operatorsList[operatorId].name_code + ' 2'
                    }
            )
        } else skillsData.push({
            type: 'scatterpolar',
            r: [
                skillsConversion[operatorsList[operatorId].skills_strength],
                skillsConversion[operatorsList[operatorId].skills_mobility],
                skillsConversion[operatorsList[operatorId].skills_endurance],
                skillsConversion[operatorsList[operatorId].skills_tacticalAcumen],
                skillsConversion[operatorsList[operatorId].skills_combat],
                skillsConversion[operatorsList[operatorId].skills_artsAdaptability],
                skillsConversion[operatorsList[operatorId].skills_strength],
            ],
            theta: [
                'Strength',
                'Mobility',
                'Endurance',
                'Tactical',
                'Combat',
                'Arts',
                'Strength'
            ],
        // fill: 'toself',
        name: operatorsList[operatorId].name_code
        })
    var skillsLayout = {
        polar: {
            radialaxis: {
                visible: false,
                range: [0, maxSkill]
            }
        },
        height: 400,
        width: 400,
        showlegend: false
    }
    

    if (compareId !== null){
        statsData.push(
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
        if (compareId === operatorsList.find(operator => operator.name_code === 'Rosmontis').ID){
            skillsData.push(
                {
                    type: 'scatterpolar',
                    r: [
                        skillsConversion[operatorsList[compareId].skills_strength.substring(0,operatorsList[compareId].skills_strength.indexOf('/'))],
                        skillsConversion[operatorsList[compareId].skills_mobility.substring(0,operatorsList[compareId].skills_mobility.indexOf('/'))],
                        skillsConversion[operatorsList[compareId].skills_endurance.substring(0,operatorsList[compareId].skills_endurance.indexOf('/'))],
                        skillsConversion[operatorsList[compareId].skills_tacticalAcumen.substring(0,operatorsList[compareId].skills_tacticalAcumen.indexOf('/'))],
                        skillsConversion[operatorsList[compareId].skills_combat.substring(0,operatorsList[compareId].skills_combat.indexOf('/'))],
                        skillsConversion[operatorsList[compareId].skills_artsAdaptability.substring(0,operatorsList[compareId].skills_artsAdaptability.indexOf('/'))],
                        skillsConversion[operatorsList[compareId].skills_strength.substring(0,operatorsList[compareId].skills_strength.indexOf('/'))],
                    ],
                    theta: [
                        'Strength',
                        'Mobility',
                        'Endurance',
                        'Tactical',
                        'Combat',
                        'Arts',
                        'Strength'
                    ],
                    // fill: 'toself',
                    name: operatorsList[compareId].name_code
                    },
                    {
                        type: 'scatterpolar',
                        r: [
                            skillsConversion[operatorsList[compareId].skills_strength.substring(operatorsList[compareId].skills_strength.indexOf('/')+1,operatorsList[compareId].skills_strength.length)],
                skillsConversion[operatorsList[compareId].skills_mobility.substring(operatorsList[compareId].skills_mobility.indexOf('/')+1,operatorsList[compareId].skills_mobility.length)],
                skillsConversion[operatorsList[compareId].skills_endurance.substring(operatorsList[compareId].skills_endurance.indexOf('/')+1,operatorsList[compareId].skills_endurance.length)],
                skillsConversion[operatorsList[compareId].skills_tacticalAcumen.substring(operatorsList[compareId].skills_tacticalAcumen.indexOf('/')+1,operatorsList[compareId].skills_tacticalAcumen.length)],
                skillsConversion[operatorsList[compareId].skills_combat.substring(operatorsList[compareId].skills_combat.indexOf('/')+1,operatorsList[compareId].skills_combat.length)],
                skillsConversion[operatorsList[compareId].skills_artsAdaptability.substring(operatorsList[compareId].skills_artsAdaptability.indexOf('/')+1,operatorsList[compareId].skills_artsAdaptability.length)],
                skillsConversion[operatorsList[compareId].skills_strength.substring(operatorsList[compareId].skills_strength.indexOf('/')+1,operatorsList[compareId].skills_strength.length)],
                        ],
                        theta: [
                            'Strength',
                            'Mobility',
                            'Endurance',
                            'Tactical',
                            'Combat',
                            'Arts',
                            'Strength'
                        ],
                        // fill: 'toself',
                        name: operatorsList[compareId].name_code + ' 2'
                        }
            )
        } else {
            skillsData.push(
                {
                    type: 'scatterpolar',
                    r: [
                        skillsConversion[operatorsList[compareId].skills_strength],
                        skillsConversion[operatorsList[compareId].skills_mobility],
                        skillsConversion[operatorsList[compareId].skills_endurance],
                        skillsConversion[operatorsList[compareId].skills_tacticalAcumen],
                        skillsConversion[operatorsList[compareId].skills_combat],
                        skillsConversion[operatorsList[compareId].skills_artsAdaptability],
                        skillsConversion[operatorsList[compareId].skills_strength],
                    ],
                    theta: [
                        'Strength',
                        'Mobility',
                        'Endurance',
                        'Tactical',
                        'Combat',
                        'Arts',
                        'Strength'
                    ],
                    // fill: 'toself',
                    name: operatorsList[operatorId].name_code
                    }
            )
        }   
    }

    if (showAverage){
        statsData.push(
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
        skillsData.push(
            {
                type: 'scatterpolar',
                r: [
                    averageSkills.avgStr,
                    averageSkills.avgMbl,
                    averageSkills.avgEnd,
                    averageSkills.avgTcAc,
                    averageSkills.avgCbt,
                    averageSkills.avgArt,
                    averageSkills.avgStr,
                ],
                theta: [
                    'Strength',
                    'Mobility',
                    'Endurance',
                    'Tactical',
                    'Combat',
                    'Arts',
                    'Strength'
                ],
                // fill: 'toself',
                name: 'Average'
                }
        )
    }

  var statsLayout = {
    polar: {
      radialaxis: {
        visible: false,
        range: [0, 1]
      }
    },
    height: 400,
    width: 400,
    showlegend: false
  }

  return (
    <div className='container'>
        <div id='nonCompareableDetailsMain'>
            <div id='mainDetails'>
                <div id='photo'>
                    No image available
                </div>
            </div>
            <div id='backgroundInfo'>
            <ul>
            <li>Code Name: {operatorsList[operatorId].name_code}</li>
                <li>Real Name: {operatorsList[operatorId].name_real}</li>
                <li>Operator Code:  {operatorsList[operatorId].code}</li>
                <li>Date Joined: {operatorsList[operatorId].date_joined}</li>
                <li>Affiliation: {operatorsList[operatorId].affiliation_location} </li>
                <li>Organization: {operatorsList[operatorId].affiliation_organization} </li>
                <li>Gender: {operatorsList[operatorId].gender} </li>
                <li>Species: {operatorsList[operatorId].species} </li>
                <li>Birth Place: {operatorsList[operatorId].place_birth} </li>
                <li>Birth Date: {operatorsList[operatorId].date_birth} </li>
                </ul>
            </div>
        </div>
        <div id='compareableDetails'>
            <div id='statusGraph'>
                <Plot data={statsData} layout={statsLayout} />
            </div>
            <button onClick={toggleAverage}>Show Average</button>
            <Select options={operatorOptions} onChange={handleComparison}/>
            <button onClick={removeCompare}>Remove Comparison</button>
            <div className='comparableStats' id='combatStats'>
                <ul>
                    <li>Rarity: {compareId === null ? operatorsList[operatorId].operatorRecords_rarity : <CompareStats compareId={compareId} firstNum ={operatorsList[operatorId].operatorRecords_rarity} secondNum={operatorsList[compareId].operatorRecords_rarity} invert={false}/>}</li>
                    <li>HP: {compareId === null ? operatorsList[operatorId].combat_hp : <CompareStats compareId={compareId} firstNum ={operatorsList[operatorId].combat_hp} secondNum={operatorsList[compareId].combat_hp} invert={false}/>}</li>
                    <li>ATK: {compareId === null ? operatorsList[operatorId].combat_atk : <CompareStats compareId={compareId} firstNum ={operatorsList[operatorId].combat_atk} secondNum={operatorsList[compareId].combat_atk} invert={false}/>}</li>
                    <li>DEF: {compareId === null ? operatorsList[operatorId].combat_def : <CompareStats compareId={compareId} firstNum ={operatorsList[operatorId].combat_def} secondNum={operatorsList[compareId].combat_def} invert={false}/>}</li>
                    <li>RES: {compareId === null ? operatorsList[operatorId].combat_res : <CompareStats compareId={compareId} firstNum ={operatorsList[operatorId].combat_res} secondNum={operatorsList[compareId].combat_res} invert={false}/>}</li>
                    <li>CLDN: {compareId === null ? operatorsList[operatorId].combat_cldn : <CompareStats compareId={compareId} firstNum ={operatorsList[operatorId].combat_cldn} secondNum={operatorsList[compareId].combat_cldn} invert={true}/>}</li>
                    <li>COST: {compareId === null ? operatorsList[operatorId].combat_cost : <CompareStats compareId={compareId} firstNum ={operatorsList[operatorId].combat_cost} secondNum={operatorsList[compareId].combat_cost} invert={true}/>}</li>
                    <li>BLK: {compareId === null ? operatorsList[operatorId].combat_blk : <CompareStats compareId={compareId} firstNum ={operatorsList[operatorId].combat_blk} secondNum={operatorsList[compareId].combat_blk} invert={false}/>}</li>
                    <li>ATKSPD: {compareId === null ? operatorsList[operatorId].combat_atkspd.toFixed(2).replace(/[.,]00$/, "") : <CompareStats compareId={compareId} firstNum ={operatorsList[operatorId].combat_atkspd} secondNum={operatorsList[compareId].combat_atkspd} invert={false}/>}</li>
                </ul>
            </div>
            <div id='skillGraph'>
            <Plot data={skillsData} layout={skillsLayout} />
            </div>
            <div className='comparableStats' id='basicStats'>
            <ul>
                    <li>Class: {operatorsList[operatorId].operatorRecords_class + ((compareId === null) ? '' : (' <=> ' + operatorsList[compareId].operatorRecords_class))}</li>
                    <li>Job: {operatorsList[operatorId].operatorRecords_job + ((compareId === null) ? '' : (' <=> ' + operatorsList[compareId].operatorRecords_job))}</li> 
                    <li>Experience(yrs): {operatorsList[operatorId].experience_combat + ((compareId === null) ? '' : (' <=> ' + operatorsList[compareId].experience_combat))}</li> 
                    <li>Height(cm): {operatorsList[operatorId].height + ((compareId === null) ? '' : (' <=> ' + operatorsList[compareId].height))}</li>
                    <li>Oripathy: {operatorsList[operatorId].medical_oripathy + ((compareId === null) ? '' : (' <=> ' + operatorsList[compareId].medical_oripathy))}</li>
                    <li>Fusion(%): {operatorsList[operatorId].medical_fusion + ((compareId === null) ? '' : (' <=> ' + operatorsList[compareId].medical_fusion))}</li>
                    <li>Blood Ratio(u/L): {operatorsList[operatorId].medical_bloodRatio + ((compareId === null) ? '' : (' <=> ' + operatorsList[compareId].medical_bloodRatio))}</li>
                </ul>
            </div>
        </div>{compareId !==null &&
            <div id='nonCompareableDetailsMain'>
                <div id='mainDetails'>
                    <div id='photo'>
                        No image available
                    </div>
                </div>
                <div id='backgroundInfo'>
                <ul>
                <li>Code Name: {operatorsList[compareId].name_code}</li>
                    <li>Real Name: {operatorsList[compareId].name_real}</li>
                    <li>Operator Code:  {operatorsList[compareId].code}</li>
                    <li>Date Joined: {operatorsList[compareId].date_joined}</li>
                    <li>Affiliation: {operatorsList[compareId].affiliation_location} </li>
                    <li>Organization: {operatorsList[compareId].affiliation_organization} </li>
                    <li>Gender: {operatorsList[compareId].gender} </li>
                    <li>Species: {operatorsList[compareId].species} </li>
                    <li>Birth Place: {operatorsList[compareId].place_birth} </li>
                    <li>Birth Date: {operatorsList[compareId].date_birth} </li>
                    </ul>
                </div>
            </div>
        }
    </div>
  )
}
