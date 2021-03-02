import axios from 'axios';
import * as yup from 'yup';
import i18n from 'i18next';
import _ from 'lodash';
import resources from './locales/index.js';
import parse from './parsers.js';
import initView from './view.js';

const buildProxyPath = (url) => {
    const proxyName = 'https://hexlet-allorigins.herokuapp.com';
    const params = { disableCache: true, url };

    const proxyUrl = new URL('/get', proxyName);
    const searchParams = new URLSearchParams(params);
    proxyUrl.search = searchParams;

    return proxyUrl;
};

const getContent = (url) =>
    axios.get(buildProxyPath(url)).then((response) => {
        if (response.status !== 200) {
            throw new Error('network error');
        }

        return response.data;
    });

const getFeed = (url) => {
    const feed = getContent(url)
        .catch((networtError) => {
            // TODO !!! MUST TEST !!!
            console.log(networtError);
        })
        .then((data) => parse(data.contents, url));

    return feed;
};

const validate = (url, collection) => {
    const schema = yup.string().url();

    if (_.some(collection, ['link', url])) {
        return i18n.t('errors.alreadyExist');
    }

    try {
        schema.validateSync(url);
        return '';
    } catch (error) {
        return error.message;
    }
};

const rssAddHandle = (watchedState) => (evt) => {
    evt.preventDefault();

    const formData = new FormData(evt.target);
    const url = formData.get('url');
    const validateError = validate(url, watchedState.rss.feeds);

    if (validateError !== '') {
        watchedState.rss.feedback = { type: 'error', message: validateError };
        return;
    }

    getFeed(url)
        .catch((parserError) => {
            console.log(parserError.message);
            watchedState.rss.feedback = { type: 'error', message: i18n.t('errors.parserError') };
        })
        .then((feed) => {
            if (!feed) {
                return;
            }

            const newestGuid = _.head(feed.items).guid;
            const uniquedPosts = feed.items.map((item) => ({ ...item, id: _.uniqueId() }));

            watchedState.rss.feeds.push({ ...feed, newestGuid, items: undefined });
            watchedState.rss.posts.unshift(...uniquedPosts);
            watchedState.rss.feedback = { type: 'success', message: i18n.t('success.downloaded') };
        });
    /* .catch((viewError) => {
            console.log(viewError.message);
        }) */
};

const init = () => {
    const updateInterval = 5000;
    const state = {
        rss: {
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
        form: document.querySelector('form.rss-form'),
        feeds: document.querySelector('.container-fluid .feeds'),
        posts: document.querySelector('.container-fluid .posts'),
        feedback: document.querySelector('.container-fluid .feedback'),
    };
    const watchedState = initView(elements, state);

    elements.form.addEventListener('submit', rssAddHandle(watchedState));

    const getNewPosts = (delay) => {
        const promises = state.rss.feeds.map(({ link }) => getFeed(link));

        Promise.allSettled(promises).then((results) => {
            const fulfilledFeeds = results
                .filter((result) => result.status === 'fulfilled')
                .map(({ value }) => value);

            fulfilledFeeds.forEach((incomingFeed) => {
                const { items } = incomingFeed;
                const currentFeed = state.rss.feeds.find((feed) => feed.link === incomingFeed.link);

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

        setTimeout(() => getNewPosts(delay), delay);
    };

    setTimeout(() => getNewPosts(updateInterval));
};

export default () => {
    const defaultLanguage = 'ru';

    i18n.init({
        lng: defaultLanguage,
        debug: true,
        resources,
    }).then(() => {
        console.log(i18n.t('success.init'));

        yup.setLocale({
            string: {
                url: i18n.t('errors.invalidUrl'),
            },
        });

        init();
    });
};
