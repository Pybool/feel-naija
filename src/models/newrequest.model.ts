import mongoose from 'mongoose';
const Schema = mongoose.Schema

const RequestFormSchema = new Schema({
  client: {
    type: Schema.Types.ObjectId, 
    ref: 'user',
    required: false,
  },
  phone: {
    type: String,
    default: '',
    required: true,
  },
  email: {
    type: String,
    default: '',
    required: true,
  },
  caption:{
    type: String,
    default: '',
    required: false,
  },
  request_images:{
    type: [],
    default: [], 
  },
  request_otp_code:{
    type: String,
    default: '',
    required: false,
  },

  isAuthorized:{
    type:Boolean,
    default:false,
    required:true
  },

  isAuthorized_time: {
    type: Date,
    default: '',
    required: false,
  },

  isPosted:{
    type:Boolean,
    default:false,
    required:true
  },

  isPosted_time: {
    type: Date,
    default: '',
    required: false,
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
