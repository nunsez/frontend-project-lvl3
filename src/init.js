import axios from 'axios';
import * as yup from 'yup';
import i18next from 'i18next';
import _ from 'lodash';
import resources from './locales/index.js';
import parse from './parsers.js';
import initView from './view.js';

const getProxiedUrl = (url) => {
  const proxyName = 'https://hexlet-allorigins.herokuapp.com';
  const params = { disableCache: true, url };

  const proxy = new URL('/get', proxyName);
  const searchParams = new URLSearchParams(params);
  proxy.search = searchParams;

  return proxy.href;
};

// prettier-ignore
const getContent = (url) => axios
  .get(getProxiedUrl(url))
  .then((response) => {
    if (response.status !== 200) {
      throw new Error('no internet');
    }

    return response.data;
  });

const getFeed = (url) => getContent(url).then((data) => parse(data.contents, url));

const validate = (url, collection) => {
  const feedLinks = collection.map(({ link }) => link);
  const schema = yup.string().url().notOneOf(feedLinks);

  try {
    schema.validateSync(url);
    return '';
  } catch (error) {
    return error.message;
  }
};

const rssAddHandle = (watchedState, i18n) => (evt) => {
  evt.preventDefault();

  const formData = new FormData(evt.target);
  const url = formData.get('url');
  const validateError = validate(url, watchedState.rss.feeds);

  if (validateError !== '') {
    watchedState.rss.feedback = { type: 'error', message: validateError };
    return;
  }

  watchedState.rss.processState = 'getting';

  getFeed(url)
    .catch((error) => {
      const errorType = error.message === 'no internet' ? 'networkError' : 'parserError';

      watchedState.rss.processState = 'filling';
      watchedState.rss.feedback = { type: 'error', message: i18n.t(`errors.${errorType}`) };
    })
    .then((feed) => {
      if (!feed) {
        return;
      }

      watchedState.rss.processState = 'filling';

      const newestGuid = _.head(feed.items).guid;
      const uniquedPosts = feed.items.map((item) => ({ ...item, id: _.uniqueId() }));

      watchedState.rss.feeds.push({ ...feed, newestGuid, items: undefined });
      watchedState.rss.posts.unshift(...uniquedPosts);
      watchedState.rss.feedback = { type: 'success', message: i18n.t('success.downloaded') };
    });
};

const getNewPosts = (watchedState, delay) => {
  const promises = watchedState.rss.feeds.map(({ link }) => getFeed(link));

  Promise.allSettled(promises).then((results) => {
    const fulfilledFeeds = results
      .filter((result) => result.status === 'fulfilled')
      .map(({ value }) => value);

    fulfilledFeeds.forEach((incomingFeed) => {
      const { items } = incomingFeed;
      const currentFeed = watchedState.rss.feeds.find((feed) => feed.link === incomingFeed.link);

      const lastPostInState = items.find(({ guid }) => guid === currentFeed.newestGuid);
      const lastPostIndex = items.indexOf(lastPostInState);
      const newPosts = items.slice(0, lastPostIndex);

      if (_.isEmpty(newPosts)) {
        return;
      }

      const uniquedPosts = newPosts.map((item) => ({ ...item, id: _.uniqueId() }));

      watchedState.rss.posts.unshift(...uniquedPosts);
      currentFeed.newestGuid = _.head(newPosts).guid;
    });
  });

  setTimeout(() => getNewPosts(watchedState, delay), delay);
};

const init = (i18n) => {
  const updateInterval = 5000;
  const state = {
    rss: {
      // filling, getting
      processState: 'filling',
      feedback: {
        // error, success
        type: null,
        message: null,
      },
      feeds: [],
      posts: [],
    },
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

  elements.form.main.addEventListener('submit', rssAddHandle(watchedState, i18n));

  setTimeout(() => getNewPosts(watchedState, updateInterval));
};

export default () => {
  const defaultLanguage = 'ru';
  const i18n = i18next.createInstance();

  i18n
    .init({
      lng: defaultLanguage,
      debug: true,
      resources,
    })
    .then(() => {
      yup.setLocale({
        string: {
          url: i18n.t('errors.invalidUrl'),
        },
        mixed: {
          notOneOf: i18n.t('errors.alreadyExist'),
        },
      });

      init(i18n);
    });
};
