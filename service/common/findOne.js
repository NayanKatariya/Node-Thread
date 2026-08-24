const findOneRecord = async (model, filters, projection = null) => {
  const findData = await model.findOne({ ...filters }, projection);
  return findData || null;
};

module.exports = {
  findOneRecord,
};
