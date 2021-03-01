import Modal from 'bootstrap.native/dist/components/modal-native.esm.js';
import onChange from 'on-change';
import i18n from 'i18next';

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

const renderFeedback = (elements, value) => {
    const { type, message } = value;
    const { form, feedback } = elements;
    const { url: input } = form.elements;

    feedback.textContent = message;

    switch (type) {
        case 'error':
            feedback.classList.add('text-danger');
            input.classList.add('is-invalid');
            break;

        case 'success':
            input.classList.remove('is-invalid');
            feedback.classList.remove('text-danger');
            feedback.classList.add('text-success');
            break;

        default:
            break;
    }
};

const renderFeeds = (container, collection) => {
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

    container.innerHTML = '';
    container.append(header, feedList);
};

const renderPosts = (elements, collection) => {
    const modal = new Modal(elements.modal.main);

    const header = document.createElement('h2');
    header.textContent = i18n.t('posts');

    const fragment = document.createDocumentFragment();

    const postsList = document.createElement('ul');
    postsList.classList.add('list-group');

    collection.forEach((item) => {
        const { title, link, id } = item;

        const post = document.createElement('li');
        // prettier-ignore
        post.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');

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

export default (elements, state) => {
    const watchedState = onChange(state, (path, value) => {
        switch (path) {
            case 'rss.feeds':
                renderFeeds(elements.feeds, value);
                elements.form.reset();
                break;

            case 'rss.posts':
                renderPosts(elements, value);
                break;

            case 'rss.feedback':
                renderFeedback(elements, value);
                break;

            default:
                throw new Error(`Unknown state! ${path}`);
        }
    });

    return watchedState;
};
