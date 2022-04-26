import React from 'react';
import Event from '../event/Event';
import IEvent from '../../../interfaces/events.interface';

const TOTAL_WIDTH = 600;

interface IEnrichedEvent extends IEvent {
  position: number,
  collidingEventsCounter: number,
  connectedEvents: IEvent,
  space: number
}

type IConnectedEvent = {
  eventId: string | number,
  collideCount: number
}

type EnrichedEvent = { [key: string]: IEnrichedEvent };

type Group = {
  maxLength: number,
  groupedEvents: {
    [key: string] : IEnrichedEvent
  }
}

type CollidingEventGroup = Group[];

type ConnectedEvent = { [key: string] : IConnectedEvent };

function DailyView({ eventList } : { eventList : IEvent[] }) {
  const eventEnricher = (events : IEvent[]): EnrichedEvent => events.reduce((all, curr) => ({
    ...all,
    [curr.id]: {
      ...curr,
      position: undefined,
      collidingEventsCounter: 0,
      connectedEvents: {},
      space: 0,
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

  const addConnectedEvents = (events: IEvent[], enrichedEvents : EnrichedEvent) => {
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
    let group : Group = {
      maxLength: 0,
      groupedEvents: {},
    };

    const groups : CollidingEventGroup = [];
    collidedEventsByMinutesArray.forEach((collidedEvents) => {
      if (collidedEvents.length) {
        collidedEvents.forEach((collidedEventId) => {
          group.maxLength = Math.max(
            group.maxLength,
            collidedEvents.length,
          );
          group.groupedEvents[collidedEventId] = enrichedEvents[collidedEventId];
        });
      } else {
        if (Object.keys(group.groupedEvents).length) {
          groups.push(group);
        }
        group = {
          maxLength: 0,
          groupedEvents: {},
        };
      }
    });

    // If end of minutes but las group not pushed yet
    if (Object.keys(group.groupedEvents).length) {
      groups.push(group);
    }

    return groups;
  }

  const calculateEventPositionIndexes = (
    collidingEventGroups: CollidingEventGroup,
    enrichedEvents: EnrichedEvent,
  ) => {
    collidingEventGroups.forEach((collidingEventGroup) => {
      const { groupedEvents, maxLength } = collidingEventGroup;
      Object.values(groupedEvents).forEach((collidingEvent) => {
        const positionChecker = new Array(maxLength);
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
            enrichedEvents[collidingEvent.id].collidingEventsCounter = maxLength;
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
    return avgEventWidth * enrichedEvent.space;
  };

  const checkForLeftSpace = (enrichedEvents: EnrichedEvent) => {
    Object.values(enrichedEvents).forEach((enrichedEvent) => {
      const arr = new Array(enrichedEvent.collidingEventsCounter);
      Object.values(enrichedEvent.connectedEvents).forEach((connectedEvent) => {
        arr[enrichedEvents[connectedEvent.eventId].position] = true;
      });
      for (let i = enrichedEvent.position; i < arr.length; i += 1) {
        if (arr[i]) {
          break;
        } else {
          enrichedEvent.space += 1;
        }
      }
    });
  };

  const eventsToCalendarEvents = (events : IEvent[]) => {
    const enrichedEvents = eventEnricher(events);
    addConnectedEvents(events, enrichedEvents);
    const collidingEventGroups = getCollidingGroups(events, enrichedEvents);
    calculateEventPositionIndexes(collidingEventGroups, enrichedEvents);
    checkForLeftSpace(enrichedEvents);
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
