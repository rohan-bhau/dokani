import { settingsRepository, type SettingsRepository } from './settings.repository.js';
import type { UpdateSettingsInput } from '@dokani/shared';

export class SettingsService {
  constructor(private readonly repo: SettingsRepository = settingsRepository) {}

  async getSettings(tenantId: string) {
    return this.repo.getSettings(tenantId);
  }

  async updateSettings(tenantId: string, input: UpdateSettingsInput) {
    return this.repo.updateSettings(tenantId, input);
  }
}

export const settingsService = new SettingsService();
