import moment from 'moment';
import { writable } from 'svelte/store';

const { subscribe, update } = writable({
  changeHandler: () => {},
  date: '',
  dateView: '',
  show: false,
});

export default {
  hide: () =>
    update(({ changeHandler, date, dateView }) => {
      return { changeHandler, date, dateView, show: false };
    }),
  nextMonth: () =>
    update(({ changeHandler, date, dateView, show }) => {
      return {
        changeHandler,
        date,
        dateView: moment(dateView, 'MM.DD.YYYY')
          .add(1, 'months')
          .format('MM.DD.YYYY'),
        show,
      };
    }),
  onChange: changeHandler => 
    update(({date, dateView, show}) => {
      return {
        changeHandler,
        date,
        dateView,
        show
      }
    }),
  prevMonth: () =>
    update(({ changeHandler, date, dateView, show }) => {
      return {
        changeHandler,
        date,
        dateView: moment(dateView, 'MM.DD.YYYY')
          .subtract(1, 'months')
          .format('MM.DD.YYYY'),
        show,
      };
    }),
  setDate: v => {
    update(({ changeHandler, show }) => {
      return { changeHandler, date: v, dateView: v, show };
    });
  },
  show: () =>
    update(({ changeHandler, date, dateView }) => {
      return { changeHandler, date, dateView, show: true };
    }),
  subscribe,
};
