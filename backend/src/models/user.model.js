import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    role:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
        minlength:8,
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null,
    },
    name: {
        type: String,
        trim: true,
    },
},{timestamps:true});

// Ensure we don't save username field (prevents index conflicts)
userSchema.pre('save', function() {
    // Remove username field if it exists (from old schema)
    if (this.username !== undefined) {
        delete this.username;
    }
});

const User = mongoose.model("User",userSchema);
export default User;