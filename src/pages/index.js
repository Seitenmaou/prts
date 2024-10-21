import React from "react";

const Home = ({operatorsData}) => {
    return (
        <div>
            <h1>Primitive Rhodes Island Terminal Service: Operator Database</h1>
            <div>
      {operatorsData.map((operator, index) => (
          <li key={index}>{operator['Code Name']}</li> // No specific formatting, just displaying the JSON
        ))}
    </div>
        </div>
    );
};

export default Home;