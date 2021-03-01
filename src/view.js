import onChange from 'on-change';
import i18n from 'i18next';

const markAsRead = (element) => () => {
    const titleEl = element.querySelector('a');
    titleEl.classList.remove('font-weight-bold');
    titleEl.classList.add('font-weight-normal');
};

const hideModal = () => {
    const modal = document.querySelector('#modal');
    modal.classList.remove('show');
    modal.removeAttribute('aria-modal');
    modal.removeAttribute('role');
    modal.setAttribute('aria-hidden', true);
    modal.removeAttribute('style');
    modal.style.display = 'none';

    const parent = modal.parentElement;
    parent.classList.remove('modal-open');
    parent.removeAttribute('style');

    const modalBackdrop = document.querySelector('.modal-backdrop');
    modalBackdrop.remove();
};

const showModal = (modal, post) => {
    modal.classList.add('show');
    modal.removeAttribute('aria-hidden');
    modal.style.paddingRight = '17px';
    modal.style.display = 'block';
    modal.setAttribute('aria-modal', true);

    const parent = modal.parentElement;
    parent.classList.add('modal-open');
    parent.style.paddingRight = '17px';

    const footer = parent.querySelector('footer');
    const modalBackdrop = document.createElement('div');
    modalBackdrop.classList.add('modal-backdrop', 'fade', 'show');
    footer.after(modalBackdrop);

    const titleEl = modal.querySelector('.modal-title');
    titleEl.textContent = post.title;

    const bodyEl = modal.querySelector('.modal-body');
    bodyEl.textContent = post.description;

    const readFullButton = modal.querySelector('.modal-footer > a');
    readFullButton.setAttribute('href', post.link);

    const escapeButton = modal.querySelector('.modal-header > .close');
    const closeButton = modal.querySelector('.modal-footer > button');

    [escapeButton, closeButton].forEach((el) => {
        el.addEventListener('click', hideModal);
    });
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
        const { title, description } = item;

        const feed = document.createElement('li');
        feed.classList.add('list-group-item');

        const feedHeader = document.createElement('h3');
        feedHeader.textContent = title;

        const feedDescription = document.createElement('p');
        feedDescription.textContent = description;

        feed.append(feedHeader, feedDescription);
        feedList.prepend(feed);
    });

    container.innerHTML = '';
    container.append(header, feedList);
};

const renderPosts = (elements, collection) => {
    const header = document.createElement('h2');
    header.textContent = i18n.t('posts');

    const fragment = document.createDocumentFragment();

    const postList = document.createElement('ul');
    postList.classList.add('list-group');

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

        watchButton.addEventListener('click', () => {
            showModal(elements.modal, item);
        });

        [titleEl, watchButton].forEach((el) => {
            el.addEventListener('click', markAsRead(post));
        });

        post.append(titleEl, watchButton);
        fragment.append(post);
    });

    elements.posts.innerHTML = '';
    postList.append(fragment);
    elements.posts.append(header, postList);
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
