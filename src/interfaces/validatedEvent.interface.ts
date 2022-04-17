import IEvent from './events.interface';

interface IValidatedEvent {
  id: number | string
  errorMessage?: string
  event: IEvent
}

export default IValidatedEvent;
