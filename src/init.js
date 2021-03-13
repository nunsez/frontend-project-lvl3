/* eslint-disable no-param-reassign */

import * as yup from 'yup';
import i18next from 'i18next';
import 'bootstrap';
import resources from './locales/index.js';
import initView from './view.js';
import handler from './handlers.js';
import { getNewPosts } from './utils.js';

const init = (i18n) => {
  const updateInterval = 5000;
  const state = {
    process: {
      // ready, getting, finished, failed
      state: 'ready',
      error: null,
    },
    form: {
      // null, valid, unvalid
      state: null,
      error: null,
    },
    feeds: [],
    posts: [],
    lastReadPostId: null,
    readPostsIds: new Set(),
  };
  const elements = {
    modal: {
      main: document.querySelector('#modal'),
      title: document.querySelector('#modal .modal-title'),
      body: document.querySelector('#modal .modal-body'),
      redirect: document.querySelector('#modal a'),
    },
    form: {
      main: document.querySelector('form.rss-form'),
      input: document.querySelector('form.rss-form input'),
      button: document.querySelector('form.rss-form button'),
    },
    feeds: document.querySelector('.container-fluid .feeds'),
    posts: document.querySelector('.container-fluid .posts'),
    feedback: document.querySelector('.container-fluid .feedback'),
  };

  const watchedState = initView(elements, state, i18n);

  elements.form.main.addEventListener('submit', handler.rssAdd(watchedState));
  elements.posts.addEventListener('click', handler.markAsRead(watchedState));

  setTimeout(() => getNewPosts(watchedState, updateInterval));
};

export default () => {
  const defaultLanguage = 'ru';
  const i18n = i18next.createInstance();

  return i18n
    .init({
      lng: defaultLanguage,
      resources,
    })
    .then(() => {
      yup.setLocale({
        string: {
          url: 'errors.unvalidUrl',
        },
        mixed: {
          notOneOf: 'errors.alreadyExist',
        },
      });

      init(i18n);
    });
};
