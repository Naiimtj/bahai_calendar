import { WebPlugin } from '@capacitor/core';

/**
 * Web fallback for BahaiCalendarNative — browsers have no device calendar
 * access, so every call resolves as "unsupported" rather than throwing where
 * a graceful empty result is expected, and rejects for write operations.
 */
export class BahaiCalendarNativeWeb extends WebPlugin {
  async requestFullCalendarAccess() {
    return { result: 'denied' };
  }

  async checkAllPermissions() {
    return {
      result: {
        readCalendar: 'denied',
        writeCalendar: 'denied',
        readReminders: 'denied',
        writeReminders: 'denied',
      },
    };
  }

  async listCalendars() {
    return { result: [] };
  }

  async listEventsInRange() {
    return { result: [] };
  }

  async searchMapPlaces() {
    return { result: [] };
  }

  async appleMapsPreview() {
    throw this.unimplemented(
      'Apple Maps preview is only available on native iOS.',
    );
  }

  async reverseGeocode() {
    throw this.unimplemented(
      'Apple reverse geocoding is only available on native iOS.',
    );
  }

  async createEvent() {
    throw this.unimplemented('Calendar access is not available on the web.');
  }

  async modifyEvent() {
    throw this.unimplemented('Calendar access is not available on the web.');
  }

  async deleteEvent() {
    throw this.unimplemented('Calendar access is not available on the web.');
  }

  async requestFullRemindersAccess() {
    return { result: 'denied' };
  }

  async getRemindersLists() {
    return { result: [] };
  }

  async getRemindersFromLists() {
    return { result: [] };
  }

  async createReminder() {
    throw this.unimplemented('Reminders are not available on the web.');
  }

  async modifyReminder() {
    throw this.unimplemented('Reminders are not available on the web.');
  }

  async deleteReminder() {
    throw this.unimplemented('Reminders are not available on the web.');
  }
}
