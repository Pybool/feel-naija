"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const NeuralSchema = new Schema({
    approvalsLeft: {
        type: Number,
        default: 25,
        required: true,
    },
    igSession: {
        type: mongoose_1.default.Schema.Types.Mixed,
        default: null,
        required: false,
    },
    instagramLastLogin: {
        type: Date,
        default: '',
        required: false,
    },
});
const Neuron = mongoose_1.default.model('neuron', NeuralSchema);
exports.default = Neuron;
