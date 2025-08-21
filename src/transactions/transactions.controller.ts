import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('create')
  create(@Body() createTransactionDto: any) {
    createTransactionDto.status = "success"
    return this.transactionsService.create(createTransactionDto);
  }

  @Post('getTransaction')
  getTransaction(@Body() createTransactionDto: any) {
    return this.transactionsService.findTransaction(createTransactionDto);
  }
  @Post('updateTransaction')
  updateTransaction(@Body() createTransactionDto: any) {
    return this.transactionsService.updateTransaction(createTransactionDto);
  }


}
