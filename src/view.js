/* eslint-disable no-param-reassign */

import onChange from 'on-change';
import render from './renders.js';
import { markAsRead } from './utils.js';

export default (elements, appState, i18n) => {
  const processStateHandle = ({ state, error }) => {
    const { form, feedback } = elements;

    switch (state) {
      case 'getting':
        render.feedback(feedback);

        form.button.disabled = true;
        form.input.setAttribute('readonly', true);
        form.input.classList.remove('is-invalid');
        break;

      case 'finished': {
        const message = i18n.t('success.downloaded');
        render.feedback(feedback, message);

        form.button.disabled = false;
        form.input.removeAttribute('readonly');
        form.input.classList.remove('is-invalid');
        form.main.reset();
        form.input.focus();
        break;
      }

      case 'failed': {
        const message = i18n.t(`errors.${error}`);
        render.feedback(feedback, message, 'error');

        form.button.disabled = false;
        form.input.removeAttribute('readonly');
        form.input.classList.add('is-invalid');
        break;
      }

      default:
        throw new Error(`Unknown process state: ${state}!`);
    }
  };

  const watchedState = onChange(appState, (path, value) => {
    switch (path) {
      case 'form.state':
        render.valid(elements, watchedState.form, i18n);
        break;

      case 'process.state':
        processStateHandle(watchedState.process);
        break;

      case 'feeds':
        render.feeds(elements, value, i18n);
        break;

      case 'posts':
        render.posts(elements, value, appState, i18n);
        break;

      case 'lastReadPostId': {
        const titleEl = elements.posts.querySelector(`a[data-id="${value}"]`);
        markAsRead(titleEl);
        break;
      }

      default:
        break;
    }
  });

  return watchedState;
};
