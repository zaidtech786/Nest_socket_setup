import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
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

  @Get('diff')
  getDiff(
    @Query('time1') time1: string,
    @Query('time2') time2: string,
  ) {
    // Parse both times
    const t1 = new Date(time1);
    const t2 = new Date(`1970-01-01T${time2}Z`); // handle HH:mm:ss.SSS format

    // If second format is only time (like 16:26:46.564), 
    // we should combine it with today's date
    let finalT2: Date;
    if (isNaN(t2.getTime())) {
      // fallback: parse full datetime
      finalT2 = new Date(time2);
    } else {
      const today = new Date(time1); // keep same date as t1
      finalT2 = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        t2.getUTCHours(),
        t2.getUTCMinutes(),
        t2.getUTCSeconds(),
        t2.getUTCMilliseconds()
      );
    }

    const diffMs = Math.abs(finalT2.getTime() - t1.getTime());
    const diffSeconds = diffMs / 1000;

    return {
      time1: t1.toISOString(),
      time2: finalT2.toISOString(),
      differenceMs: diffMs,
      differenceSeconds: diffSeconds,
    };
  }


}
