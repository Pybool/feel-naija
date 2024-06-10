"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    email_confirmed: {
        type: Boolean,
        required: true,
        default: false
    },
    firstname: {
        type: String,
        required: false,
        default: ''
    },
    surname: {
        type: String,
        required: false,
        default: ''
    },
    othername: {
        type: String,
        required: false,
        default: ''
    },
    username: {
        type: String,
        required: false,
        default: ''
    },
    phone: {
        type: String,
        required: false,
        default: ''
    },
    address: {
        type: String,
        required: false,
        default: ''
    },
    avatar: {
        type: String,
        required: false,
        default: 'shared/anon.jpeg'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    reset_password_token: {
        type: String,
        required: false,
        default: ''
    },
    reset_password_expires: {
        type: Date,
        required: false,
    },
});
UserSchema.pre('save', async function (next) {
    try {
        if (this.isNew) {
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(this.password, salt);
            this.password = hashedPassword;
            this.username = 'User ' + this._id;
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
UserSchema.methods.isValidPassword = async function (password) {
    try {
        return await bcryptjs_1.default.compare(password, this.password);
    }
    catch (error) {
        throw error;
    }
};
UserSchema.methods.getProfile = async function () {
    try {
        return {
            firstname: this.firstname,
            surname: this.surname,
            othername: this.othername,
            email: this.email,
            phone: this.phone,
            username: this.username,
            isAdmin: this.isAdmin,
            avatar: this.avatar,
            address: this.address
        };
    }
    catch (error) {
        throw error;
    }
};
const User = mongoose_1.default.model('user', UserSchema);
exports.default = User;
