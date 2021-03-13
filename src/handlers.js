/* eslint-disable no-param-reassign */

import _ from 'lodash';
import validate from './validator.js';
import { addPosts, getFeed } from './utils.js';

const markAsRead = (watchedState) => (evt) => {
  const { id } = evt.target.dataset;

  if (!id || watchedState.readPostsIds.has(id)) {
    return;
  }

  watchedState.readPostsIds.add(id);
  watchedState.lastReadPostId = id;
};

const rssAdd = (watchedState) => (evt) => {
  evt.preventDefault();
  watchedState.form.state = null;

  const formData = new FormData(evt.target);
  const url = formData.get('url');

  const validateError = validate(url, watchedState.feeds);

  if (validateError !== null) {
    watchedState.form.error = validateError;
    watchedState.form.state = 'unvalid';

    return;
  }

  watchedState.process.state = 'getting';

  getFeed(url)
    .then((feed) => {
      watchedState.process.error = null;
      watchedState.process.state = 'finished';
      watchedState.feeds.push(_.omit(feed, 'items'));

      addPosts(feed.items, watchedState.posts);
    })
    .catch((error) => {
      if (error.isAxiosError) {
        watchedState.process.error = 'networkError';
      } else {
        watchedState.process.error = 'parserError';
      }

      watchedState.process.state = 'failed';
    });
};

// prettier-ignore
export default {
  markAsRead, rssAdd,
};
