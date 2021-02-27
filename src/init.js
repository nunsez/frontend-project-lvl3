import axios from 'axios';
import * as yup from 'yup';
import i18n from 'i18next';
import { some } from 'lodash';
import resources from './locales/index.js';
import parse from './parsers.js';
import initView from './view.js';

const t = i18n.t.bind(i18n);

const getContent = (url) =>
    axios.get(`https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`).then((response) => {
        if (response.status !== 200) {
            throw new Error('network error');
        }

        return response.data;
    });

const validate = (url, collection) => {
    const schema = yup.string().url();

    if (some(collection, ['link', url])) {
        return t('errors.alreadyExist');
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

    getContent(url)
        .catch((networtError) => {
            // TODO !!! MUST TEST !!!
            console.log(networtError.message);
        })
        .then((data) => {
            try {
                const feed = parse(data.contents, url);

                watchedState.rss.feeds.push({ ...feed, items: undefined });
                watchedState.rss.posts.unshift(...feed.items);
                watchedState.rss.feedback = { type: 'success', message: i18n.t('success.downloaded') };
            } catch {
                watchedState.rss.feedback = { type: 'error', message: i18n.t('errors.parserError') };
            }
        })
        .catch((viewError) => {
            console.log(viewError.message);
        });
};

const init = () => {
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
        modal: document.querySelector('#modal'),
        form: document.querySelector('form.rss-form'),
        feeds: document.querySelector('.container-fluid .feeds'),
        posts: document.querySelector('.container-fluid .posts'),
        feedback: document.querySelector('.container-fluid .feedback'),
    };
    const watchedState = initView(elements, state);

    elements.form.addEventListener('submit', rssAddHandle(watchedState));
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
