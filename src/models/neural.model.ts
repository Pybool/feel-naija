import mongoose from 'mongoose';
const Schema = mongoose.Schema

const NeuralSchema = new Schema({
  approvalsLeft: {
    type: Number,
    default: 25,
    required: true,
  },
  igSession: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    required: false,
  },
  instagramLastLogin:{
    type: Date,
    default: '',
    required: false,
  },
})

const Neuron = mongoose.model('neuron', NeuralSchema);

export default Neuron
