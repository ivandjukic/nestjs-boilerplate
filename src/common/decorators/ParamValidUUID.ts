import { Param, ParseUUIDPipe } from '@nestjs/common'

export const ParamValidUUID = (name: string) => Param(name, new ParseUUIDPipe())
