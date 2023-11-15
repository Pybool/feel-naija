import mongoose from 'mongoose';
const Schema = mongoose.Schema

const RequestFormSchema = new Schema({
  client: {
    type: Schema.Types.ObjectId, 
    ref: 'user',
    required: true,
  },
  request:{
    text: String,
    images: [String], // Array to store image URLs
  },
  date_initiated: {
    type: Date,
    default: Date.now,
    required: true,
  },

})

RequestFormSchema.post('save', async function (doc) {
    try {
      const newRecord = doc.toObject(); 
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
});

const RequestFormModel = mongoose.model('requests', RequestFormSchema);

export default RequestFormModel
