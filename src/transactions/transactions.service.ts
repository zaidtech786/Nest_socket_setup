import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectModel } from '@nestjs/mongoose';
import { transactionDocument, Transactions } from './transaction.schema';
import { Model } from 'mongoose';

@Injectable()
export class TransactionsService {
  constructor(@InjectModel(Transactions.name) private readonly transModel: Model<transactionDocument>){}
  async create(createTransactionDto: any) {
     const newTransactions = new this.transModel(createTransactionDto);
     try {
         await newTransactions.save();
         return newTransactions;
     } catch (error) {
      console.log(error)
     }
  }


  async findTransaction(data:any){
    try {
        const transaction = await this.transModel.find({txnId:data.txnId , userId:data.userId})
        if(!transaction){
          return "transaction not found"
        }
        return transaction
    } catch (error) {
      console.log(error)
    }
  }
  async updateTransaction(data:any){
    try {
        const transaction = await this.transModel.findByIdAndUpdate(data._id,{$set:{status:data.status}},{new:true})
        if(!transaction){
          return "transaction not found"
        }
        return transaction;
    } catch (error) {
      console.log(error)
    }
  }


}
