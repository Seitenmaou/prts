import './App.css';
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Home from "./pages/table-main";
import Navbar from "./components/navbar";

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
                <Route exact path="/" element={<Home operatorsData={operatorsData}/>}/>
            </Routes>
        </Router>
  );
}

export default App;
