import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

async function fetchName() {
  let name = 'inconnu';

  await fetch('http://localhost:8000/literal/', {
    method: 'GET'
  }).then(response => {
    name = response.text();
  }).catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
  });

  return name;
}

function App() {
  const [name, setName] = useState('inconnu');

  useEffect(() => {
    fetchName().then(fetchedName => {
      setName(fetchedName);
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Bonjour {name} let's go transcendance ça commence !!!
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          PONG !!!!!
        </a>
      </header>
    </div>
  );
}

export default App;
