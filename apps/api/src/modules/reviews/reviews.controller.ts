import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReviewsService } from './reviews.service';

export class SubmitReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  onTime?: boolean;

  @IsOptional()
  @IsBoolean()
  cargoCondition?: boolean;

  @IsOptional()
  @IsBoolean()
  communication?: boolean;
}

@ApiTags('reviews')
@ApiBearerAuth()
@Controller()
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  /**
   * Submit a review for a completed order.
   * The authenticated user's company is inferred from the JWT.
   */
  @Post('orders/:orderId/review')
  @UseGuards(RolesGuard)
  @Roles('CLIENT_ADMIN', 'CLIENT_USER', 'PROVIDER_ADMIN', 'PROVIDER_USER')
  submitReview(
    @Param('orderId') orderId: string,
    @Body() dto: SubmitReviewDto,
    @CurrentUser() actor: AuthUser,
  ) {
    if (!actor.companyId) {
      throw new Error('يجب أن تكون ضمن شركة لإضافة تقييم');
    }
    return this.reviews.submitReview(orderId, actor.companyId, dto);
  }

  /**
   * Get all reviews for a specific order.
   * No special auth guard — JWT is still validated globally but no role
   * restriction is applied here.
   */
  @Get('orders/:orderId/reviews')
  @Public()
  getOrderReviews(@Param('orderId') orderId: string) {
    return this.reviews.getOrderReviews(orderId);
  }

  /**
   * Get paginated reviews received by a company, including averageRating.
   */
  @Get('companies/:companyId/reviews')
  @Public()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getCompanyReviews(
    @Param('companyId') companyId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.reviews.getCompanyReviews(companyId, pageNum, limitNum);
  }
}
