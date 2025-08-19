import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type transactionDocument = Transactions & Document

@Schema({timestamps:true})
export class Transactions  {
    @Prop()
    amt:number

    @Prop()
    userId:string

    @Prop()
    txnId:string

    @Prop()
    status:string

}

export const transactionSchema = SchemaFactory.createForClass(Transactions)