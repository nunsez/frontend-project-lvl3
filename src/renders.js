/* eslint-disable no-param-reassign */

import { fillModalWithContent } from './utils.js';

const feedback = (element, message = '', type = 'success') => {
  element.textContent = message;

  switch (type) {
    case 'error':
      element.classList.add('text-danger');
      break;

    case 'success':
      element.classList.remove('text-danger');
      element.classList.add('text-success');
      break;

    default:
      break;
  }
};

const valid = (elements, { state, error }, i18n) => {
  switch (state) {
    case 'valid':
      feedback(elements.feedback);
      break;

    case 'unvalid': {
      const message = i18n.t(error.message);
      feedback(elements.feedback, message, 'error');
      break;
    }

    // clear previous state before validate
    case null:
      break;

    default:
      throw new Error(`Unknown validation state: ${state}!`);
  }
};

const feeds = (elements, collection, i18n) => {
  const header = document.createElement('h2');
  header.textContent = i18n.t('feeds');

  const feedList = document.createElement('ul');
  feedList.classList.add('list-group', 'mb-5');

  collection.forEach((item) => {
    const feed = document.createElement('li');
    feed.classList.add('list-group-item');

    const feedHeader = document.createElement('h3');
    feedHeader.textContent = item.title;

    const feedDescription = document.createElement('p');
    feedDescription.textContent = item.description;

    feed.append(feedHeader, feedDescription);
    feedList.prepend(feed);
  });

  elements.feeds.innerHTML = '';
  elements.feeds.append(header, feedList);
};

const posts = (elements, collection, appState, i18n) => {
  const header = document.createElement('h2');
  header.textContent = i18n.t('posts');

  const fragment = document.createDocumentFragment();

  const postsList = document.createElement('ul');
  postsList.classList.add('list-group');

  collection.forEach((item) => {
    const { title, link, id } = item;

    const post = document.createElement('li');
    post.classList.add('list-group-item', 'd-flex');
    post.classList.add('justify-content-between', 'align-items-start');

    const fontWeightType = appState.readPostsIds.has(id) ? 'normal' : 'bold';
    const titleEl = document.createElement('a');
    titleEl.textContent = title;
    titleEl.classList.add(`font-weight-${fontWeightType}`);
    titleEl.setAttribute('href', link);
    titleEl.setAttribute('target', '_blank');
    titleEl.setAttribute('rel', 'noopener noreferrer');
    titleEl.dataset.id = id;

    const watchButton = document.createElement('button');
    watchButton.textContent = i18n.t('inspect');
    watchButton.classList.add('btn', 'btn-primary', 'btn-sm');
    watchButton.setAttribute('type', 'button');
    watchButton.dataset.id = id;
    watchButton.dataset.toggle = 'modal';
    watchButton.dataset.target = '#modal';

    watchButton.addEventListener('click', () => fillModalWithContent(elements.modal, item));

    post.append(titleEl, watchButton);
    fragment.append(post);
  });

  elements.posts.innerHTML = '';
  postsList.append(fragment);
  elements.posts.append(header, postsList);
};

// prettier-ignore
export default {
  feedback, valid, feeds, posts
};
