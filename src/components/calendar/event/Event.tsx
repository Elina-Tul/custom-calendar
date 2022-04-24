import React from 'react';
import IEvent from '../../../interfaces/events.interface';
import './event.scss';

export default function Event({
  id, start, end, left, width,
}: IEvent) {
  const isShowTitle = (end - start) >= 20;
  const isShowSubTitle = (end - start) >= 30;

  return (
    <div
      title={isShowTitle ? undefined : `Sample Item ${id}`}
      className="calender-event"
      style={{
        top: `${start}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${end - start}px`,
      }}
    >
      <div className="vertical-line" />
      <div className="description-wrapper">
        {isShowTitle && (
        <div className="title">
          Sample Item
          {' '}
          {id}
        </div>
        )}
        {isShowSubTitle && <div className="sub-title">Sample Item</div>}
      </div>
    </div>
  );
}
