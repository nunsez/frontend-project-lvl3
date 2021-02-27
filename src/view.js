import onChange from 'on-change';
import i18n from 'i18next';

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

const renderPosts = (container, collection) => {
    const header = document.createElement('h2');
    header.textContent = i18n.t('posts');

    const fragment = document.createDocumentFragment();

    const postList = document.createElement('ul');
    postList.classList.add('list-group');

    collection.forEach((item) => {
        const { title, link, id } = item;

        const post = document.createElement('li');
        post.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');

        const titleEl = document.createElement('a');
        titleEl.textContent = title;
        titleEl.classList.add('font-weight-bold');
        titleEl.setAttribute('href', link);
        titleEl.setAttribute('target', '_blank');
        titleEl.setAttribute('rel', 'noopener noreferrer');
        titleEl.dataset.id = id;

        const watcButton = document.createElement('button');
        watcButton.textContent = i18n.t('inspect');
        watcButton.classList.add('btn', 'btn-primary', 'btn-sm');
        watcButton.setAttribute('type', 'button');
        watcButton.dataset.id = id;
        watcButton.dataset.toggle = 'modal';
        watcButton.dataset.target = '#modal';

        post.append(titleEl, watcButton);
        fragment.append(post);
    });

    container.innerHTML = '';
    postList.append(fragment);
    container.append(header, postList);
};

export default (elements, state) => {
    const watchedState = onChange(state, (path, value) => {
        switch (path) {
            case 'rss.feeds':
                renderFeeds(elements.feeds, value);
                elements.form.reset();
                break;

            case 'rss.posts':
                renderPosts(elements.posts, value);
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
