import { Injectable } from '@nestjs/common'
import { HealthCheckResult, HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus'

@Injectable()
export class HealthService {
    constructor(
        private health: HealthCheckService,
        private db: TypeOrmHealthIndicator,
        private http: HttpHealthIndicator,
    ) {}

    public check(): Promise<HealthCheckResult> {
        return this.health.check([
            () => this.db.pingCheck('database', { timeout: 50000 }),
            () => this.http.pingCheck('http', 'https://google.com'),
        ])
    }
}
