import { uniqueId } from 'lodash';

const itemParse = (item) => {
    const children = item.children;
    const result = { id: uniqueId() };

    [...children].forEach((child) => {
        result[child.localName] = child.textContent;
    });

    return result;
};

export default (rss, link) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rss, 'application/xml');

    const parserError = doc.querySelector('parsererror');

    if (parserError) {
        throw new Error('Ресурс не содержит валидный RSS');
    }

    const title = doc.querySelector('title').textContent;
    const description = doc.querySelector('description').textContent;
    const items = [...doc.querySelectorAll('item')].map(itemParse);

    return { title, description, link, items };
};
