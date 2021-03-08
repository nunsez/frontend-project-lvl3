import axios from 'axios';
import * as yup from 'yup';
import i18next from 'i18next';
import _ from 'lodash';
import 'bootstrap';
import resources from './locales/index.js';
import parse from './parsers.js';
import initView from './view.js';

const addPosts = (posts, collection) => {
  const uniquedPosts = posts.map((item) => ({ ...item, id: _.uniqueId() }));
  collection.unshift(...uniquedPosts);
};

const getProxiedUrl = (url) => {
  const proxyName = 'https://hexlet-allorigins.herokuapp.com';
  const params = { disableCache: true, url };

  const proxy = new URL('/get', proxyName);
  const searchParams = new URLSearchParams(params);
  proxy.search = searchParams;

  return proxy.href;
};

// prettier-ignore
const getFeed = (url) => (
  axios.get(getProxiedUrl(url)).then(({ data }) => parse(data.contents, url))
);

const rssAddHandle = (watchedState, validate) => (evt) => {
  evt.preventDefault();

  const formData = new FormData(evt.target);
  const url = formData.get('url');

  try {
    validate(url, watchedState.feeds);
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
  } catch (validateError) {
    watchedState.form.error = validateError;
    watchedState.form.state = 'unvalid';
  }
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
        const newPosts = _.differenceBy(incomingPosts, currentPosts, 'guid');

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

const init = (i18n) => {
  const schema = yup.string().url();
  const updateInterval = 5000;
  const state = {
    process: {
      // finished, getting, failed, ready
      state: 'ready',
      error: null,
    },
    form: {
      // valid, unvalid
      state: 'valid',
      error: null,
    },
    feeds: [],
    posts: [],
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

  const validate = (url, collection) => {
    const feedLinks = collection.map(({ link }) => link);

    return schema.notOneOf(feedLinks).validateSync(url);
  };

  elements.form.main.addEventListener('submit', rssAddHandle(watchedState, validate));

  setTimeout(() => getNewPosts(watchedState, updateInterval));
};

export default () => {
  const defaultLanguage = 'ru';
  const i18n = i18next.createInstance();

  i18n
    .init({
      lng: defaultLanguage,
      resources,
    })
    .then(() => {
      yup.setLocale({
        string: {
          url: i18n.t('errors.unvalidUrl'),
        },
        mixed: {
          notOneOf: i18n.t('errors.alreadyExist'),
        },
      });

      init(i18n);
    });
};
