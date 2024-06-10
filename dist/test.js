"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postToInsta = void 0;
const instagram_private_api_1 = require("instagram-private-api");
const request_promise_1 = require("request-promise");
const neural_model_1 = __importDefault(require("./src/models/neural.model"));
const saveSession = (async (session) => {
    console.log("I was called");
    let neuron = await neural_model_1.default.findOneAndUpdate({});
    if (!neuron) {
        neuron = await new neural_model_1.default();
    }
    if (!neuron.igSession) {
        neuron.igSession = session;
    }
    neuron.igSession = session;
    const savedNeuron = await neuron.save();
    console.log("Saved neuron ", savedNeuron);
});
const loadSession = (async () => {
    let neuron = await neural_model_1.default.findOneAndUpdate({});
    if (!neuron || !neuron.igSession) {
        return null;
    }
    return neuron;
});
const postToInsta = async () => {
    const username = process.env.INSTAGRAM_USERNAME;
    const password = process.env.INSTAGRAM_PASSWORD;
    const ig = new instagram_private_api_1.IgApiClient();
    ig.state.generateDevice(username);
    const session = await loadSession();
    if (session.igSession) {
        console.log("Using old session", session.igSession);
        await ig.state.deserialize(session.igSession);
    }
    else {
        console.log("Try to login");
        await ig.account.login(username, password);
        // This function executes after every request
        const serialized = await ig.state.serialize();
        delete serialized.constants; // this deletes the version info, so you'll always use the version provided by the library
        await saveSession(serialized);
    }
    const imageBuffer = await (0, request_promise_1.get)({
        url: 'http://69.49.247.218:8457/uploads/2023-11-22/image_1700655161705.jpeg',
        encoding: null,
    });
    await ig.publish.photo({
        file: imageBuffer,
        caption: 'Really nice photo from the internet!',
    });
};
exports.postToInsta = postToInsta;
