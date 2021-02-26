import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import * as yup from 'yup';
import { some } from 'lodash';
import parse from './parsers.js';
import initView from './view.js';

const getRss = (url, watchedState) =>
    axios
        .get(`https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`)
        .catch((networkError) => {
            watchedState.rss.feedback = { type: 'error', message: networkError.message };
        })
        .then((response) => {
            const { data } = response;
            const feed = parse(data.contents, url);

            return feed;
        })
        .catch((parserError) => {
            watchedState.rss.feedback = { type: 'error', message: parserError.message };
        });

const validate = (url, collection) => {
    const schema = yup.string().url('Ссылка должна быть валидным URL');

    if (some(collection, ['link', url])) {
        return 'RSS уже существует';
    }

    try {
        schema.validateSync(url);
        return '';
    } catch (error) {
        return error.message;
    }
};

export default () => {
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

    elements.form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const url = formData.get('url');
        const error = validate(url, state.rss.feeds);

        if (error !== '') {
            watchedState.rss.feedback = { type: 'error', message: error };
            return;
        }

        getRss(url, watchedState).then((feed) => {
            if (!feed) {
                return;
            }

            watchedState.rss.feeds.push({ ...feed, items: undefined });
            watchedState.rss.posts.unshift(...feed.items);
            watchedState.rss.feedback = { type: 'success', message: 'RSS успешно загружен' };
            console.log(state.rss.posts);
        });
    });
};
