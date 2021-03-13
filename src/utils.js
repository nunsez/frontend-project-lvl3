/* eslint-disable no-param-reassign */

import _ from 'lodash';
import axios from 'axios';
import parse from './parsers.js';

const getProxiedUrl = (url) => {
  const proxy = 'https://hexlet-allorigins.herokuapp.com';
  const params = { disableCache: true, url };

  const proxyUrl = new URL('/get', proxy);
  const searchParams = new URLSearchParams(params);
  proxyUrl.search = searchParams;

  return proxyUrl.toString();
};

// prettier-ignore
const getFeed = (url) => (
  axios.get(getProxiedUrl(url)).then(({ data }) => parse(data.contents, url))
);

const addPosts = (posts, collection) => {
  const uniquedPosts = posts.map((item) => ({ ...item, id: _.uniqueId() }));
  collection.unshift(...uniquedPosts);
};

const markAsRead = (titleEl) => {
  titleEl.classList.remove('font-weight-bold');
  titleEl.classList.add('font-weight-normal');
};

const fillModalWithContent = (modal, item) => {
  modal.title.textContent = item.title;
  modal.body.textContent = item.description;
  modal.redirect.href = item.link;
};

const getNewPosts = (watchedState, delay) => {
  const promises = watchedState.feeds.map(({ link }) => getFeed(link));

  Promise.allSettled(promises)
    .then((results) => {
      const fulfilledFeeds = results
        .filter((result) => result.status === 'fulfilled')
        .map(({ value }) => value);

      fulfilledFeeds.forEach((incomingFeed) => {
        const { items: incomingPosts } = incomingFeed;
        const currentPosts = watchedState.posts;
        const newPosts = _.differenceBy(incomingPosts, currentPosts, 'link');

        if (_.isEmpty(newPosts)) {
          return;
        }

        addPosts(newPosts, currentPosts);
      });
    })
    .finally(() => {
      setTimeout(() => getNewPosts(watchedState, delay), delay);
    });
};

// prettier-ignore
export {
  getFeed, addPosts, markAsRead, fillModalWithContent, getNewPosts,
};
