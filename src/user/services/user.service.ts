import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { UserFilterDto } from '../dto/user-filter.dto';
import { MeDto } from '../dto/me.dto';
import { KeycloakService } from 'src/authen/services/keycloak.service';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { Constants } from 'src/infrastructure/utils/constants';

@Injectable()
export class UserService {
  constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly keycloakService: KeycloakService,
  ) {}

  async findOne(userFilterDto: UserFilterDto) {
    const user = await this.userRepository.findOneWithCount(userFilterDto);

    if (!user) {
      throw new UserNotFoundException();
    }
    const isPhotographer = await this.keycloakService.isUserHasRole(
      user.id,
      Constants.PHOTOGRAPHER_ROLE,
    );

    const meDto = new MeDto(
      user,
      isPhotographer ? Constants.PHOTOGRAPHER_ROLE : Constants.CUSTOMER_ROLE,
    );

    return meDto;
  }
}
