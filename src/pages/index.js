import React, { useState } from "react";
import Select from 'react-select';
import './index.css'

const Home = ({operatorsData}) => {

    const [operatorsList, setOperatorsList] = useState(operatorsData);

    const [sortID, setSortID] = useState(true);
    const [sortNameAsc, setSortNameAsc] = useState(false);
    const sortFalseAll = () => {
        setSortNameAsc(false);
        setSortID(false);
    }
    const sortByID = () => {
        if (!sortID) {
            sortFalseAll();
            const sortedData = [...operatorsList].sort((a, b) => a['ID'] - (b['ID']));
            setOperatorsList(sortedData);
            setSortID(true);
        } else {
            sortFalseAll();
            const sortedData = [...operatorsList].sort((b, a) => a['ID'] - (b['ID']));
            setOperatorsList(sortedData);
        }
      };
    const sortByCodeName = () => {
        if (!sortNameAsc) {
            sortFalseAll();
            const sortedData = [...operatorsList].sort((a, b) => a['Code Name'].localeCompare(b['Code Name']));
            setOperatorsList(sortedData);
            setSortNameAsc(true);
        } else {
            sortFalseAll();
            const sortedData = [...operatorsList].sort((b, a) => a['Code Name'].localeCompare(b['Code Name']));
            setOperatorsList(sortedData);
        }
      };

      
      const [selectedClass, setSelectedClass] = useState([]);
      const [selectedJob, setSelectedJob] = useState([]);
      
      const filteredOperators = operatorsList.filter(operator => {
          // selectedClass.length === 0 || selectedClass.some(option => option.value === operator['Class'])
          const matchesClass = selectedClass.length === 0 || selectedClass.some(option => option.value === operator['Class']);
          const matchesJob = selectedJob.length === 0 || selectedJob.some(option => option.value === operator['Job']);
          return matchesClass && matchesJob;
        });
        
        const [classOptions, setClassOptions] = useState(Array.from(new Set(filteredOperators.map(operator => operator['Class']))).map(classType => ({
          value: classType,
          label: classType,
        })));
        const [jobOptions, setJobOptions] = useState(Array.from(new Set(filteredOperators.map(operator => operator['Job']))).map(jobType => ({
            value: jobType,
            label: jobType,
          })));

//somehow update others but not self
//when the current tab changes, filter only the other tabs


      const handleClassFilter = (selectedOptions) => {
        setSelectedClass(selectedOptions);
      };
      const handleJobFilter = (selectedOptions) => {
        setSelectedJob(selectedOptions);
      };


    return (
        <div>
            <h1>Primitive Rhodes Island Terminal Service: Operator Database</h1>
            <div>
    </div>
    <button onClick={sortByID}>Sort by ID</button>
    <br></br>
    
    <table>
        <thead>
          <tr>
            <th>
                Code Name
                <button onClick={sortByCodeName}>↕</button>
            </th>
            <th>Rarity</th>
            <th>
            <label>
            <Select
                isMulti
                options={classOptions}
                value={selectedClass}
                onChange={handleClassFilter}
                placeholder="Class"
                styles={{
                    control: (baseStyles, state) => ({
                        ...baseStyles,
                        width: '200px'
                })}}
            />
        </label></th>
        <th>
            <label>
            <Select
                isMulti
                options={jobOptions}
                value={selectedJob}
                onChange={handleJobFilter}
                placeholder="Job"
                styles={{
                    control: (baseStyles, state) => ({
                        ...baseStyles,
                        width: '200px'
                })}}
            />
        </label></th>
          </tr>
        </thead>
        <tbody>
          {filteredOperators.map((operator, index) => (
            <tr key={index}>
              <td>{operator['Code Name']}</td>
              <td>{operator['Rarity']}</td>
              <td>{operator['Class']}</td>
              <td>{operator['Job']}</td>
            </tr>
          ))}
        </tbody>
      </table>
        </div>
    );
};

export default Home;