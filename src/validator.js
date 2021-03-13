import * as yup from 'yup';

yup.setLocale({
  string: {
    url: 'errors.unvalidUrl',
  },
  mixed: {
    notOneOf: 'errors.alreadyExist',
  },
});

const schema = yup.string().url();

const validate = (url, collection) => {
  const feedLinks = collection.map(({ link }) => link);

  try {
    schema.notOneOf(feedLinks).validateSync(url);
    return null;
  } catch (error) {
    return error;
  }
};

export default validate;
