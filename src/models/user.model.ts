import mongoose from 'mongoose';
const Schema = mongoose.Schema
import bcrypt from 'bcrypt';

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
    default:false
  },
  firstname: {
    type: String,
    required: false,
    default:''
  },
  surname: {
    type: String,
    required: false,
    default:''
  },
  othername: {
    type: String,
    required: false,
    default:''
  },
  username: {
    type: String,
    required: false,
    default:''
  },
  usertype: {
    type: String,
    required: false,
    default:'SELLER'
  },
  phone: {
    type: String,
    required: false,
    default:''
  },
  bankAccount: {
    type: String,
    required: false,
    default:''
  },
  bankName: {
    type: String,
    required: false,
    default:''
  },
  wallet_address: {
    type: String,
    required: false,
    default:''
  },
  preferredCurrency: {
    type: String,
    required: false,
    default:'NGN'
  }
  ,
  reset_password_token: {
    type: String,
    required: false,
    default:''
  },
  reset_password_expires: {
    type: Date,
    required: false,
  },
})

UserSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(this.password, salt)
      this.password = hashedPassword
      this.username = 'User '+this._id
    }
    next()
  } catch (error:any) {
    next(error)
  }
})

UserSchema.methods.isValidPassword = async function (password:string) {
  try {
    return await bcrypt.compare(password, this.password)
  } catch (error) {
    throw error
  }
}

UserSchema.methods.getProfile = async function () {
  try {
    return {
      firstname:this.firstname,
      surname:this.surname,
      othername:this.othername,
      email:this.email,
      bankAccount:this.bankAccount,
      bankName:this.bankName,
      phone:this.phone,
      username:this.username
    }
  } catch (error) {
    throw error
  }
}


const User = mongoose.model('user', UserSchema)
export default User
