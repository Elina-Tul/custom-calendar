import React from 'react';
import Calendar from '../calendar/Calendar';
import EVENTS from '../../const/events';
import './App.scss';

function App() {
  return (
    <div className="App">
      <Calendar events={EVENTS} />
    </div>
  );
}

export default App;
