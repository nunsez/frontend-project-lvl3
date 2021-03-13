import * as yup from 'yup';

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
