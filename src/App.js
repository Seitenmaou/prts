import './App.css';
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Navbar from "./components/navbar";
import TablePage from "./pages/table_main";
import GraphSunburst from './pages/graph_sunburst';
import LinePage from './pages/graph_Line'
import OperatorDetails from './pages/operatorDetails';

function App() {

    const url = process.env.REACT_APP_DATABASE;

    const [operatorsData, setOperatorsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const result = await response.json();
          setOperatorsData(result);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Router>
            <Navbar />
            <Routes>
                <Route exact path="/table_page" element={<TablePage operatorsData={operatorsData}/>}/>
                <Route exact path="/graph_sunburst" element={<GraphSunburst operatorsData={operatorsData}/>}/>
                <Route exact path="/graph_line" element={<LinePage operatorsData={operatorsData}/>}/>
                <Route exact path="/:operatorId" element={<OperatorDetails operatorsData={operatorsData}/>}/>

            </Routes>
        </Router>
  );
}

export default App;
