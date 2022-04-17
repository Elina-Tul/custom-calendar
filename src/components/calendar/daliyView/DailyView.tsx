import React from 'react';
import Event from '../event/Event';
import IEvent from '../../../interfaces/events.interface';

const TOTAL_WIDTH = 600;

interface IEnrichedEvent extends IEvent {
  position: number,
  collidingEventsCounter: number,
  connectedEvents: IEvent,
}

type IConnectedEvent = {
  eventId: string | number,
  collideCount: number
}

type EnrichedEvent = { [key: string]: IEnrichedEvent };

type CollidingEventGroup = { [key: string]: IEnrichedEvent }[];

type ConnectedEvent = { [key: string] : IConnectedEvent };

function DailyView({ eventList } : { eventList : IEvent[] }) {
  const eventEnricher = (events : IEvent[]): EnrichedEvent => events.reduce((all, curr) => ({
    ...all,
    [curr.id]: {
      ...curr,
      position: undefined,
      collidingEventsCounter: 0,
      connectedEvents: {},
    },
  }), {});

  const collidedEventsByMinutes = (events: IEvent[]) : (number | string)[][] => {
    const minutesArray = new Array(720);

    for (let i = 0; i < minutesArray.length - 1; i += 1) {
      minutesArray[i] = [];
    }

    events.forEach((event) => {
      for (let i = event.start; i <= event.end - 1; i += 1) {
        minutesArray[i].push(event.id);
      }
    });

    return minutesArray;
  };

  const countEventsCollisionPerMinute = (collidedEventsByMinutesArray: (string | number)[][])
    : {[key:string]: number} => {
    const eventsCollisionCounter : { [key:string] : number } = {};

    collidedEventsByMinutesArray.forEach((collidedEventsByMinute) => {
      collidedEventsByMinute.forEach((eventId) => {
        const currentEventCollisionValue = eventsCollisionCounter[eventId] || 0;
        eventsCollisionCounter[eventId] = Math.max(
          currentEventCollisionValue,
          collidedEventsByMinute.length,
        );
      });
    });

    return eventsCollisionCounter;
  };

  const addCollidingGroups = (events: IEvent[], enrichedEvents : EnrichedEvent) => {
    const collidedEventsByMinutesArray = collidedEventsByMinutes(events);
    const collidedEventsCounter = countEventsCollisionPerMinute(collidedEventsByMinutesArray);

    collidedEventsByMinutesArray.forEach((collidedEvents) => {
      if (collidedEvents.length) {
        collidedEvents.forEach((eventId) => {
          const restCollidingEvents : ConnectedEvent = collidedEvents
            .reduce((allOverlapEvent : ConnectedEvent, currentOverlapEventId: string | number) => {
              if (currentOverlapEventId === eventId) {
                return allOverlapEvent;
              }
              return {
                ...allOverlapEvent,
                [currentOverlapEventId]: {
                  eventId: currentOverlapEventId,
                  collideCount: collidedEventsCounter[currentOverlapEventId],
                },
              };
            }, {});

          enrichedEvents[eventId].connectedEvents = {
            ...enrichedEvents[eventId].connectedEvents, ...restCollidingEvents,
          };
        });
      }
    });
  };

  function getCollidingGroups(events: IEvent[], enrichedEvents: EnrichedEvent)
  : CollidingEventGroup {
    const collidedEventsByMinutesArray = collidedEventsByMinutes(events);
    let group : { [key: string] : IEnrichedEvent } = {};
    const groups : CollidingEventGroup = [];
    collidedEventsByMinutesArray.forEach((collidedEvents) => {
      if (collidedEvents.length) {
        collidedEvents.forEach((collidedEventId) => {
          enrichedEvents[collidedEventId].collidingEventsCounter = Math.max(
            enrichedEvents[collidedEventId].collidingEventsCounter,
            collidedEvents.length,
          );
          group[collidedEventId] = enrichedEvents[collidedEventId];
        });
      } else {
        if (Object.keys(group).length) {
          groups.push(group);
        }
        group = {};
      }
    });

    // If end of minutes but las group not pushed yet
    if (Object.keys(group).length) {
      groups.push(group);
    }

    return groups;
  }

  const calculateCollidingEventsCounter = (collidingEventGroups: CollidingEventGroup) => {
    collidingEventGroups.forEach((collidingEventGroup) => {
      const maxCollidingEventsCounter = Object.values(collidingEventGroup)
        .reduce((totalCount, currentCollidingEvent) => Math.max(
          totalCount,
          currentCollidingEvent.collidingEventsCounter,
        ), 0);

      // for (const collidingEventId in collidingEventGroup) {
      Object.keys(collidingEventGroup).forEach((collidingEventId) => {
        collidingEventGroup[collidingEventId].collidingEventsCounter = maxCollidingEventsCounter;
      });
    });
  };

  const calculateEventPositionIndexes = (
    collidingEventGroups: CollidingEventGroup,
    enrichedEvents: EnrichedEvent,
  ) => {
    collidingEventGroups.forEach((collidingEventGroup) => {
      const [firstKey] = Object.keys(collidingEventGroup);
      const { collidingEventsCounter } = collidingEventGroup[firstKey];

      Object.values(collidingEventGroup).forEach((collidingEvent) => {
        const positionChecker = new Array(collidingEventsCounter);
        // for (const connectedEventId in enrichedEvents[collidingEvent.id].connectedEvents) {
        Object.keys(enrichedEvents[collidingEvent.id].connectedEvents).forEach(
          (connectedEventId) => {
            if (enrichedEvents[connectedEventId].position !== undefined) {
              positionChecker[enrichedEvents[connectedEventId].position] = true;
            }
          },
        );

        for (let i = 0; i < positionChecker.length; i += 1) {
          if (!positionChecker[i]) {
            enrichedEvents[collidingEvent.id].position = i;
            break;
          }
        }
      });
    });
  };

  const getEventStartPosition = (enrichedEvent : IEnrichedEvent) => {
    const avgEventWidth = TOTAL_WIDTH / enrichedEvent.collidingEventsCounter;
    return avgEventWidth * enrichedEvent.position;
  };
  const getEventWidth = (enrichedEvent : IEnrichedEvent) => {
    const avgEventWidth = TOTAL_WIDTH / enrichedEvent.collidingEventsCounter;
    return avgEventWidth;
  };

  const eventsToCalendarEvents = (events : IEvent[]) => {
    const enrichedEvents = eventEnricher(events);
    addCollidingGroups(events, enrichedEvents);
    const collidingEventGroups = getCollidingGroups(events, enrichedEvents);
    calculateCollidingEventsCounter(collidingEventGroups);
    calculateEventPositionIndexes(collidingEventGroups, enrichedEvents);
    return Object.values(enrichedEvents).map((enrichedEvent) => ({
      ...enrichedEvent,
      left: getEventStartPosition(enrichedEvent),
      width: getEventWidth(enrichedEvent),
    }));
  };

  const eventsToCalendar = eventsToCalendarEvents(eventList);

  return (
    <div className="daily-view">
      {eventsToCalendar.map((event) => <Event key={event.id} {...event} />)}
    </div>
  );
}

export default DailyView;
