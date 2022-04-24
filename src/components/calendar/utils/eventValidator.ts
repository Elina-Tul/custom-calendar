import IEvent from '../../../interfaces/events.interface';
import IValidatedEvent from '../../../interfaces/validatedEvent.interface';

const ERROR_MESSAGES = {
  WRONG_OR_MISSING: 'Error: wrong or missing `{p}` value',
  WRONG_BOUNDARY: 'Error: wrong or missing time period of event',
  OUT_OF_BOUNDARY: 'Error: you are out of the daily calendar scope [0 - 720]) ({p})',
};

const customReplace = (validationResultMessage: string, value: string) : string => validationResultMessage.replace('{p}', value);

function eventValidator(event: IEvent) : IValidatedEvent {
  const validationResult = <IValidatedEvent>{ id: event.id };

  if (Number.isNaN(+event.id)) {
    validationResult.errorMessage = customReplace(ERROR_MESSAGES.WRONG_OR_MISSING, 'id');
    return validationResult;
  }

  if (Number.isNaN(event.start)) {
    validationResult.errorMessage = customReplace(ERROR_MESSAGES.WRONG_OR_MISSING, 'start');
    return validationResult;
  }

  if (Number.isNaN(event.end)) {
    validationResult.errorMessage = customReplace(ERROR_MESSAGES.WRONG_OR_MISSING, 'end');
    return validationResult;
  }

  if (event.start >= event.end) {
    validationResult.errorMessage = ERROR_MESSAGES.WRONG_BOUNDARY;
    return validationResult;
  }

  if (event.start < 0 || event.start > 720 || event.end < 0 || event.end > 720) {
    validationResult.errorMessage = customReplace(ERROR_MESSAGES.OUT_OF_BOUNDARY, `start:${event.start}, end: ${event.end}`);
    return validationResult;
  }

  validationResult.event = event;

  return validationResult;
}

export default eventValidator;
