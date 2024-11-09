const mongoose=require ('mongoose')
const transactionSchema = new mongoose.Schema({
    type: {
        type: String, // Either 'credit' or 'debit'
        enum: ['credit', 'debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String, // Optional field for details about the transaction
        default: ''
    }
});
const walletSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true

        },
        transactions: [transactionSchema],
        balance:{
            type:Number,
            default:0
        },
        created:{
            type:Date,
            required:true,
            default:Date.now()
        }
})
module.exports=mongoose.model('Wallet',walletSchema)