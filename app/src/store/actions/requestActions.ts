import randomString from 'crypto-random-string';
import * as notificationActions from './notificationActions';

// This returns a redux-thunk action (a function).
export const notify = ({
  type = 'info',
  text,
  timeout,
}: {
  type?: string;
  text: string;
  timeout?: number;
}) => {
  if (!timeout) {
    switch (type) {
      case 'info':
        timeout = 3000;
        break;
      case 'error':
        timeout = 5000;
        break;
      default:
        timeout = 3000;
        break;
    }
  }

  const notification = {
    id: randomString({ length: 6 }).toLowerCase(),
    type: type,
    text: text,
    timeout: timeout,
  };

  return (dispatch) => {
    dispatch(notificationActions.addNotification(notification));

    setTimeout(() => {
      dispatch(notificationActions.removeNotification(notification.id));
    }, timeout);
  };
};
