const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = {
  stageSchema: (parentProperty) => {

    let baseSchemaProperties = {
      sequence: { type: Schema.Types.ObjectId, ref: 'outreachSequence', required: true },
      category: { type: String, required: true },
      date: { type: Date, required: true, default: Date.now },
      content: { type: Object, required: false },
      userId: { type: Schema.Types.ObjectId, ref: 'user', required: false },
      teamId: { type: Schema.Types.ObjectId, ref: 'team', required: false },
      listId: { type: Schema.Types.ObjectId, ref: 'list', required: false }
    }
    if (parentProperty)
      return new mongoose.Schema({ [parentProperty]: baseSchemaProperties });
    else
      return new mongoose.Schema(baseSchemaProperties);
  }
}