import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import TimePanel from './timePanel/TimePanel';
import eventValidator from './utils/eventValidator';
import DailyView from './daliyView/DailyView';
import IEvent from '../../interfaces/events.interface';
import 'react-toastify/dist/ReactToastify.css';
import './calendar.scss';

export default function Calendar({ events } : { events: IEvent[] }) {
  const filteredEventsByValidation = events.filter((event) => {
    const validatedEvent = eventValidator(event);
    if (validatedEvent.errorMessage) {
      toast.error(`${validatedEvent.errorMessage} #ID: ${validatedEvent.id}`);
      return false;
    }
    return true;
  });

  return (
    <div className="calender-container">
      <TimePanel />
      <div className="calendar-wrapper">
        <DailyView eventList={filteredEventsByValidation} />
      </div>
      <ToastContainer position="bottom-center" />
    </div>
  );
}
