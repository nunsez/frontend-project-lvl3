import Modal from 'bootstrap.native/dist/components/modal-native.js';
import onChange from 'on-change';

const markAsRead = (element, item) => {
  const titleEl = element.querySelector('a');
  titleEl.classList.remove('font-weight-bold');
  titleEl.classList.add('font-weight-normal');

  item.alreadyRead = true;
};

const fillModalWithContent = (modal, item) => {
  modal.title.textContent = item.title;
  modal.body.textContent = item.description;
  modal.redirect.href = item.link;
};

const renderFeedback = (feedback, message = '', type = 'success') => {
  feedback.textContent = message;

  switch (type) {
    case 'error':
      feedback.classList.add('text-danger');
      break;

    case 'success':
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      break;

    default:
      break;
  }
};

const renderValid = (elements, { state, error }) => {
  switch (state) {
    case 'valid':
      renderFeedback(elements.feedback);
      break;

    case 'unvalid': {
      renderFeedback(elements.feedback, error.message, 'error');
      break;
    }

    default:
      break;
  }
};

export default (elements, appState, i18n) => {
  const renderFeeds = (collection) => {
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

  const renderPosts = (collection) => {
    const modal = new Modal(elements.modal.main);

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

      const titleEl = document.createElement('a');
      titleEl.textContent = title;
      titleEl.classList.add('font-weight-bold');
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

      titleEl.addEventListener('click', () => markAsRead(post, item));
      watchButton.addEventListener('click', () => {
        fillModalWithContent(elements.modal, item);
        markAsRead(post, item);
        modal.show();
      });

      post.append(titleEl, watchButton);
      fragment.append(post);
    });

    elements.posts.innerHTML = '';
    postsList.append(fragment);
    elements.posts.append(header, postsList);
  };

  const processStateHandle = (processState) => {
    const { state, error } = processState;
    const { form, feedback } = elements;

    switch (state) {
      case 'getting':
        renderFeedback(feedback);

        form.button.disabled = true;
        form.input.setAttribute('readonly', true);
        form.input.classList.remove('is-invalid');
        break;

      case 'finished': {
        const message = i18n.t('success.downloaded');
        renderFeedback(feedback, message);

        form.button.disabled = false;
        form.input.removeAttribute('readonly');
        form.input.classList.remove('is-invalid');
        form.main.reset();
        form.input.focus();
        break;
      }

      case 'failed': {
        const message = i18n.t(`errors.${error}`);
        renderFeedback(feedback, message, 'error');

        form.button.disabled = false;
        form.input.removeAttribute('readonly');
        form.input.classList.add('is-invalid');
        break;
      }

      default:
        throw new Error(`Unknown state: ${processState}!`);
    }
  };

  const watchedState = onChange(appState, (path, value) => {
    switch (path) {
      case 'rss.valid':
        renderValid(elements, value);
        break;

      case 'rss.process':
        processStateHandle(value);
        break;

      case 'rss.feeds':
        renderFeeds(value);
        break;

      case 'rss.posts':
        renderPosts(value);
        break;

      default:
        break;
    }
  });

  return watchedState;
};
