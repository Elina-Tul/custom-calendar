interface IEvent {
  id: number | string
  start: number
  end: number
  left?: number
  width?: number
}

export default IEvent;
